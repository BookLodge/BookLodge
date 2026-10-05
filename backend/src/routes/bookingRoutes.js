const express = require("express");
const bookingController = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Keep this above any "/:id" routes added later
router.get("/my-bookings", protect, bookingController.getMyBookings);

module.exports = router;