import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { hotelService } from "../services/hotelService";
import { useBooking } from "../context/BookingContext";
import { RoomOfferCard } from "../components/hotel/RoomOfferCard";
import { SkeletonRoomCard } from "../components/common/SkeletonCard";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { searchParams, selectOffer } = useBooking();

  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const nights = Math.max(
    1,
    differenceInCalendarDays(parseISO(searchParams.checkOut), parseISO(searchParams.checkIn)) || 1
  );

  useEffect(() => {
    const fetchHotelDetails = async () => {
      setLoading(true);
      try {
        const res = await hotelService.getHotelDetails(id, {
          checkIn: searchParams.checkIn,
          checkOut: searchParams.checkOut,
          guests: searchParams.guests
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

        setHotel({
          ...hotelData,
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

        const formattedRooms = Array.from(ratesMap.values()).map((r, idx) => ({
          id: r.offerId || `room_${idx}`,
          offerId: r.offerId,
          name: r.roomName,
          boardType: r.boardName,
          image: hotelData.photo,
          cancellationPolicy: r.refundable ? "Free Cancellation" : "Non-Refundable",
          isRefundable: r.refundable,
          totalPrice: Math.round(r.amount),
          pricePerNight: Math.max(1, Math.round(r.amount / nights)),
          currency: r.currency || "USD",
          maxOccupancy: r.occupancyNumber || searchParams.guests || 2,
          bedType: "Standard Room Setup",
          amenities: ["Free Wi-Fi", "Private Bathroom", "Climate Control"]
        }));

        setRooms(formattedRooms);
      } catch (err) {
        console.error("Failed to load hotel detail", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id, searchParams.checkIn, searchParams.checkOut, searchParams.guests, nights]);

  const handleSelectRoom = (room) => {
    selectOffer(hotel, room);
    navigate("/checkout");
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
          className="mt-4 bg-[#254546] text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer"
        >
          Return to Search
        </button>
      </div>
    );
  }

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
              {hotel.rating} Star Luxury
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

      {/* Photo Hero */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-stone-200 bg-slate-100 shadow-xs">
        <img
          src={hotel.photo}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
      </div>

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
      <div className="pt-6 border-t border-stone-200 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-black">Available Room Options</h2>
          <p className="text-xs text-slate-500 mt-1">
            Prices calculated for {nights} night{nights > 1 ? "s" : ""}, {searchParams.guests} guest{searchParams.guests > 1 ? "s" : ""}.
          </p>
        </div>

        <div className="space-y-4">
          {rooms.length > 0 ? (
            rooms.map((room) => (
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
      </div>
    </div>
  );
};
