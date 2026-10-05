const Booking = require("../models/Booking");
const liteApiService = require("../services/liteApiService");

const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Find the BookLodge booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify that the booking belongs to the authenticated user
    if (booking.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    // Check whether the booking can be cancelled
    if (booking.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "This booking cannot be cancelled",
      });
    }

    // Cancel the booking through LiteAPI
    const result = await liteApiService.cancelBooking(bookingId);

    // Update BookLodge booking after successful cancellation
    booking.status = "CANCELLED";
    await booking.save();

    // Return the response provided by the LiteAPI adapter
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  cancelBooking,
};