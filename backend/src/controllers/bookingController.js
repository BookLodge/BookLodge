const { AppError } = require("../errors");
const Booking = require("../models/Booking");
const { sendSuccess } = require("../utils/apiResponse");

exports.getBookingConfirmation = async (req, res) => {
  const userId = req.user?.id ?? req.user?._id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    userId,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  return sendSuccess(res, "Booking confirmation retrieved successfully", {
    status: booking.status,
  });
};