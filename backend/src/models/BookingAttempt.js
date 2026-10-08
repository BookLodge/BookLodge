const mongoose = require("mongoose");

const ATTEMPT_STATUSES = [
  "PENDING_PAYMENT",
  "BOOKED",
  "PAYMENT_FAILED",
  "BOOKING_AMBIGUOUS",
];

const bookingAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Minted once, here, so a client retrying the booking reuses it and LiteAPI can spot the
    // duplicate instead of creating a second reservation.
    clientReference: {
      type: String,
      required: true,
      unique: true,
    },

    prebookId: {
      type: String,
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
    },

    offer: {
      hotelId: {
        type: String,
        required: true,
      },

      price: {
        amount: {
          type: Number,
          required: true,
        },

        currency: {
          type: String,
          required: true,
        },
      },
    },

    status: {
      type: String,
      enum: ATTEMPT_STATUSES,
      required: true,
      default: "PENDING_PAYMENT",
      index: true,
    },

    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);

// LiteAPI releases an unused prebook hold after one to two business days.
bookingAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BookingAttempt = mongoose.model("BookingAttempt", bookingAttemptSchema);

module.exports = BookingAttempt;
