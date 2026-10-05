const express = require("express");

const {
  cancelBooking,
} = require("../controllers/bookingCancellationController");

const { validateParams } = require("../middleware/validators");
const { bookingIdParamsSchema } = require("../schemas/bookingSchema");
const auth = require("../middleware/auth");

const router = express.Router();

router.delete(
  "/:bookingId",
  auth,
  validateParams(bookingIdParamsSchema),
  cancelBooking
);

module.exports = router;