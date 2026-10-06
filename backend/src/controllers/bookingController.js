const { AppError } = require("../errors/AppError");
const Booking = require("../models/Booking");

exports.getBookingById = async (req, res) => {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
        _id: bookingId,
        user: req.user.id
    });

    if (!booking) {
        throw new AppError("Booking not found.", 404);
    }

    sendSuccess(res, "Booking retrieved successfully", booking);

    } 
;
