import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { hotelService } from "../../services/hotelService";
import { addDays, format, isBefore, parseISO } from "date-fns";

export const SearchWidget = ({ initialCompact = false }) => {
  const navigate = useNavigate();
  const { searchParams, updateSearchParams } = useBooking();

  const [city, setCity] = useState(searchParams.city || "");
  const [placeId, setPlaceId] = useState(searchParams.placeId || "");
  const [checkIn, setCheckIn] = useState(searchParams.checkIn || format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [checkOut, setCheckOut] = useState(searchParams.checkOut || format(addDays(new Date(), 4), "yyyy-MM-dd"));
  const [guests, setGuests] = useState(searchParams.guests || 2);
  const [error, setError] = useState("");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const isUserTyping = useRef(false);
  const dropdownContainerRef = useRef(null);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Keep internal state in sync if searchParams changes from outside (e.g. Logo click reset)
  useEffect(() => {
    isUserTyping.current = false;
    setCity(searchParams.city || "");
    setPlaceId(searchParams.placeId || "");
    if (searchParams.checkIn) setCheckIn(searchParams.checkIn);
    if (searchParams.checkOut) setCheckOut(searchParams.checkOut);
    if (searchParams.guests) setGuests(searchParams.guests);
    setIsDropdownOpen(false);
  }, [searchParams.city, searchParams.placeId, searchParams.checkIn, searchParams.checkOut, searchParams.guests]);

  // Debounced search for locations via BookLodge backend API
  useEffect(() => {
    if (!city || city.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingLocations(true);
      try {
        const res = await hotelService.getPlaces(city.trim());
        const locs = res.data?.locations || [];
        setSuggestions(locs);
        if (isUserTyping.current && locs.length > 0) {
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error("Autocomplete search error", err);
        setSuggestions([]);
      } finally {
        setIsLoadingLocations(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [city]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCityChange = (e) => {
    isUserTyping.current = true;
    const val = e.target.value;
    setCity(val);
    setPlaceId("");
    setSelectedIndex(-1);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSelectLocation = (loc) => {
    isUserTyping.current = false;
    const fullDisplayName = loc.address ? `${loc.name}, ${loc.address}` : loc.name;
    setCity(fullDisplayName);
    setPlaceId(loc.placeId || "");
    setIsDropdownOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectLocation(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    isUserTyping.current = false;
    setError("");
    setIsDropdownOpen(false);

    if (!city.trim()) {
      setError("Please enter a destination city");
      return;
    }

    if (isBefore(parseISO(checkOut), parseISO(checkIn)) || checkIn === checkOut) {
      setError("Check-out date must be after check-in date");
      return;
    }

    updateSearchParams({ city, placeId, checkIn, checkOut, guests: Number(guests) });
    const placeIdQuery = placeId ? `&placeId=${encodeURIComponent(placeId)}` : "";
    navigate(
      `/search?city=${encodeURIComponent(city)}${placeIdQuery}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    );
  };

  return (
    <div
      className={
        "bg-white rounded-lg border border-stone-300 shadow-xs w-full max-w-full box-border " +
        (initialCompact ? "p-4" : "p-5 sm:p-6")
      }
    >
      <form onSubmit={handleSearch} className="space-y-4 w-full max-w-full box-border">
        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 w-full max-w-full box-border">
          {/* Destination - Native React Autocomplete */}
          <div className="relative w-full min-w-0 max-w-full box-border" ref={dropdownContainerRef}>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Destination
            </label>
            <div className="relative w-full min-w-0 max-w-full box-border">
              <input
                type="text"
                value={city}
                onChange={handleCityChange}
                onFocus={() => {
                  if (isUserTyping.current && suggestions.length > 0) setIsDropdownOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. London, UK or Lagos, Nigeria"
                className="w-full min-w-0 max-w-full box-border px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition block"
              />
              {isLoadingLocations && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-3.5 h-3.5 border-2 border-stone-400 border-t-[#254546] rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isDropdownOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                {suggestions.map((loc, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={loc.placeId || idx}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center space-x-2.5 transition cursor-pointer text-xs ${
                        isSelected
                          ? "bg-stone-100 text-black font-semibold"
                          : "text-slate-700 hover:bg-stone-50"
                      }`}
                    >
                      <span className="text-sm shrink-0 leading-none">📍</span>
                      <div className="flex-1 truncate">
                        <span className="font-bold text-black">{loc.name}</span>
                        {loc.address && (
                          <span className="text-slate-400 ml-1.5 truncate">
                            {loc.address}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Check-in */}
          <div className="w-full min-w-0 max-w-full box-border">
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Check-In Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (isBefore(parseISO(checkOut), parseISO(e.target.value))) {
                  setCheckOut(format(addDays(parseISO(e.target.value), 2), "yyyy-MM-dd"));
                }
              }}
              className="w-full min-w-0 max-w-full box-border px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition block"
            />
          </div>

          {/* Check-out */}
          <div className="w-full min-w-0 max-w-full box-border">
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
              Check-Out Date
            </label>
            <input
              type="date"
              min={checkIn}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full min-w-0 max-w-full box-border px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition block"
            />
          </div>

          {/* Guests + Search Button */}
          <div className="flex gap-2 items-end w-full min-w-0 max-w-full box-border">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1">
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                className="w-full min-w-0 max-w-full box-border px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition cursor-pointer block"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4+ Guests</option>
              </select>
            </div>

            <button
              type="submit"
              style={{ backgroundColor: "#254546", color: "#fefae0" }}
              className="font-semibold px-6 py-2.5 rounded-md transition hover:opacity-90 cursor-pointer whitespace-nowrap shrink-0"
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
