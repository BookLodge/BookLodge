import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBooking } from "../context/BookingContext";
import { bookingService } from "../services/bookingService";
import { paymentService } from "../services/paymentService";
import { SandboxCardWidget } from "../components/booking/SandboxCardWidget";
import { toast } from "react-hot-toast";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    selectedHotel,
    selectedOffer,
    searchParams,
    prebookSession,
    startPrebookSession,
    clearPrebookSession,
  } = useBooking();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const [fieldErrors, setFieldErrors] = useState({});
  const [isPrebooking, setIsPrebooking] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedOffer && !prebookSession) {
      navigate("/search");
    }
  }, [selectedOffer, prebookSession, navigate]);

  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
    }
  }, [user]);

  const validateForm = () => {
    const errors = {};
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim();

    if (!cleanFirst) {
      errors.firstName = "First name is required.";
    }

    if (!cleanLast) {
      errors.lastName = "Last name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      errors.email = "Email address is required.";
    } else if (!emailRegex.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!isAuthenticated) {
      errors.general = "Please sign in to proceed with locking rates and booking.";
    }

    if (!selectedOffer?.offerId && !prebookSession) {
      errors.general = "Your room selection has expired. Please return to room selection.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPrebook = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      toast.error("Please sign in or create an account to book.");
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsPrebooking(true);
    try {
      const res = await bookingService.prebook({ offerId: selectedOffer?.offerId });
      startPrebookSession({
        ...res.data,
        guestInfo: { firstName, lastName, email, phone },
        hotelInfo: selectedHotel,
        offerInfo: selectedOffer,
      });
      toast.success("Rate successfully locked!");
    } catch (err) {
      const msg = err.message || "Unable to lock rate for this offer. Please select another room.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsPrebooking(false);
    }
  };

  const handlePaymentSubmit = async (cardDetails) => {
    if (!prebookSession) return;

    setIsConfirming(true);
    setError("");
    try {
      if (prebookSession.secretKey) {
        toast.loading("Authorizing payment with card gateway...", { id: "payment-process" });
        await paymentService.confirmPaymentIntent({
          secretKey: prebookSession.secretKey,
          cardDetails,
        });
      }

      toast.loading("Finalizing hotel reservation...", { id: "payment-process" });
      const res = await bookingService.bookHotel({
        prebookId: prebookSession.prebookId,
        holder: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
        },
        guests: [
          {
            occupancyNumber: 1,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
          },
        ],
      });

      toast.success("Booking Confirmed!", { id: "payment-process" });
      clearPrebookSession();

      const bookingData = res.data;
      navigate(
        `/booking-confirmation?bookingId=${bookingData._id}&reference=${bookingData.clientReference}`
      );
    } catch (err) {
      const msg = err.message || "Booking confirmation failed. Please contact support.";
      setError(msg);
      toast.error(msg, { id: "payment-process" });
    } finally {
      setIsConfirming(false);
    }
  };



  const currentHotel = prebookSession?.hotelInfo || selectedHotel;
  const currentOffer = prebookSession?.offerInfo || selectedOffer;
  const totalPrice = prebookSession?.price?.amount || currentOffer?.totalPrice || 0;
  const currency = prebookSession?.price?.currency || currentOffer?.currency || "USD";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-slate-500 hover:text-black mb-3 transition inline-block cursor-pointer"
        >
          &larr; Return to room selection
        </button>
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          Complete Your Reservation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your stay details, provide guest information, and complete checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {(error || fieldErrors.general) && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-xs space-y-1">
              <span className="font-bold block text-sm">Notice:</span>
              <p>{error || fieldErrors.general}</p>
            </div>
          )}



          {!isAuthenticated && !prebookSession && (
            <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-black text-sm mb-1">
                  Account required to reserve rooms
                </h3>
                <p className="text-xs text-slate-500">
                  Please sign in or register to lock rates and complete your booking.
                </p>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <Link
                  to="/login"
                  state={{ from: { pathname: "/checkout" } }}
                  style={{ backgroundColor: "#254546", color: "#fefae0" }}
                  className="text-xs font-semibold px-5 py-2.5 rounded-md transition hover:opacity-90 whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  state={{ from: { pathname: "/checkout" } }}
                  className="text-xs font-semibold px-4 py-2.5 rounded-md border border-stone-300 text-slate-700 hover:bg-stone-50 transition whitespace-nowrap"
                >
                  Register
                </Link>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex items-center justify-between text-xs">
              <span className="text-slate-700">
                Signed in as <strong className="text-black">{user.firstName} {user.lastName}</strong> ({user.email})
              </span>
            </div>
          )}

          <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-stone-100">
              <h3 className="font-bold text-black text-base">
                Guest Information
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Primary guest details matching government-issued ID.
              </p>
            </div>

            <form onSubmit={handleProceedToPrebook} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    disabled={!!prebookSession}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: null }));
                    }}
                    placeholder="e.g. Alex"
                    className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-60"
                  />
                  {fieldErrors.firstName && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    disabled={!!prebookSession}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: null }));
                    }}
                    placeholder="e.g. Morgan"
                    className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-60"
                  />
                  {fieldErrors.lastName && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    disabled={!!prebookSession}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                    }}
                    placeholder="alex.morgan@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-60"
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    disabled={!!prebookSession}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3.5 py-2.5 bg-stone-100 hover:bg-stone-50 border border-stone-300 rounded-md text-sm font-medium text-black focus:bg-white focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition disabled:opacity-60"
                  />
                </div>
              </div>

              {!prebookSession && (
                <button
                  type="submit"
                  disabled={isPrebooking}
                  style={{ backgroundColor: "#254546", color: "#fefae0" }}
                  className="w-full mt-2 font-bold py-3 rounded-md flex items-center justify-center space-x-2 transition hover:opacity-90 cursor-pointer disabled:opacity-60"
                >
                  {isPrebooking ? (
                    <span>Locking Rate with Provider...</span>
                  ) : (
                    <span>Proceed to Payment & Lock Rate</span>
                  )}
                </button>
              )}
            </form>
          </div>

          {prebookSession && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-black text-base">
                  Payment Details (Sandbox)
                </h3>
                <span className="text-xs font-semibold" style={{ color: "#254546" }}>
                  Ref: {prebookSession.clientReference}
                </span>
              </div>

              <SandboxCardWidget
                amount={totalPrice}
                currency={currency}
                onSubmit={handlePaymentSubmit}
                isProcessing={isConfirming}
              />
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs sticky top-20 space-y-6">
            <h3 className="font-bold text-black text-base pb-3 border-b border-stone-100">
              Booking Summary
            </h3>

            <div className="flex items-center space-x-3">
              <img
                src={currentHotel?.photo || currentHotel?.mainImage}
                alt={currentHotel?.name}
                className="w-16 h-16 rounded-md object-cover bg-stone-100 border border-stone-200"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-black text-sm truncate">
                  {currentHotel?.name}
                </h4>
                <p className="text-xs text-slate-500 truncate">
                  {currentHotel?.city}, {currentHotel?.country}
                </p>
              </div>
            </div>

            <div className="bg-stone-50 rounded-md p-4 space-y-3 text-xs border border-stone-200">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Room</span>
                <span className="font-semibold text-right max-w-[180px] truncate text-black">{currentOffer?.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Board</span>
                <span className="font-semibold" style={{ color: "#254546" }}>
                  {currentOffer?.boardType}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Check-in</span>
                <span className="font-semibold text-black">{searchParams.checkIn}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Check-out</span>
                <span className="font-semibold text-black">{searchParams.checkOut}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-500">Guests</span>
                <span className="font-semibold text-black">{searchParams.guests} Person(s)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Room Rate</span>
                <span className="font-medium text-black">${Number(currentOffer?.pricePerNight).toLocaleString()} / night</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Taxes & Service Fee</span>
                <span className="text-emerald-700 font-semibold">Included</span>
              </div>
              <div className="flex justify-between items-baseline text-sm font-extrabold text-black pt-3 border-t border-stone-100">
                <span>Total Due</span>
                <span className="text-xl" style={{ color: "#254546" }}>
                  ${Number(totalPrice).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
