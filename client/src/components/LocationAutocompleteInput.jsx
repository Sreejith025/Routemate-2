import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X, Search } from "lucide-react";
import axios from "axios";

const LocationAutocompleteInput = ({
  value = "",
  onChange,
  onSelectLocation,
  placeholder = "Search location...",
  icon: Icon = MapPin,
  iconColor = "text-indigo-400",
  focusBorderColor = "focus:border-indigo-500",
  className = "",
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync internal query with prop value when updated externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions from Nominatim API with 350ms debounce
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (onChange) onChange(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!newValue.trim() || newValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            newValue
          )}&limit=5`
        );

        if (response.data && Array.isArray(response.data)) {
          setSuggestions(response.data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Nominatim search error:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (item) => {
    const address = item.address || {};
    const placeName = item.name || item.display_name.split(",")[0];
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.suburb ||
      address.county ||
      "";
    const state = address.state || "";
    const country = address.country || "";

    const selectedData = {
      name: placeName,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      city,
      state,
      country,
    };

    setQuery(placeName);
    if (onChange) onChange(placeName);
    if (onSelectLocation) onSelectLocation(selectedData);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) onChange("");
    if (onSelectLocation) onSelectLocation(null);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        {Icon && (
          <Icon
            className={`w-4 h-4 ${iconColor} absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none z-10`}
          />
        )}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl ${
            Icon ? "pl-10" : "pl-4"
          } pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none ${focusBorderColor} transition-all duration-200`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 top-full mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-800/60 text-xs">
          {loading ? (
            <div className="p-3.5 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Fetching location suggestions...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3.5 text-center text-slate-400">
              No matching locations found
            </div>
          ) : (
            suggestions.map((item, idx) => {
              const address = item.address || {};
              const placeName = item.name || item.display_name.split(",")[0];
              const city =
                address.city ||
                address.town ||
                address.village ||
                address.suburb ||
                address.county ||
                "";
              const state = address.state || "";
              const country = address.country || "";

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left p-3 hover:bg-indigo-600/10 hover:border-l-4 hover:border-l-indigo-500 transition-all flex items-start space-x-3 group"
                >
                  <MapPin className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="font-bold text-white text-xs truncate group-hover:text-indigo-300">
                      {placeName}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {[city, state, country].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocompleteInput;
