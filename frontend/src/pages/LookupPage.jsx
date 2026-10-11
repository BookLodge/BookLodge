import React, { useState } from "react";
import { bookingService } from "../services/bookingService";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";

const isPastCheckIn = (checkinDateStr) => {
  if (!checkinDateStr) return false;
  try {
    const checkin = typeof checkinDateStr === "string" ? parseISO(checkinDateStr) : new Date(checkinDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkinMidnight = new Date(checkin);
    checkinMidnight.setHours(0, 0, 0, 0);
    return checkinMidnight.getTime() <= today.getTime();
  } catch {
    return false;
  }
};

const formatDateSafe = (dateStr, formatPattern = "MMM d, yyyy") => {
  if (!dateStr) return "N/A";
  try {
    const d = typeof dateStr === "string" ? parseISO(dateStr) : new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).split("T")[0];
    return format(d, formatPattern);
  } catch {
    return String(dateStr).split("T")[0];
  }
};

export const LookupPage = () => {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setBooking(null);

    const cleanRef = reference.trim();
    const cleanEmail = email.trim();

    if (!cleanRef || !cleanEmail) {
      setError("Please provide both reference code and guest email.");
      return;
    }

    setLoading(true);
    try {
      const res = await bookingService.lookupBooking({ reference: cleanRef, email: cleanEmail });
      setBooking(res.data);
      toast.success("Reservation located!");
    } catch (err) {
      const msg = err.message || "No reservation found matching these credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;

    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(booking._id || booking.id, { reason: cancelReason });
      toast.success("Reservation cancelled successfully.");
      setIsCancelModalOpen(false);
      setBooking((prev) => ({ ...prev, status: "CANCELLED", cancelledReason: cancelReason }));
    } catch (err) {
      toast.error(err.message || "Failed to cancel this reservation.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Search form */}
      <div className="bg-white rounded-lg border border-stone-200 p-8 shadow-xs max-w-xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Lookup Reservation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Find your booking details, retrieve check-in vouchers, or request a cancellation using your confirmation code.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Booking Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BL-fcd7aba0..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-md text-sm font-medium font-mono text-black focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Guest Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. alex.morgan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-md text-sm font-medium text-black focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              For privacy protection, matching reference and email are strictly validated.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: "#254546", color: "#fefae0" }}
            className="w-full font-bold py-2.5 rounded-md shadow-xs flex items-center justify-center space-x-2 transition hover:opacity-90 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Locating Booking...</span>
            ) : (
              <span>Search Reservation</span>
            )}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-xl mx-auto bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-md text-xs flex items-start space-x-3">
          <div>
            <span className="font-bold block">Lookup Failed</span>
            {error}
          </div>
        </div>
      )}

      {/* Booking Found Card */}
      {booking && (
        <div className="bg-white rounded-lg border border-stone-200 p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Badge status={booking.status} />
                <span className="text-xs text-slate-400 font-mono">
                  Created {new Date(booking.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-black font-mono">
                {booking.reference || booking.clientReference}
              </h2>
            </div>

            {booking.status === "CONFIRMED" && (
              isPastCheckIn(booking.checkInDate || booking.stay?.checkin) ? (
                <button
                  disabled
                  title="Cancellations are not permitted on or after the scheduled check-in date."
                  className="text-xs font-semibold text-slate-400 bg-stone-100 border border-stone-200 px-4 py-2 rounded-md cursor-not-allowed self-start sm:self-auto"
                >
                  Cancel Reservation
                </button>
              ) : (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-md transition cursor-pointer self-start sm:self-auto"
                >
                  Cancel Reservation
                </button>
              )
            )}
          </div>

          {/* Cancellation Notice if already cancelled */}
          {booking.status === "CANCELLED" && (
            <div className="bg-stone-100 border border-stone-300 text-slate-700 p-4 rounded-md text-xs">
              <span className="font-bold block text-black">Reservation Cancelled</span>
              {booking.cancelledReason ? `Reason: ${booking.cancelledReason}` : "This reservation was cancelled by request."}
            </div>
          )}

          {/* Hotel & Stay Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex space-x-4">
              {booking.hotelImage ? (
                <img
                  src={booking.hotelImage}
                  alt={booking.hotelName}
                  className="w-24 h-24 rounded-md object-cover shrink-0 bg-stone-100 border border-stone-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-3xl shrink-0">
                  🏨
                </div>
              )}
              <div className="space-y-1">
                <h3 className="font-bold text-black text-base">{booking.hotelName || booking.hotel?.name}</h3>
                <p className="text-xs text-slate-500">
                  {booking.hotelAddress || booking.hotel?.address}
                </p>
                <div className="text-xs font-semibold" style={{ color: "#254546" }}>
                  {booking.roomType || booking.rooms?.[0]?.roomName} &bull; {booking.boardType || booking.rooms?.[0]?.boardName || "Room Only"}
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-md p-4 space-y-2 text-xs text-slate-700 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Dates</span>
                <span className="font-semibold text-black">
                  {formatDateSafe(booking.checkInDate || booking.stay?.checkin)} &rarr; {formatDateSafe(booking.checkOutDate || booking.stay?.checkout)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Guest</span>
                <span className="font-semibold text-black">
                  {booking.guestFirstName || booking.holder?.firstName} {booking.guestLastName || booking.holder?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confirmation Code</span>
                <span className="font-mono font-bold text-black">{booking.hotelConfirmationCode || booking.clientReference || "N/A"}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
                <span className="text-slate-600 font-semibold">Total Price</span>
                <span className="text-base font-extrabold" style={{ color: "#254546" }}>
                  ${Number(booking.totalPrice || booking.price?.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Reservation Cancellation"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to cancel booking <strong className="font-mono">{booking?.reference || booking?.clientReference}</strong>? Per hotel provider policy, this will release the room reservation.
          </p>

          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule change, emergency, found another hotel..."
              className="w-full p-3 bg-white border border-stone-300 rounded-md text-xs font-medium text-black focus:border-[#254546] focus:ring-1 focus:ring-[#254546] outline-none transition"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-md hover:bg-stone-100 transition cursor-pointer"
            >
              Keep Booking
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {isCancelling ? "Processing..." : "Yes, Cancel Reservation"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
