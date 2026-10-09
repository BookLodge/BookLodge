import React, { useState } from "react";

export const RoomOfferCard = ({ room, nights = 1, onSelect }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = (room.photos && room.photos.length > 0)
    ? room.photos
    : [room.image].filter(Boolean);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: room.currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isFreeCancellation = (room.cancellationPolicy || "").toLowerCase().includes("free");

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs hover:border-[#254546]/40 transition flex flex-col md:flex-row">
      {/* Specific Room Photo Carousel */}
      <div className="relative md:w-80 h-56 md:h-auto bg-stone-100 overflow-hidden shrink-0 group">
        <img
          src={photos[photoIndex] || room.image}
          alt={`${room.name} - Photo ${photoIndex + 1}`}
          className="w-full h-full object-cover transition duration-300"
          loading="lazy"
        />

        {/* Multi-photo controls (only rendered if room has multiple photos) */}
        {photos.length > 1 && (
          <>
            {/* Prev button */}
            <button
              type="button"
              onClick={handlePrevPhoto}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              &#8249;
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={handleNextPhoto}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              &#8250;
            </button>

            {/* Photo Counter Pill */}
            <div className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md pointer-events-none">
              {photoIndex + 1} / {photos.length}
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center space-x-1 pointer-events-none">
              {photos.slice(0, 6).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    photoIndex === idx ? "bg-white scale-125" : "bg-white/50"
                  }`}
                />
              ))}
              {photos.length > 6 && (
                <span className="text-white text-[9px] font-bold leading-none">+</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Room Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-black">{room.name}</h3>
            <span
              style={{ color: "#254546", backgroundColor: "#25454612", borderColor: "#25454630" }}
              className="text-xs font-semibold px-2.5 py-1 rounded-md border"
            >
              {room.boardType}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-3">
            <span>Up to {room.maxOccupancy} Guests</span>
            <span>·</span>
            <span>{room.bedType}</span>
          </div>

          {/* Cancellation Policy */}
          <div className="mb-3">
            {isFreeCancellation ? (
              <span className="inline-block text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Free Cancellation
              </span>
            ) : (
              <span className="inline-block text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Non-Refundable
              </span>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5">
            {(room.amenities || []).map((item, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-stone-50 text-slate-700 px-2 py-0.5 rounded-md border border-stone-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & Selection */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">
              {nights} night{nights > 1 ? "s" : ""} total
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-extrabold text-black">
                {formatPrice(room.totalPrice)}
              </span>
              <span className="text-xs text-slate-500">
                ({formatPrice(room.pricePerNight)} / night)
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelect(room)}
            style={{ backgroundColor: "#254546", color: "#fefae0" }}
            className="text-xs font-semibold px-5 py-2.5 rounded-md transition hover:opacity-90 cursor-pointer"
          >
            Reserve Room
          </button>
        </div>
      </div>
    </div>
  );
};