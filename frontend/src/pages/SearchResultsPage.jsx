import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import { useBooking } from "../context/BookingContext";
import { HotelCard } from "../components/hotel/HotelCard";
import { FilterSidebar } from "../components/hotel/FilterSidebar";
import { SkeletonHotelCard } from "../components/common/SkeletonCard";
import { SearchWidget } from "../components/hotel/SearchWidget";
import { addDays, format, differenceInCalendarDays, parseISO } from "date-fns";

const defaultCheckIn = format(addDays(new Date(), 1), "yyyy-MM-dd");
const defaultCheckOut = format(addDays(new Date(), 4), "yyyy-MM-dd");

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const { updateSearchParams } = useBooking();

  const city = searchParams.get("city") || "";
  const placeId = searchParams.get("placeId") || "";
  const checkIn = searchParams.get("checkIn") || defaultCheckIn;
  const checkOut = searchParams.get("checkOut") || defaultCheckOut;
  const guests = searchParams.get("guests") || 2;

  const nights = Math.max(1, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))) || 1;

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    stars: [],
    maxPrice: 3000,
    breakfastOnly: false
  });

  useEffect(() => {
    if (city.trim()) {
      updateSearchParams({ city, placeId, checkIn, checkOut, guests: Number(guests) });
    }
  }, [city, placeId, checkIn, checkOut, guests, updateSearchParams]);

  useEffect(() => {
    if (!city.trim()) {
      setLoading(false);
      setHotels([]);
      return;
    }

    const fetchHotels = async () => {
      setLoading(true);
      try {
        let activePlaceId = placeId;
        if (!activePlaceId) {
          const locRes = await hotelService.getPlaces(city);
          const places = locRes.data?.locations || [];
          if (places.length > 0) {
            activePlaceId = places[0].placeId;
          }
        }

        if (!activePlaceId) {
          setHotels([]);
          return;
        }

        const res = await hotelService.searchHotels({
          placeId: activePlaceId,
          city,
          checkIn,
          checkOut,
          guests
        });
        setHotels(res.data?.hotels || []);
      } catch (err) {
        console.error("Error fetching hotels", err);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [city, placeId, checkIn, checkOut, guests]);

  const filteredHotels = hotels.filter((hotel) => {
    // Star rating filter
    if (filters.stars && filters.stars.length > 0) {
      const ratingVal = Math.round(Number(hotel.rating || hotel.starRating || 0));
      if (!filters.stars.includes(ratingVal)) return false;
    }

    // Max price per night filter
    const totalAmount = hotel.startingRate?.amount || 0;
    const perNight = Math.round(totalAmount / nights);
    if (filters.maxPrice && perNight > filters.maxPrice) return false;

    // Breakfast included filter
    if (filters.breakfastOnly) {
      const boardName = (hotel.startingRate?.boardName || '').toLowerCase();
      const hasBreakfast = boardName.includes('breakfast') || boardName.includes('bed & breakfast') || boardName.includes('half board') || boardName.includes('full board') || boardName.includes('all inclusive');
      if (!hasBreakfast) return false;
    }

    return true;
  });

  const handleResetFilters = () => setFilters({ stars: [], maxPrice: 3000, breakfastOnly: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SearchWidget initialCompact={true} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-black">
            {city ? ("Hotels in " + city) : "Search for a destination"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {city
              ? ("Showing " + filteredHotels.length + " propert" + (filteredHotels.length === 1 ? "y" : "ies"))
              : "Enter a city above and press Search to find hotels"}
          </p>
        </div>

        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="lg:hidden text-xs font-semibold bg-white border border-stone-200 px-4 py-2 rounded-md self-start cursor-pointer"
        >
          {mobileFilterOpen ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className={"lg:block " + (mobileFilterOpen ? "block" : "hidden") + " lg:col-span-1"}>
          <div className="sticky top-20">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              maxAvailablePrice={3000}
            />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {!city.trim() ? (
            <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3 shadow-xs">
              <p className="text-sm font-semibold text-black">Enter a destination to get started</p>
              <p className="text-xs text-slate-400">Type a city in the search bar above and press Search.</p>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <SkeletonHotelCard />
              <SkeletonHotelCard />
              <SkeletonHotelCard />
            </div>
          ) : filteredHotels.length > 0 ? (
            filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} nights={nights} />
            ))
          ) : (
            <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-black">No properties matched your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your price range, selecting different star ratings, or searching another destination.
              </p>
              <button
                onClick={handleResetFilters}
                style={{ backgroundColor: "#254546", color: "#fefae0" }}
                className="text-xs font-semibold px-4 py-2 rounded-md transition hover:opacity-90 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
