const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    clientReference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,

      enum: [
        "PENDING_PAYMENT",
        "BOOKING_PROCESSING",
        "CONFIRMED",
        "PAYMENT_FAILED",
        "BOOKING_FAILED",
        "CANCELLED",
      ],

      required: true,
      index: true,
    },

    hotel: {
      hotelId: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },
    },

    stay: {
      checkin: {
        type: Date,
        required: true,
      },

      checkout: {
        type: Date,
        required: true,
      },
    },

    rooms: [
      {
        occupancyNumber: {
          type: Number,
          required: true,
        },

        roomName: String,
        boardName: String,
      },
    ],

    holder: {
      firstName: {
        type: String,
        required: true,
      },

      lastName: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },
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

    payment: {
      transactionId: {
        type: String,
        default: null,
      },
    },

    liteApi: {
      bookingId: {
        type: String,
        default: null,
      },
    },
  },

  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
