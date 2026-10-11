import React from "react";
import { SearchWidget } from "../components/hotel/SearchWidget";
import { useNavigate } from "react-router-dom";
import { addDays, format } from "date-fns";

const defaultCheckIn  = format(addDays(new Date(), 1), "yyyy-MM-dd");
const defaultCheckOut = format(addDays(new Date(), 4), "yyyy-MM-dd");

export const HomePage = () => {
  const navigate = useNavigate();

  const highlights = [
    {
      title: "Lagos Continental Hotel",
      location: "Victoria Island, Lagos, Nigeria",
      rating: "4.8",
      price: "$210",
      tag: "Luxury",
      city: "Lagos, Nigeria",
      img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Transcorp Hilton Abuja",
      location: "Maitama, Abuja, Nigeria",
      rating: "4.9",
      price: "$280",
      tag: "Top Rated",
      city: "Abuja, Nigeria",
      img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "The Savoy",
      location: "Westminster, London, UK",
      rating: "4.9",
      price: "$450",
      tag: "Historic Luxury",
      city: "London, UK",
      img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
    }
  ];

  return (
    <div className="space-y-14 pb-16">
      {/* Hero Section: Search box first */}
      <section style={{ backgroundColor: "#254546" }} className="text-white pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <SearchWidget />
          <p className="text-xs text-center font-medium" style={{ color: "rgba(254,250,224,0.75)" }}>
            Search live hotel rates, book and checkout with instant confirmation
          </p>
        </div>
      </section>

      {/* Trust & Guarantee Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 style={{ color: "#254546" }} className="font-bold text-base mb-1.5">Live Inventory & Rates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Direct integration with dynamic hotel providers ensuring live room availability and real-time prices.</p>
          </div>
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 style={{ color: "#254546" }} className="font-bold text-base mb-1.5">Price Lock Prebook</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Rates are locked during checkout so you never face unexpected price changes while confirming your booking.</p>
          </div>
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h3 style={{ color: "#254546" }} className="font-bold text-base mb-1.5">Instant Confirmation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Receive an immediate booking voucher, hotel confirmation code, and guest receipt.</p>
          </div>
        </div>
      </section>

      {/* Curated Highlights Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 style={{ color: "#254546" }} className="text-xl font-bold">Featured Hotel Highlights</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top-tier verified stays around the globe</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate("/search?city=" + encodeURIComponent(item.city) + "&checkIn=" + defaultCheckIn + "&checkOut=" + defaultCheckOut + "&guests=2")}
              className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer group"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <span className="absolute top-3 left-3 bg-[#254546] text-[#fefae0] text-[11px] font-bold px-2.5 py-1 rounded">
                  {item.tag}
                </span>
                <span className="absolute top-3 right-3 bg-white/95 text-stone-900 text-xs font-bold px-2 py-0.5 rounded shadow-xs">
                  {item.rating} ★
                </span>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm text-stone-900 group-hover:text-[#254546] transition">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.location}</p>
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">From <strong className="text-sm text-stone-900 font-bold">{item.price}</strong> / night</span>
                  <span style={{ color: "#254546" }} className="text-xs font-semibold">Search City &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
