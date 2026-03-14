/**
 * Destination Search Component
 * Uses OpenStreetMap Nominatim API for geocoding
 * Provides autocomplete dropdown for destination selection
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '@/utils/debounce';
import { NominatimResult, Coordinates } from '@/types/models';

const SUGGESTION_LIMIT = 12;

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildSearchUrl = (searchQuery: string) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: searchQuery,
    limit: String(SUGGESTION_LIMIT),
    addressdetails: '1',
    dedupe: '0',
    countrycodes: 'bd',
    'accept-language': 'en,bn',
  });

  return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
};

const rankAndFilterResults = (data: NominatimResult[], searchQuery: string): NominatimResult[] => {
  const normalizedQuery = normalizeText(searchQuery);
  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const seen = new Set<string>();

  const scored = data
    .filter((item) => {
      const key = `${item.lat}:${item.lon}:${item.display_name}`;
      if (seen.has(key)) return false;
      seen.add(key);

      const display = item.display_name.toLowerCase();
      return display.includes('bangladesh') || display.includes(', bd');
    })
    .map((item) => {
      const normalizedName = normalizeText(item.display_name);
      let score = 0;

      if (normalizedName.startsWith(normalizedQuery)) score += 120;
      if (normalizedName.includes(normalizedQuery)) score += 80;

      const tokenMatches = queryTokens.filter((token) => normalizedName.includes(token)).length;
      score += tokenMatches * 20;

      if (item.display_name.includes(',')) score += 5;

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  return scored.slice(0, SUGGESTION_LIMIT);
};

interface DestinationSearchProps {
  onDestinationSelect: (name: string, coords: Coordinates) => void;
  disabled?: boolean;
  selectedDestination?: string;
}

const DestinationSearch: React.FC<DestinationSearchProps> = ({
  onDestinationSelect,
  disabled = false,
  selectedDestination = '',
}) => {
  const [query, setQuery] = useState(selectedDestination);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Nominatim API search function
  const searchPlaces = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(buildSearchUrl(searchQuery), {
        headers: {
          // Nominatim requires a valid User-Agent
          'User-Agent': 'RideSplitMatch/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: NominatimResult[] = await response.json();
      let rankedResults = rankAndFilterResults(data, searchQuery);

      // Fallback search for spelling variance: reorder words and search again if needed.
      if (rankedResults.length === 0 && searchQuery.trim().includes(' ')) {
        const reversedQuery = searchQuery
          .trim()
          .split(/\s+/)
          .reverse()
          .join(' ');

        const fallbackResponse = await fetch(buildSearchUrl(reversedQuery), {
          headers: {
            'User-Agent': 'RideSplitMatch/1.0',
          },
        });

        if (fallbackResponse.ok) {
          const fallbackData: NominatimResult[] = await fallbackResponse.json();
          rankedResults = rankAndFilterResults(fallbackData, searchQuery);
        }
      }

      setResults(rankedResults);
      setShowDropdown(true);
    } catch (err) {
      console.error('Nominatim search error:', err);
      setError('Failed to search places in Bangladesh. Please try again.');
      setResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search (400ms delay)
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      searchPlaces(searchQuery);
    }, 400),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle destination selection
  const handleSelect = (result: NominatimResult) => {
    const coords: Coordinates = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    
    // Shorten the display name for UI
    const shortName = result.display_name.split(',').slice(0, 2).join(',');
    
    setQuery(shortName);
    setShowDropdown(false);
    setResults([]);
    onDestinationSelect(shortName, coords);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update query when selectedDestination changes
  useEffect(() => {
    setQuery(selectedDestination);
  }, [selectedDestination]);

  return (
    <div className="destination-search" ref={dropdownRef}>
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search destination in Bangladesh..."
          disabled={disabled}
          className="search-input"
        />
        {isLoading && <span className="search-loading"></span>}
      </div>

      <div className="search-hint">
        Bangladesh locations only. Type place names as shown on map labels for best results.
      </div>

      {error && <div className="search-error">{error}</div>}

      {showDropdown && results.length > 0 && (
        <ul className="search-results">
          {results.map((result) => (
            <li
              key={result.place_id}
              onClick={() => handleSelect(result)}
              className="search-result-item"
            >
              📍 {result.display_name}
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .destination-search {
          position: relative;
          flex: 1;
        }

        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input {
          width: 100%;
          padding: 14px 48px 14px 18px;
          font-size: 15px;
          color: #e2e8f0;
          background: linear-gradient(135deg, #0f1729 0%, #162033 100%);
          border: 2px solid #1e3a5f;
          border-radius: 12px;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), 0 0 20px rgba(59, 130, 246, 0.1);
          background: linear-gradient(135deg, #0d1421 0%, #152238 100%);
        }

        .search-input:disabled {
          background: #0a1220;
          border-color: #1a2d47;
          color: #475569;
          cursor: not-allowed;
        }

        .search-loading {
          position: absolute;
          right: 16px;
          width: 20px;
          height: 20px;
          border: 2px solid #1e3a5f;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .search-error {
          color: #f87171;
          font-size: 12px;
          margin-top: 6px;
          padding-left: 4px;
        }

        .search-hint {
          margin-top: 6px;
          font-size: 12px;
          color: #7aa2cf;
          padding-left: 4px;
        }

        .search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: linear-gradient(180deg, #132238 0%, #0d1b2a 100%);
          border: 1px solid #1e3a5f;
          border-radius: 12px;
          max-height: 240px;
          overflow-y: auto;
          z-index: 1000;
          list-style: none;
          padding: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(59, 130, 246, 0.1);
          animation: dropdownFade 0.25s ease;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .search-result-item {
          padding: 14px 16px;
          cursor: pointer;
          font-size: 14px;
          color: #cbd5e1;
          border-radius: 8px;
          transition: all 0.25s ease;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          animation: itemSlide 0.3s ease backwards;
        }

        .search-result-item:nth-child(1) { animation-delay: 0.05s; }
        .search-result-item:nth-child(2) { animation-delay: 0.1s; }
        .search-result-item:nth-child(3) { animation-delay: 0.15s; }
        .search-result-item:nth-child(4) { animation-delay: 0.2s; }
        .search-result-item:nth-child(5) { animation-delay: 0.25s; }

        @keyframes itemSlide {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .search-result-item:hover {
          background: linear-gradient(135deg, #1e3a5f 0%, #234569 100%);
          color: #60a5fa;
          transform: translateX(4px);
        }

        /* Custom scrollbar for dark theme */
        .search-results::-webkit-scrollbar {
          width: 6px;
        }

        .search-results::-webkit-scrollbar-track {
          background: #0d1b2a;
          border-radius: 3px;
        }

        .search-results::-webkit-scrollbar-thumb {
          background: #1e3a5f;
          border-radius: 3px;
        }

        .search-results::-webkit-scrollbar-thumb:hover {
          background: #2d4a6f;
        }
      `}</style>
    </div>
  );
};

export default DestinationSearch;
