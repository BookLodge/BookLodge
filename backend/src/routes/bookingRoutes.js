const express = require("express");

const {
  bookHotel,
  prebookHotel,
  getMyBookings,
  getBookingById,
  getBookingConfirmation,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { validateBody, validateParams, validateQuery } = require("../middleware/validators");
const { bookingIdParamsSchema, bookingListQuerySchema } = require("../schemas/bookingSchema");
const { bookHotelRequestSchema } = require("../schemas/bookRateSchema");
const { prebookSchema } = require("../schemas/prebookSchema");

const router = express.Router();

// Authenticated so the prebook becomes an attempt owned by a user, which is what lets the book
// call use our stored prebookId/transactionId pair rather than one the client supplies.
router.post("/prebook", protect, validateBody(prebookSchema), prebookHotel);

router.post("/", protect, validateBody(bookHotelRequestSchema), bookHotel);

// Before "/:bookingId", which would otherwise match "my-bookings" as an id.
router.get("/my-bookings", protect, validateQuery(bookingListQuerySchema), getMyBookings);

router.get("/:bookingId", protect, validateParams(bookingIdParamsSchema), getBookingById);

router.get(
  "/:bookingId/confirmation",
  protect,
  validateParams(bookingIdParamsSchema),
  getBookingConfirmation
);

router.put("/:bookingId", protect, validateParams(bookingIdParamsSchema), cancelBooking);

module.exports = router;
