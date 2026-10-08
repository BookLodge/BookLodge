const { liteApiService } = require("../services/liteapi/liteApiService");
const { AppError, ExternalAPIError } = require("../errors");
const Booking = require("../models/Booking");
const BookingAttempt = require("../models/BookingAttempt");
const { sendSuccess } = require("../utils/apiResponse");
const { generateClientReference } = require("../utils/generateRef");

// LiteAPI releases an unused prebook hold after one to two business days.
const PREBOOK_HOLD_MS = 48 * 60 * 60 * 1000;

const isAdmin = (user) => user.role === "admin";

// Admins may reach any booking; everyone else only their own.
const findAccessibleBooking = (bookingId, user) =>
  isAdmin(user)
    ? Booking.findById(bookingId)
    : Booking.findOne({ _id: bookingId, userId: user.userId });

const bookHotel = async (req, res) => {
  const { prebookId, holder, guests } = req.body;

  const attempt = await BookingAttempt.findOne({
    userId: req.user.userId,
    prebookId,
    status: "PENDING_PAYMENT",
  });

  if (!attempt) {
    throw new AppError("No pending prebook for this booking", 409);
  }

  let result;

  try {
    result = await liteApiService.bookRate({
      prebookId: attempt.prebookId,
      clientReference: attempt.clientReference,
      transactionId: attempt.transactionId,
      holder,
      guests,
    });
  } catch (err) {
    // A provider failure is the only thing that says anything about the attempt's fate; a fault
    // on our side leaves it untouched.
    if (err instanceof ExternalAPIError) {
      attempt.status = err.ambiguous ? "BOOKING_AMBIGUOUS" : "PAYMENT_FAILED";
      await attempt.save();
    }

    throw err;
  }

  const booking = await Booking.create({
    ...result,
    userId: req.user.userId,
    payment: { transactionId: attempt.transactionId },
  });

  attempt.status = "BOOKED";
  attempt.bookingId = booking._id;
  await attempt.save();

  sendSuccess(res, "Hotel booked successfully", booking, 201);
};

const prebookHotel = async (req, res) => {
  const result = await liteApiService.prebook(req.body);

  const attempt = await BookingAttempt.create({
    userId: req.user.userId,
    clientReference: generateClientReference(),
    prebookId: result.prebookId,
    transactionId: result.transactionId,
    offer: { hotelId: result.hotelId, price: result.price },
    expiresAt: new Date(Date.now() + PREBOOK_HOLD_MS),
  });

  sendSuccess(res, "Hotel prebooked successfully", {
    ...result,
    clientReference: attempt.clientReference,
  });
};

const getMyBookings = async (req, res) => {
  const { page, limit } = req.query;
  const filter = { userId: req.user.userId };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .select("-__v -userId -payment -liteApi")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  sendSuccess(res, "Bookings retrieved successfully", { bookings, total, page, limit });
};

const getBookingById = async (req, res) => {
  const booking = await findAccessibleBooking(req.params.bookingId, req.user);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  sendSuccess(res, "Booking retrieved successfully", booking);
};

const getBookingConfirmation = async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    userId: req.user.userId,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  sendSuccess(res, "Booking confirmation retrieved successfully", {
    status: booking.status,
  });
};

const cancelBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (!isAdmin(req.user) && booking.userId.toString() !== req.user.userId) {
    throw new AppError("You are not authorized to cancel this booking", 403);
  }

  if (booking.status !== "CONFIRMED") {
    throw new AppError("This booking cannot be cancelled", 400);
  }

  const result = await liteApiService.cancelBooking(booking.liteApi.bookingId);

  booking.status = "CANCELLED";
  await booking.save();

  sendSuccess(res, "Booking cancelled successfully", result);
};

module.exports = {
  bookHotel,
  prebookHotel,
  getMyBookings,
  getBookingById,
  getBookingConfirmation,
  cancelBooking,
};
