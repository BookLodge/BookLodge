import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingService } from '../services/bookingService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { toast } from 'react-hot-toast';

export const LookupPage = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('reference') || '';
  const initialEmail = searchParams.get('email') || '';

  const [reference, setReference] = useState(initialRef);
  const [email, setEmail] = useState(initialEmail);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cancellation modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (initialRef && initialEmail) {
      executeLookup(initialRef, initialEmail);
    }
  }, [initialRef, initialEmail]);

  const executeLookup = async (refVal, emailVal) => {
    setError('');
    setBooking(null);
    setLoading(true);

    try {
      const res = await bookingService.lookupBooking(refVal, emailVal);
      setBooking(res.data?.booking || null);
    } catch (err) {
      setError(err.message || 'No booking found matching the provided details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reference.trim() || !email.trim()) {
      setError('Please provide both the booking reference and the email address used.');
      return;
    }
    executeLookup(reference, email);
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setIsCancelling(true);
    try {
      const res = await bookingService.cancelBooking(booking._id, cancelReason);
      setBooking(res.data.booking);
      setIsCancelModalOpen(false);
      toast.success('Reservation cancelled successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel reservation');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-black tracking-tight">
          Find Your Reservation
        </h1>
        <p className="text-xs text-slate-500">
          Enter your unique booking reference and contact email to locate your booking voucher
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-xs max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
              Booking Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HB-20261001-A1B2"
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
            style={{ backgroundColor: '#254546', color: '#fefae0' }}
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
                {booking.reference}
              </h2>
            </div>

            {booking.status === 'CONFIRMED' && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-md transition cursor-pointer self-start sm:self-auto"
              >
                Cancel Reservation
              </button>
            )}
          </div>

          {/* Cancellation Notice if already cancelled */}
          {booking.status === 'CANCELLED' && (
            <div className="bg-stone-100 border border-stone-300 text-slate-700 p-4 rounded-md text-xs">
              <span className="font-bold block text-black">Reservation Cancelled</span>
              {booking.cancelledReason ? `Reason: ${booking.cancelledReason}` : 'This reservation was cancelled by request.'}
            </div>
          )}

          {/* Hotel & Stay Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex space-x-4">
              <img
                src={booking.hotelImage}
                alt={booking.hotelName}
                className="w-24 h-24 rounded-md object-cover shrink-0 bg-stone-100 border border-stone-200"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-black text-base">{booking.hotelName}</h3>
                <p className="text-xs text-slate-500">
                  {booking.hotelAddress}
                </p>
                <div className="text-xs font-semibold" style={{ color: '#254546' }}>
                  {booking.roomType} &bull; {booking.boardType}
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-md p-4 space-y-2 text-xs text-slate-700 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Dates</span>
                <span className="font-semibold text-black">{booking.checkInDate} &rarr; {booking.checkOutDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Guest</span>
                <span className="font-semibold text-black">{booking.guestFirstName} {booking.guestLastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confirmation Code</span>
                <span className="font-mono font-bold text-black">{booking.hotelConfirmationCode || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-stone-200">
                <span className="text-slate-600 font-semibold">Total Price</span>
                <span className="text-base font-extrabold" style={{ color: '#254546' }}>
                  ${Number(booking.totalPrice).toLocaleString()}
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
            Are you sure you want to cancel booking <strong className="font-mono">{booking?.reference}</strong>? Per LiteAPI policy, this will release the room reservation.
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
              {isCancelling ? 'Processing...' : 'Yes, Cancel Reservation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
