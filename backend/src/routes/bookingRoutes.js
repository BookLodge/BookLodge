const express = require("express");

const { bookHotel } = require("../controllers/bookingController");

const { validateBody } = require("../middleware/validators");

const { bookHotelSchema } = require("../schemas/bookingSchema");

const auth = require("../middleware/auth");

const router = express.Router();

router.post("/", auth, validateBody(bookHotelSchema), bookHotel);

module.exports = router;
