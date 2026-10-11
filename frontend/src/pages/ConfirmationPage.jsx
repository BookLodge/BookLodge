import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingService } from "../services/bookingService";
import { hotelService } from "../services/hotelService";
import { Spinner } from "../components/common/Spinner";
import { format, parseISO } from "date-fns";

const formatDateSafe = (dateStr, formatPattern = "EEE, MMM d, yyyy") => {
  if (!dateStr) return "Confirmed";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return format(d, formatPattern);
  } catch {
    return String(dateStr).split("T")[0];
  }
};

export const ConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const bookingId = searchParams.get("bookingId");
  const reference = searchParams.get("reference");
  const { isAuthenticated, user } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [hotelDetails, setHotelDetails] = useState(location.state?.hotel || null);
  const [loading, setLoading] = useState(!location.state?.booking);

  useEffect(() => {
    const loadBooking = async () => {
      try {
        if (bookingId) {
          const res = await bookingService.getBookingById(bookingId);
          if (res?.data) {
            setBooking(res.data);
            return;
          }
        }

        if (isAuthenticated) {
          const myBookingsRes = await bookingService.getMyBookings().catch(() => null);
          const found = myBookingsRes?.data?.bookings?.find(
            (b) => b._id === bookingId || b.clientReference === reference
          );
          if (found) {
            setBooking(found);
          }
        }
      } catch (err) {
        console.warn("Could not load booking details directly:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!booking) {
      loadBooking();
    }
  }, [bookingId, reference, isAuthenticated, booking]);

  // Fetch hotel photo/info if not already present
  useEffect(() => {
    const hotelId =
      booking?.hotel?.hotelId ||
      location.state?.hotel?.id ||
      location.state?.hotel?.hotelId;

    if (hotelId && (!hotelDetails || !hotelDetails.photo)) {
      hotelService
        .getHotelDetails(hotelId)
        .then((res) => {
          if (res?.data) {
            setHotelDetails(res.data);
          }
        })
        .catch(() => {});
    }
  }, [booking, location.state, hotelDetails]);

  const hotelName =
    hotelDetails?.name || booking?.hotel?.name || "Hotel Accommodation";
  const hotelPhoto =
    hotelDetails?.photo ||
    hotelDetails?.mainImage ||
    hotelDetails?.photos?.[0] ||
    hotelDetails?.images?.[0] ||
    location.state?.hotel?.photo ||
    location.state?.hotel?.mainImage;

  const bookingRef = booking?.clientReference || reference || "BL-CONFIRMED";
  const status = booking?.status || "CONFIRMED";
  const rawCheckin = booking?.stay?.checkin || location.state?.booking?.stay?.checkin;
  const rawCheckout = booking?.stay?.checkout || location.state?.booking?.stay?.checkout;
  const checkinFormatted = formatDateSafe(rawCheckin, "EEE, MMM d, yyyy");
  const checkoutFormatted = formatDateSafe(rawCheckout, "EEE, MMM d, yyyy");

  const roomName =
    booking?.rooms?.[0]?.roomName ||
    location.state?.offer?.name ||
    "Standard Room";
  const boardName =
    booking?.rooms?.[0]?.boardName ||
    location.state?.offer?.boardType ||
    "Room Only";

  const leadGuest = booking?.holder
    ? `${booking.holder.firstName || ""} ${booking.holder.lastName || ""}`.trim()
    : user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : "Valued Guest";

  const guestEmail = booking?.holder?.email || user?.email;
  const currency = booking?.price?.currency || location.state?.offer?.currency || "USD";
  const totalAmount =
    booking?.price?.amount != null
      ? booking.price.amount
      : location.state?.offer?.totalPrice;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500 font-medium">Loading your reservation voucher...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center space-y-3">
        <div
          style={{ backgroundColor: "#254546", color: "#fefae0" }}
          className="w-12 h-12 rounded-md flex items-center justify-center mx-auto shadow-xs"
        >
          <svg className="w-6 h-6 text-[#fefae0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          Reservation Confirmed
        </h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Your payment has been verified and your room reservation is confirmed. A receipt and confirmation voucher have been generated below.
        </p>
      </div>

      {/* Voucher Card */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Reference Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Booking Reference
            </span>
            <span className="text-xl font-mono font-extrabold" style={{ color: "#254546" }}>
              {bookingRef}
            </span>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Status
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200 inline-block">
              {status === "CONFIRMED" ? "Confirmed & Paid" : status}
            </span>
          </div>
        </div>

        {/* Property & Room Details (Small Image Thumbnail) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            {hotelPhoto ? (
              <img
                src={hotelPhoto}
                alt={hotelName}
                className="w-16 h-16 rounded-md object-cover bg-stone-100 border border-stone-200 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-2xl text-slate-600 shrink-0">
                🏨
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold text-black truncate">
                {hotelName}
              </h3>
              <div
                style={{ color: "#254546", backgroundColor: "#25454612", borderColor: "#25454630" }}
                className="mt-1.5 inline-block text-xs px-2.5 py-0.5 rounded-md font-semibold border"
              >
                {roomName} {boardName ? `• ${boardName}` : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Guest Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-stone-50 rounded-md text-xs text-slate-700 border border-stone-200">
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Check-In</span>
            <span className="font-bold text-sm text-black block">{checkinFormatted}</span>
            <span className="text-slate-400 block text-[11px]">From 14:00</span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">Check-Out</span>
            <span className="font-bold text-sm text-black block">{checkoutFormatted}</span>
            <span className="text-slate-400 block text-[11px]">Until 11:00</span>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">Lead Guest</span>
            <span className="font-bold text-sm text-black block">
              {leadGuest}
            </span>
            <span className="text-slate-400 block text-[11px] truncate">
              {guestEmail || "Registered Guest"}
            </span>
          </div>
        </div>

        {/* Total Price & Payment Summary */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Paid (Sandbox)</span>
            <span className="text-2xl font-extrabold text-black">
              {totalAmount != null ? `${currency} ${Number(totalAmount).toLocaleString()}` : "Paid"}
            </span>
          </div>

          <button
            onClick={() => window.print()}
            className="text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-black px-4 py-2.5 rounded-md border border-stone-300 transition cursor-pointer"
          >
            Print Receipt
          </button>
        </div>
      </div>

      {/* Guest registration prompt */}
      {!isAuthenticated && guestEmail && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-black text-sm">Save your details for future bookings</h4>
            <p className="text-xs text-slate-600">
              Create an account with <strong>{guestEmail}</strong> to view your full itinerary history.
            </p>
          </div>
          <Link
            to={`/register?email=${encodeURIComponent(guestEmail)}`}
            style={{ backgroundColor: "#254546", color: "#fefae0" }}
            className="text-xs font-semibold px-5 py-2.5 rounded-md shrink-0 transition hover:opacity-90"
          >
            Create Account
          </Link>
        </div>
      )}

      {/* Navigation options */}
      <div className="flex justify-center space-x-6 pt-4 text-xs font-semibold">
        <Link
          to="/"
          style={{ color: "#254546" }}
          className="hover:underline transition"
        >
          &larr; Book another stay
        </Link>
        {isAuthenticated && (
          <>
            <span className="text-slate-300">&bull;</span>
            <Link
              to="/my-bookings"
              className="text-slate-600 hover:text-black transition"
            >
              View My Bookings &rarr;
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
