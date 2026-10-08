const { liteApiService } = require("../services/liteapi/liteApiService");
const { AppError } = require("../errors");
const Booking = require("../models/Booking");
const { sendSuccess } = require("../utils/apiResponse");
const { generateClientReference } = require("../utils/generateRef");

const bookHotel = async (req, res) => {
  const result = await liteApiService.bookRate({
    ...req.body,
    clientReference: generateClientReference(),
  });

  sendSuccess(res, "Hotel booked successfully", result, 201);
};

const prebookHotel = async (req, res) => {
  const result = await liteApiService.prebook(req.body);

  sendSuccess(res, "Hotel prebooked successfully", result);
};

const getBookingById = async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    userId: req.user.userId,
  });

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

  if (booking.userId.toString() !== req.user.userId) {
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
  getBookingById,
  cancelBooking,
};
