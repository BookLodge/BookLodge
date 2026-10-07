const express = require("express");

const { bookHotel, prebookHotel } = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { validateBody } = require("../middleware/validators");
const { bookHotelRequestSchema } = require("../schemas/bookRateSchema");
const { prebookSchema } = require("../schemas/prebookSchema");

const router = express.Router();

router.post("/prebook", validateBody(prebookSchema), prebookHotel);

router.post("/", protect, validateBody(bookHotelRequestSchema), bookHotel);

module.exports = router;
