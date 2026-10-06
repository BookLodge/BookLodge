const express = require("express");

const { getBookingConfirmation } = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { validateParams } = require("../middleware/validators");
const { bookingIdParamsSchema } = require("../schemas/bookingSchema");

const router = express.Router();

router.get(
  "/:bookingId/confirmation",
  protect,
  validateParams(bookingIdParamsSchema),
  getBookingConfirmation
);

module.exports = router;
