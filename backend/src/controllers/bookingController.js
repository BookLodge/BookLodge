const Booking = require("../models/Booking");
const { sendSuccess } = require("../utils/apiResponse");

const getMyBookings = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const filter = { customerId: req.user.userId };

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return sendSuccess(res, "Bookings retrieved successfully", {
      bookings,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyBookings };