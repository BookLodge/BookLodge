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

module.exports = {
  bookHotel,
  prebookHotel,
  getBookingById,
};
