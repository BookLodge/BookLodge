import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await bookingService.getMyBookings();
      setBookings(res.data?.bookings || []);
    } catch (err) {
      toast.error(err.message || 'Failed to retrieve bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(selectedBooking._id);
      toast.success('Reservation cancelled successfully');
      setIsCancelModalOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel reservation');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">
            My Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {user?.firstName}. View upcoming trips, review receipts, and manage cancellations.
          </p>
        </div>

        <Link
          to="/search"
          style={{ backgroundColor: '#254546', color: '#fefae0' }}
          className="inline-flex items-center text-xs font-semibold px-4 py-2.5 rounded-md shadow-xs transition hover:opacity-90 self-start"
        >
          Book Another Stay
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 mt-3">Loading your reservations...</p>
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const hotelName = booking.hotel?.name || 'Hotel Accommodation';
            const reference = booking.clientReference || 'N/A';
            const currency = booking.price?.currency || 'USD';
            const amount = booking.price?.amount != null ? Number(booking.price.amount).toLocaleString() : 'N/A';
            const roomName = booking.rooms?.[0]?.roomName || 'Standard Room';
            const boardName = booking.rooms?.[0]?.boardName;
            const checkin = booking.stay?.checkin || 'Confirmed';
            const checkout = booking.stay?.checkout || 'Confirmed';
            const guestName = booking.holder
              ? `${booking.holder.firstName || ''} ${booking.holder.lastName || ''}`.trim()
              : 'Valued Guest';
            const guestEmail = booking.holder?.email;

            return (
              <div
                key={booking._id}
                className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs hover:border-stone-300 transition flex flex-col md:flex-row"
              >
                {/* Hotel Thumbnail */}
                <div className="md:w-56 h-44 md:h-auto bg-stone-100 overflow-hidden shrink-0 border-r border-stone-200 flex items-center justify-center">
                  <div className="text-center p-4 text-slate-400">
                    <span className="text-4xl block mb-2">🏨</span>
                    <span className="text-xs font-semibold text-slate-600 block line-clamp-2">{hotelName}</span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge status={booking.status} />
                          <span className="text-xs font-mono text-slate-400">
                            Ref: {reference}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-black">{hotelName}</h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total Paid</span>
                        <span className="text-lg font-extrabold" style={{ color: '#254546' }}>
                          {currency} {amount}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-md border border-stone-200 text-xs text-slate-700 mb-4">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Room & Board</span>
                        <span className="font-semibold text-black block line-clamp-1">
                          {roomName} {boardName ? `(${boardName})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dates</span>
                        <span className="font-semibold text-black">{checkin} &rarr; {checkout}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Confirmation</span>
                        <span className="font-mono font-bold text-black">{reference}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar: Action buttons */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Booked for {guestName} {guestEmail ? `(${guestEmail})` : ''}
                    </span>

                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/booking-confirmation?bookingId=${booking._id}&reference=${reference}`}
                        className="text-xs font-semibold text-[#254546] hover:underline"
                      >
                        View Voucher
                      </Link>
                      {booking.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleCancelClick(booking)}
                          className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 font-semibold px-3 py-1.5 rounded-md border border-rose-200 transition cursor-pointer"
                        >
                          Cancel Stay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 p-16 text-center space-y-4 shadow-xs">
          <h3 className="text-xl font-bold text-black">No Reservations Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ready to explore? Book a stay in Madrid, London, Paris, or other destinations with instant confirmation.
          </p>
          <Link
            to="/search"
            style={{ backgroundColor: '#254546', color: '#fefae0' }}
            className="inline-block text-xs font-semibold px-5 py-2.5 rounded-md shadow-xs transition hover:opacity-90"
          >
            Explore Hotels Now
          </Link>
        </div>
      )}

      {/* Cancellation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Hotel Reservation"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to cancel your stay at{' '}
            <strong>{selectedBooking?.hotel?.name}</strong> ({selectedBooking?.clientReference})?
          </p>
          <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-md border border-amber-200">
            Note: Once cancelled, this reservation cannot be restored. Any eligible refund will be processed per the rate cancellation policy.
          </p>

          <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100">
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="text-xs font-semibold text-slate-600 px-4 py-2 rounded-md hover:bg-stone-100 transition cursor-pointer"
            >
              Keep Stay
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-md shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
