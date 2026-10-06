const { AppError } = require("../errors");
const Booking = require("../models/Booking");
const { sendSuccess } = require("../utils/apiResponse");

const providerFields = [
  "liteApiPrebookId",
  "liteApiTransactionId",
  "liteApiBookingId",
  "hotelConfirmationCode",
];

exports.getBookingConfirmation = async (req, res) => {
  const customerId = req.user?.id ?? req.user?._id;
  if (!customerId) {
    throw new AppError("Unauthorized", 401);
  }

  const booking = await Booking.findOne({
    _id: req.params.bookingId,
    customerId,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  const data = {
    bookingId: booking._id.toString(),
    reference: booking.reference,
    liteApiHotelId: booking.liteApiHotelId,
    hotelName: booking.hotelName,
    hotelAddress: booking.hotelAddress,
    hotelImage: booking.hotelImage,
    roomType: booking.roomType,
    boardType: booking.boardType,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    numberOfGuests: booking.numberOfGuests,
    guestEmail: booking.guestEmail,
    guestFirstName: booking.guestFirstName,
    guestLastName: booking.guestLastName,
    pricePerNight: booking.pricePerNight,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
  };

  for (const field of providerFields) {
    if (booking[field] != null) {
      data[field] = booking[field];
    }
  }

  for (const [field, value] of Object.entries(data)) {
    if (value === undefined) {
      delete data[field];
    }
  }

  return sendSuccess(res, "Booking confirmation retrieved successfully", data);
};