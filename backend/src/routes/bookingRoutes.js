const express = require("express");

const {
  bookHotel,
  prebookHotel,
  getBookingById,
  getBookingConfirmation,
  cancelBooking,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { validateBody, validateParams } = require("../middleware/validators");
const { bookingIdParamsSchema } = require("../schemas/bookingSchema");
const { bookHotelRequestSchema } = require("../schemas/bookRateSchema");
const { prebookSchema } = require("../schemas/prebookSchema");

const router = express.Router();

router.post("/prebook", validateBody(prebookSchema), prebookHotel);

router.post("/", protect, validateBody(bookHotelRequestSchema), bookHotel);

router.get("/:bookingId", protect, validateParams(bookingIdParamsSchema), getBookingById);

router.get(
  "/:bookingId/confirmation",
  protect,
  validateParams(bookingIdParamsSchema),
  getBookingConfirmation
);

router.put("/:bookingId", protect, validateParams(bookingIdParamsSchema), cancelBooking);

module.exports = router;
