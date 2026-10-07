const express = require("express");

const { prebookHotel } = require("../controllers/bookingController");
const { validateBody } = require("../middleware/validators");
const { prebookSchema } = require("../schemas/prebookSchema");

const router = express.Router();

router.post("/prebook", validateBody(prebookSchema), prebookHotel);

module.exports = router;
