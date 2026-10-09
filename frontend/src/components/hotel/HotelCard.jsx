import React from "react";
import { Link } from "react-router-dom";

export const HotelCard = ({ hotel, nights = 1 }) => {
  const currency = hotel.startingRate?.currency || "USD";
  const totalAmount = hotel.startingRate?.amount || 0;
  const perNightPrice = Math.max(1, Math.round(totalAmount / nights));

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs hover:border-[#254546]/40 transition group flex flex-col md:flex-row">
      {/* Image */}
      <div className="relative md:w-80 h-56 md:h-auto overflow-hidden bg-slate-100 shrink-0">
        <img
          src={hotel.photo || hotel.mainImage}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        {hotel.rating && (
          <div
            className="absolute top-3 left-3 text-white text-xs px-2.5 py-1 rounded-md font-semibold"
            style={{ backgroundColor: "#254546" }}
          >
            Score: {hotel.rating} / 10
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-bold text-black group-hover:opacity-80 transition">
                {hotel.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 truncate">{hotel.address}</p>
            </div>
          </div>

          {/* Featured Starting Rate details */}
          {hotel.startingRate && (
            <div className="mt-3 p-3 bg-stone-50 rounded-md border border-stone-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">{hotel.startingRate.roomName}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white text-stone-700 border border-stone-200">
                  {hotel.startingRate.boardName}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                {hotel.startingRate.refundable ? (
                  <span className="text-emerald-700 font-medium">Free Cancellation Available</span>
                ) : (
                  <span className="text-amber-700 font-medium">Non-Refundable Rate</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block uppercase font-medium">
              Starts from
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold text-black">
                {formatPrice(perNightPrice)}
              </span>
              <span className="text-xs text-slate-500">/ night</span>
              {nights > 1 && (
                <span className="text-xs text-slate-400 ml-1.5">
                  ({formatPrice(totalAmount)} for {nights} nights)
                </span>
              )}
            </div>
          </div>

          <Link
            to={`/hotels/${hotel.id}`}
            style={{ backgroundColor: "#254546", color: "#fefae0" }}
            className="text-xs font-semibold px-5 py-2.5 rounded-md transition hover:opacity-90 cursor-pointer"
          >
            View Rooms &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
