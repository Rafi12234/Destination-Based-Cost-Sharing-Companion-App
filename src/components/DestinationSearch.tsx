/**
 * Destination Search Component
 * Uses OpenStreetMap Nominatim API for geocoding
 * Provides autocomplete dropdown for destination selection
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { debounce } from '@/utils/debounce';
import { NominatimResult, Coordinates } from '@/types/models';

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
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`,
        {
          headers: {
            // Nominatim requires a valid User-Agent
            'User-Agent': 'RideSplitMatch/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: NominatimResult[] = await response.json();
      setResults(data);
      setShowDropdown(true);
    } catch (err) {
      console.error('Nominatim search error:', err);
      setError('Failed to search. Please try again.');
      setResults([]);
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
          placeholder="Enter your destination..."
          disabled={disabled}
          className="search-input"
        />
        {isLoading && <span className="search-loading"></span>}
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
