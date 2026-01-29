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
        {isLoading && <span className="search-loading">🔍</span>}
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
          padding: 12px 16px;
          font-size: 14px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
        }

        .search-input:focus {
          border-color: #4CAF50;
        }

        .search-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .search-loading {
          position: absolute;
          right: 12px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .search-error {
          color: #f44336;
          font-size: 12px;
          margin-top: 4px;
        }

        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          margin-top: 4px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          list-style: none;
          padding: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .search-result-item {
          padding: 12px 16px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background-color: #f5f5f5;
        }
      `}</style>
    </div>
  );
};

export default DestinationSearch;
