import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import { useBooking } from "../context/BookingContext";
import { RoomOfferCard } from "../components/hotel/RoomOfferCard";
import { SkeletonRoomCard } from "../components/common/SkeletonCard";
import { differenceInCalendarDays, parseISO } from "date-fns";

const ROOMS_PER_PAGE = 5;

const matchRoomCatalog = (rateName, roomCatalog = []) => {
  if (!rateName || !roomCatalog.length) return null;
  const cleanRate = rateName.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Exact or containment match
  const direct = roomCatalog.find((r) => {
    const cleanR = (r.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleanRate.includes(cleanR) || cleanR.includes(cleanRate);
  });
  if (direct) return direct;

  // Keyword match
  const keywords = [
    "suite", "apartment", "deluxe", "superior", "executive",
    "standard", "double", "single", "twin", "family", "king",
    "queen", "studio", "villa", "penthouse", "bungalow", "cottage"
  ];
  for (const kw of keywords) {
    if (cleanRate.includes(kw)) {
      const match = roomCatalog.find((r) => (r.name || "").toLowerCase().includes(kw));
      if (match) return match;
    }
  }

  return roomCatalog[0] || null;
};

export const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { searchParams, selectOffer } = useBooking();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const roomsSectionRef = useRef(null);

  const nights = Math.max(
    1,
    differenceInCalendarDays(parseISO(searchParams.checkOut), parseISO(searchParams.checkIn)) || 1
  );

  useEffect(() => {
    const fetchHotelDetails = async () => {
      setLoading(true);
      setCurrentPage(1);
      try {
        const res = await hotelService.getHotelDetails(id, {
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          guests: searchParams.guests,
          currency: searchParams.currency || "USD"
        });

        const hotelData = res.data;
        if (!hotelData) {
          setHotel(null);
          setRooms([]);
          return;
        }

        const cleanDesc = (hotelData.description || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        // Extract normalized hotel photo URLs
        const allHotelPhotos = (hotelData.photos || [])
          .map((p) => (typeof p === "string" ? p : p?.url || p?.hd_url))
          .filter(Boolean);

        if (hotelData.photo && !allHotelPhotos.includes(hotelData.photo)) {
          allHotelPhotos.unshift(hotelData.photo);
        }

        const fallbackPhoto = allHotelPhotos[0] || hotelData.photo || "/placeholder-hotel.jpg";

        setHotel({
          ...hotelData,
          photo: fallbackPhoto,
          photos: allHotelPhotos.length > 0 ? allHotelPhotos : [fallbackPhoto],
          description: cleanDesc
        });

        // Group rates by distinct roomName and pick the best (lowest) price for each
        const ratesMap = new Map();
        (hotelData.rates || []).forEach((r) => {
          const key = (r.roomName || "").trim();
          const existing = ratesMap.get(key);
          if (!existing || r.amount < existing.amount) {
            ratesMap.set(key, r);
          }
        });

        const catalogRooms = hotelData.rooms || [];

        const formattedRooms = Array.from(ratesMap.values()).map((r, idx) => {
          const matchedCatalogRoom = matchRoomCatalog(r.roomName, catalogRooms);

          // Extract specific room photos if available
          const specificRoomPhotos = (matchedCatalogRoom?.photos || [])
            .map((p) => (typeof p === "string" ? p : p?.url || p?.hd_url))
            .filter(Boolean);

          const finalRoomPhotos = specificRoomPhotos.length > 0
            ? specificRoomPhotos
            : (allHotelPhotos.length > 0 ? allHotelPhotos.slice(0, 4) : [fallbackPhoto]);

          return {
            id: r.offerId || ('room_' + idx),
            offerId: r.offerId,
            name: r.roomName,
            boardType: r.boardName,
            image: finalRoomPhotos[0] || fallbackPhoto,
            photos: finalRoomPhotos,
            cancellationPolicy: r.refundable ? "Free Cancellation" : "Non-Refundable",
            isRefundable: r.refundable,
            totalPrice: Math.round(r.amount),
            pricePerNight: Math.max(1, Math.round(r.amount / nights)),
            currency: r.currency || "USD",
            maxOccupancy: matchedCatalogRoom?.maxOccupancy || r.occupancyNumber || searchParams.guests || 2,
            bedType: matchedCatalogRoom?.bedType || "Standard Room Setup",
            amenities: matchedCatalogRoom?.amenities && matchedCatalogRoom.amenities.length > 0
              ? matchedCatalogRoom.amenities
              : ["Free Wi-Fi", "Private Bathroom", "Climate Control"]
          };
        });

        setRooms(formattedRooms);
      } catch (err) {
        console.error("Failed to load hotel detail", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id, searchParams.checkIn, searchParams.checkOut, searchParams.guests, searchParams.currency, nights]);

  const handleSelectRoom = (room) => {
    selectOffer(hotel, room);
    navigate("/checkout");
  };

  const openGalleryAt = (index) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const totalPages = Math.ceil(rooms.length / ROOMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROOMS_PER_PAGE, rooms.length);
  const paginatedRooms = rooms.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    if (roomsSectionRef.current) {
      roomsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="h-96 bg-slate-200 animate-pulse rounded-lg" />
        <SkeletonRoomCard />
        <SkeletonRoomCard />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Hotel Not Found</h2>
        <button
          onClick={() => navigate("/search")}
          className="mt-4 bg-[#254546] text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer hover:opacity-90 transition"
        >
          Return to Search
        </button>
      </div>
    );
  }

  const galleryPhotos = hotel.photos || [hotel.photo];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer"
      >
        <span>&larr; Back to search results</span>
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md">
              {hotel.rating || 4} Star
            </span>
            <span className="bg-stone-50 text-[#254546] text-xs font-semibold px-2.5 py-1 rounded-md border border-stone-200">
              {hotel.city}, {hotel.country}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-black tracking-tight">
            {hotel.name}
          </h1>

          <p className="flex items-center text-xs text-slate-500 mt-2">
            <span>{hotel.address}</span>
          </p>
        </div>

        {/* Selected Search Stay recap */}
        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-lg flex items-center gap-4 text-xs text-slate-700 self-start md:self-auto">
          <div className="flex items-center space-x-1.5 font-medium">
            <span>{searchParams.checkIn} &rarr; {searchParams.checkOut} ({nights} night{nights > 1 ? "s" : ""})</span>
          </div>
          <div className="flex items-center space-x-1.5 font-medium">
            <span>{searchParams.guests} Guest{searchParams.guests > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Photo Hero Mosaic Gallery */}
      <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-slate-100 shadow-xs">
        {galleryPhotos.length >= 5 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-96 md:h-[420px]">
            {/* Main large photo */}
            <div
              className="md:col-span-2 md:row-span-2 relative cursor-pointer overflow-hidden group"
              onClick={() => openGalleryAt(0)}
            >
              <img
                src={galleryPhotos[0]}
                alt={hotel.name + " - Main"}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            {/* 4 side thumbnail photos */}
            {galleryPhotos.slice(1, 5).map((photoUrl, idx) => (
              <div
                key={idx}
                className="hidden md:block relative cursor-pointer overflow-hidden group"
                onClick={() => openGalleryAt(idx + 1)}
              >
                <img
                  src={photoUrl}
                  alt={hotel.name + " - " + (idx + 2)}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
            ))}
          </div>
        ) : galleryPhotos.length > 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-96">
            <div
              className="relative cursor-pointer overflow-hidden group"
              onClick={() => openGalleryAt(0)}
            >
              <img
                src={galleryPhotos[0]}
                alt={hotel.name + " - 1"}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
            <div
              className="hidden md:block relative cursor-pointer overflow-hidden group"
              onClick={() => openGalleryAt(1)}
            >
              <img
                src={galleryPhotos[1]}
                alt={hotel.name + " - 2"}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
          </div>
        ) : (
          <div className="h-96 w-full">
            <img
              src={galleryPhotos[0]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Show all photos button */}
        {galleryPhotos.length > 1 && (
          <button
            type="button"
            onClick={() => openGalleryAt(0)}
            className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold px-3.5 py-2 rounded-lg shadow-md border border-stone-200 flex items-center space-x-1.5 transition cursor-pointer backdrop-blur-xs"
          >
            <span>Show all {galleryPhotos.length} photos</span>
          </button>
        )}
      </div>

      {/* Fullscreen Photo Modal */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setGalleryOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGalleryOpen(false)}
              aria-label="Close modal"
              className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-slate-300 transition cursor-pointer"
            >
              &times;
            </button>

            <img
              src={galleryPhotos[galleryIndex]}
              alt={hotel.name + " - " + (galleryIndex + 1)}
              className="max-h-[75vh] max-w-full object-contain rounded-lg"
            />

            {/* Navigation buttons */}
            {galleryPhotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryIndex((prev) => (prev === 0 ? galleryPhotos.length - 1 : prev - 1))
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer"
                >
                  &#8249;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGalleryIndex((prev) => (prev === galleryPhotos.length - 1 ? 0 : prev + 1))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer"
                >
                  &#8250;
                </button>
              </>
            )}

            <div className="mt-3 text-white text-xs font-semibold">
              Photo {galleryIndex + 1} of {galleryPhotos.length}
            </div>
          </div>
        </div>
      )}

      {/* Overview & Amenities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-stone-200">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-black">About this property</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {hotel.description}
          </p>

          {(hotel.checkin || hotel.checkout) && (
            <div className="pt-2 text-xs text-slate-500 flex gap-6">
              {hotel.checkin && <span><strong>Check-in:</strong> {hotel.checkin}</span>}
              {hotel.checkout && <span><strong>Check-out:</strong> {hotel.checkout}</span>}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg border border-stone-200 shadow-xs space-y-3">
          <h3 className="font-bold text-black text-sm">Key Amenities</h3>
          <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
            {(hotel.facilities || []).slice(0, 15).map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600">
                <span style={{ color: "#254546" }} className="font-bold text-base leading-none shrink-0">&bull;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Offers Selection */}
      <div ref={roomsSectionRef} className="pt-6 border-t border-stone-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-black">Available Room Options</h2>
            <p className="text-xs text-slate-500 mt-1">
              Prices calculated for {nights} night{nights > 1 ? "s" : ""}, {searchParams.guests} guest{searchParams.guests > 1 ? "s" : ""}.
            </p>
          </div>
          {rooms.length > 0 && (
            <span className="text-xs font-medium text-slate-500">
              Showing {startIndex + 1}–{endIndex} of {rooms.length} rooms
            </span>
          )}
        </div>

        {/* Room List */}
        <div className="space-y-4">
          {paginatedRooms.length > 0 ? (
            paginatedRooms.map((room) => (
              <RoomOfferCard
                key={room.offerId}
                room={room}
                nights={nights}
                onSelect={handleSelectRoom}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500 italic py-4">No available room rates found for these dates. Try different check-in dates.</p>
          )}
        </div>

        {/* Room Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-100">
            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </span>

            <div className="flex items-center space-x-1.5">
              {/* Prev button */}
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

              {/* Page Number Pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
              ))}

              {/* Next button */}
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
      </div>
    </div>
  );
};
