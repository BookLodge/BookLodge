import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Spinner } from '../components/common/Spinner';
import { Shield, Users, Calendar, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllBookings({ status: statusFilter });
      setBookings(res.data?.bookings || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch admin bookings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Subheader & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
              <Shield className="w-3 h-3 text-amber-700" />
              <span>Admin Console</span>
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Platform Reservations Management
          </h1>
          <p className="text-xs text-slate-500">
            Real-time audit log of all customer and guest bookings created through LiteAPI sandbox.
          </p>
        </div>

        {/* Tab links between Bookings and Users */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start">
          <Link
            to="/admin/bookings"
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-xs"
          >
            All Bookings ({bookings.length})
          </Link>
          <Link
            to="/admin/users"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Manage Users
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <Filter className="w-4 h-4 text-[#254546]" />
          <span>Filter by Status:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {['', 'CONFIRMED', 'PENDING_PAYMENT', 'CANCELLED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#254546] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All Statuses' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400 mt-2">Loading reservations...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Guest</th>
                  <th className="py-3.5 px-4">Hotel / Room</th>
                  <th className="py-3.5 px-4">Stay Dates</th>
                  <th className="py-3.5 px-4">Total Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#254546]">
                      {b.reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {b.guestFirstName} {b.guestLastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{b.guestEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{b.hotelName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{b.roomType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      {b.checkInDate} &rarr; {b.checkOutDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₦{Number(b.totalPrice).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="text-xs text-[#254546] hover:text-blue-800 font-semibold px-2 py-1 rounded bg-stone-50 hover:bg-stone-100 transition cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No bookings found matching current filters.
          </div>
        )}
      </div>

      {/* Inspect Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Booking Audit Details"
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="font-mono font-bold text-[#254546] text-sm">{selectedBooking.reference}</span>
              <Badge status={selectedBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 block font-semibold">LiteAPI Hotel ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedBooking.liteApiHotelId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">LiteAPI Booking ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedBooking.liteApiBookingId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Confirmation Code</span>
                <span className="font-mono font-bold text-slate-800">{selectedBooking.hotelConfirmationCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedBooking.transactionId || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold">Hotel & Address</span>
              <div className="font-bold text-slate-900">{selectedBooking.hotelName}</div>
              <div className="text-slate-500">{selectedBooking.hotelAddress}</div>
            </div>

            {selectedBooking.cancelledReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                <span className="font-bold block">Cancellation Reason:</span>
                {selectedBooking.cancelledReason}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl"
              >
                Close Audit
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
