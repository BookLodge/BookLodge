const express = require("express");
const router = express.Router();

const { getHotelDetails } = require("../controllers/hotelController");
const { validateParams } = require("../middleware/validators");
const { hotelDetailsParamsSchema } = require("../schemas/hotelSchema");

router.get(
  "/:hotelId",
  validateParams(hotelDetailsParamsSchema),
  getHotelDetails
);

module.exports = router;