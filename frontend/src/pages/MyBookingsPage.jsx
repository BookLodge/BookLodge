import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingService } from "../services/bookingService";
import { hotelService } from "../services/hotelService";
import { Badge } from "../components/common/Badge";
import { Spinner } from "../components/common/Spinner";
import { Modal } from "../components/common/Modal";
import { toast } from "react-hot-toast";
import { format, parseISO } from "date-fns";

const BOOKINGS_PER_PAGE = 5;

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

export const MyBookingsPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelPhotos, setHotelPhotos] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const listTopRef = useRef(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingService.getMyBookings();
      const list = res.data?.bookings || [];
      setBookings(list);

      // Asynchronously fetch hotel images for all unique hotel IDs
      const uniqueHotelIds = [...new Set(list.map((b) => b.hotel?.hotelId).filter(Boolean))];
      uniqueHotelIds.forEach(async (hId) => {
        try {
          const hotelRes = await hotelService.getHotelDetails(hId);
          const img =
            hotelRes.data?.photo ||
            hotelRes.data?.mainImage ||
            hotelRes.data?.photos?.[0] ||
            hotelRes.data?.images?.[0];
          if (img) {
            setHotelPhotos((prev) => ({ ...prev, [hId]: img }));
          }
        } catch {
          // Fallback UI handles missing image
        }
      });
    } catch (err) {
      toast.error("Failed to load your reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    setIsCancelling(true);
    try {
      await bookingService.cancelBooking(selectedBooking._id);
      toast.success("Reservation cancelled successfully");
      setIsCancelModalOpen(false);
      fetchBookings();
    } catch (err) {
      toast.error(err.message || "Failed to cancel reservation");
    } finally {
      setIsCancelling(false);
    }
  };

  const totalPages = Math.ceil(bookings.length / BOOKINGS_PER_PAGE);
  const startIndex = (currentPage - 1) * BOOKINGS_PER_PAGE;
  const endIndex = Math.min(startIndex + BOOKINGS_PER_PAGE, bookings.length);
  const paginatedBookings = bookings.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={listTopRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">My Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}. View upcoming trips, review receipts, and manage cancellations.
          </p>
        </div>

        <Link
          to="/search"
          style={{ backgroundColor: "#254546", color: "#fefae0" }}
          className="inline-flex items-center text-xs font-semibold px-4 py-2.5 rounded-md shadow-xs transition hover:opacity-90 self-start cursor-pointer"
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
          {/* Reservation count indicator */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {startIndex + 1}–{endIndex} of {bookings.length} reservations
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {paginatedBookings.map((booking) => {
              const hotelName = booking.hotel?.name || "Hotel Accommodation";
              const hotelId = booking.hotel?.hotelId;
              const hotelImg = booking.hotel?.photo || booking.hotel?.mainImage || hotelPhotos[hotelId];
              const reference = booking.clientReference || "N/A";
              const currency = booking.price?.currency || "USD";
              const amount =
                booking.price?.amount != null ? Number(booking.price.amount).toLocaleString() : "N/A";
              const roomName = booking.rooms?.[0]?.roomName || "Standard Room";
              const boardName = booking.rooms?.[0]?.boardName;
              const isBreakfast =
                boardName &&
                (boardName.toLowerCase().includes("breakfast") ||
                  boardName.toLowerCase().includes("bb") ||
                  boardName.toLowerCase().includes("bed and breakfast"));
              const checkinFormatted = formatDateSafe(booking.stay?.checkin);
              const checkoutFormatted = formatDateSafe(booking.stay?.checkout);
              const hasCheckinPassed = isPastCheckIn(booking.stay?.checkin);
              const guestName = booking.holder
                ? `${booking.holder.firstName || ""} ${booking.holder.lastName || ""}`.trim()
                : "Valued Guest";
              const guestEmail = booking.holder?.email;

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs hover:border-stone-300 transition flex flex-col md:flex-row"
                >
                  {/* Compact Hotel Thumbnail Box */}
                  <div className="p-4 sm:p-5 flex flex-col items-center justify-center shrink-0 md:w-44 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200">
                    {hotelImg ? (
                      <img
                        src={hotelImg}
                        alt={hotelName}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-md object-cover bg-stone-100 border border-stone-200 shadow-2xs shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-3xl shrink-0">
                        🏨
                      </div>
                    )}
                    <span className="text-[11px] font-semibold text-slate-600 mt-2 text-center line-clamp-2">{hotelName}</span>
                  </div>

                  {/* Details & Actions */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1.5">
                            <Badge status={booking.status} />
                            <span className="text-xs font-mono text-slate-400">
                              Ref: {reference}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-black">{hotelName}</h3>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block font-medium">Total Paid</span>
                          <span className="text-lg font-extrabold" style={{ color: "#254546" }}>
                            {currency} {amount}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-stone-50 rounded-md border border-stone-200 text-xs text-slate-700 mb-4">
                        <div>
                          <span className="text-slate-400 block text-[11px] font-semibold mb-0.5">Room & Board</span>
                          <span className="font-semibold text-black block line-clamp-1">
                            {roomName} {boardName ? `(${boardName})` : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px] font-semibold mb-0.5">Dates</span>
                          <span className="font-semibold text-black block">
                            {checkinFormatted} &rarr; {checkoutFormatted}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px] font-semibold mb-0.5">Confirmation</span>
                          <span className="font-mono font-bold text-black block truncate">{reference}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500">
                        Booked for {guestName} {guestEmail ? `(${guestEmail})` : ""}
                      </span>

                      <div className="flex items-center space-x-3">
                        <Link
                          to={`/booking-confirmation?bookingId=${booking._id}&reference=${reference}`}
                          style={{ color: "#254546" }}
                          className="text-xs font-semibold hover:underline"
                        >
                          View Voucher
                        </Link>
                        {booking.status === "CONFIRMED" && (
                          hasCheckinPassed ? (
                            <button
                              disabled
                              title="Cancellations are not permitted on or after the scheduled check-in date."
                              className="text-xs text-slate-400 bg-stone-100 font-semibold px-3 py-1.5 rounded-md border border-stone-200 cursor-not-allowed"
                            >
                              Cancel Stay
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCancelClick(booking)}
                              className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 font-semibold px-3 py-1.5 rounded-md border border-rose-200 transition cursor-pointer"
                            >
                              Cancel Stay
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-200">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                    currentPage === 1
                      ? "text-slate-300 border-stone-200 cursor-not-allowed bg-stone-50"
                      : "text-slate-700 border-stone-300 hover:bg-stone-50 cursor-pointer"
                  }`}
                >
                  &larr; Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    style={pageNum === currentPage ? { backgroundColor: "#254546", color: "#fefae0" } : {}}
                    className={`w-8 h-8 text-xs font-bold rounded-md transition cursor-pointer ${
                      pageNum === currentPage
                        ? "shadow-xs"
                        : "text-slate-700 hover:bg-stone-100 border border-stone-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                    currentPage === totalPages
                      ? "text-slate-300 border-stone-200 cursor-not-allowed bg-stone-50"
                      : "text-slate-700 border-stone-300 hover:bg-stone-50 cursor-pointer"
                  }`}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 p-16 text-center space-y-4 shadow-xs">
          <h3 className="text-xl font-bold text-black">No Reservations Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ready to explore? Book a stay in London, Kuala Lumpur, Paris, or other destinations with instant confirmation.
          </p>
          <Link
            to="/search"
            style={{ backgroundColor: "#254546", color: "#fefae0" }}
            className="inline-block text-xs font-semibold px-5 py-2.5 rounded-md shadow-xs transition hover:opacity-90 cursor-pointer"
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
            Are you sure you want to cancel your stay at{" "}
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
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
