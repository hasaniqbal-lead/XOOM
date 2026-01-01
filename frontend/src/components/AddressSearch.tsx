import { useState, useEffect, useRef, ReactNode } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { geocodingService, AutocompleteResult } from '@/services/geocoding';

interface AddressSearchProps {
  icon?: ReactNode;
  placeholder: string;
  value: string;
  onSelect: (result: {
    address: string;
    lat: number;
    lng: number;
    display_name: string;
  }) => void;
  userLocation?: { lat: number; lng: number };
  disabled?: boolean;
}

const AddressSearch = ({
  icon,
  placeholder,
  value,
  onSelect,
  userLocation,
  disabled = false,
}: AddressSearchProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Update query when value prop changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (query.length >= 3) {
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await geocodingService.autocomplete(query, {
            lat: userLocation?.lat,
            lng: userLocation?.lng,
            limit: 5,
          });
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Autocomplete error:', error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, userLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setQuery(e.target.value);
  };

  const handleSelectSuggestion = (suggestion: AutocompleteResult) => {
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    onSelect({
      address: suggestion.display_name,
      lat: suggestion.lat,
      lng: suggestion.lng,
      display_name: suggestion.display_name,
    });
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Card className={`xoom-surface-elevated p-1 ${disabled ? 'opacity-75 bg-muted/30' : ''}`}>
        <div className="flex items-center gap-3 px-3">
          {icon || <Search className="w-5 h-5 text-muted-foreground" />}
          <Input
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-12 ${disabled ? 'cursor-not-allowed' : ''}`}
          />
          {loading && !disabled && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </Card>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-64 overflow-y-auto shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-start gap-3 border-b last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {suggestion.display_name}
                </p>
                {suggestion.type && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {suggestion.type}
                  </p>
                )}
              </div>
            </button>
          ))}
        </Card>
      )}

      {/* No results */}
      {showSuggestions && !loading && query.length >= 3 && suggestions.length === 0 && (
        <Card className="absolute z-50 w-full mt-2 p-4 shadow-lg">
          <p className="text-sm text-muted-foreground text-center">
            No locations found. Try a different search.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AddressSearch;
