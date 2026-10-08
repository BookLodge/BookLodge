const { liteApiService } = require("../services/liteapi/liteApiService");
const { AppError } = require("../errors");
const Booking = require("../models/Booking");
const { sendSuccess } = require("../utils/apiResponse");
const { generateClientReference } = require("../utils/generateRef");

const isAdmin = (user) => user.role === "admin";

// Admins may reach any booking; everyone else only their own.
const findAccessibleBooking = (bookingId, user) =>
  isAdmin(user)
    ? Booking.findById(bookingId)
    : Booking.findOne({ _id: bookingId, userId: user.userId });

const bookHotel = async (req, res) => {
  const result = await liteApiService.bookRate({
    ...req.body,
    clientReference: generateClientReference(),
  });

  const booking = await Booking.create({
    ...result,
    userId: req.user.userId,
    payment: { transactionId: req.body.transactionId },
  });

  sendSuccess(res, "Hotel booked successfully", booking, 201);
};

const prebookHotel = async (req, res) => {
  const result = await liteApiService.prebook(req.body);

  sendSuccess(res, "Hotel prebooked successfully", result);
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
  cancelBooking,
};
