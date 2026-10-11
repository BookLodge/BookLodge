import React, { useState, useEffect, useRef } from "react";
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
const HOTELS_PER_PAGE = 8;

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
  const [currentPage, setCurrentPage] = useState(1);

  const resultsTopRef = useRef(null);

  const [filters, setFilters] = useState({
    ratingTiers: [],
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
      setCurrentPage(1);
      return;
    }

    const fetchHotels = async () => {
      setLoading(true);
      setCurrentPage(1);
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

  // Reset page to 1 when filters change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const filteredHotels = hotels.filter((hotel) => {
    const score = Number(hotel.rating || 0);

    // 3 Requested Rating Tiers: 8.0 - 10, 5.1 - 7.9, 5.0 & Below
    if (filters.ratingTiers && filters.ratingTiers.length > 0) {
      const matchesAnyTier = filters.ratingTiers.some((tier) => {
        if (tier === "tier_high") return score >= 8.0;
        if (tier === "tier_mid") return score >= 5.1 && score < 8.0;
        if (tier === "tier_low") return score <= 5.0;
        return false;
      });
      if (!matchesAnyTier) return false;
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

  const handleResetFilters = () => {
    setFilters({ ratingTiers: [], maxPrice: 3000, breakfastOnly: false });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredHotels.length / HOTELS_PER_PAGE);
  const startIndex = (currentPage - 1) * HOTELS_PER_PAGE;
  const endIndex = Math.min(startIndex + HOTELS_PER_PAGE, filteredHotels.length);
  const paginatedHotels = filteredHotels.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SearchWidget initialCompact={true} />

      <div ref={resultsTopRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-black">
            {city ? ("Hotels in " + city) : "Search for a destination"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {city
              ? (filteredHotels.length > 0 
                  ? "Showing " + (startIndex + 1) + "–" + endIndex + " of " + filteredHotels.length + " propert" + (filteredHotels.length === 1 ? "y" : "ies")
                  : "0 properties found")
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
              onFilterChange={handleFilterChange}
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
          ) : paginatedHotels.length > 0 ? (
            <>
              <div className="space-y-4">
                {paginatedHotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} nights={nights} />
                ))}
              </div>

              {/* Hotel Search Results Pagination */}
              {totalPages > 1 && (
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200">
                  <span className="text-xs text-slate-500 font-medium">
                    Page {currentPage} of {totalPages} ({filteredHotels.length} total properties)
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* Prev */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={"px-3 py-1.5 text-xs font-semibold rounded-md border transition " + (
                        currentPage === 1
                          ? "text-slate-300 border-stone-200 cursor-not-allowed bg-stone-50"
                          : "text-slate-700 border-stone-300 hover:bg-stone-50 cursor-pointer"
                      )}
                    >
                      &larr; Previous
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 7) {
                        pageNum = i + 1;
                      } else if (currentPage <= 4) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i;
                      } else {
                        pageNum = currentPage - 3 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          style={pageNum === currentPage ? { backgroundColor: "#254546", color: "#fefae0" } : {}}
                          className={"w-8 h-8 text-xs font-bold rounded-md transition cursor-pointer " + (
                            pageNum === currentPage
                              ? "shadow-xs"
                              : "text-slate-700 hover:bg-stone-100 border border-stone-200"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next */}
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={"px-3 py-1.5 text-xs font-semibold rounded-md border transition " + (
                        currentPage === totalPages
                          ? "text-slate-300 border-stone-200 cursor-not-allowed bg-stone-50"
                          : "text-slate-700 border-stone-300 hover:bg-stone-50 cursor-pointer"
                      )}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg border border-stone-200 p-12 text-center space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-black">No properties matched your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your price range, selecting different rating tiers, or searching another destination.
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
