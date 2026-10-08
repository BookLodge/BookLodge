const express = require("express");

const { getHotelDetails, searchHotels } = require("../controllers/hotelController");
const { validateBody, validateParams } = require("../middleware/validators");
const { hotelDetailsParamsSchema, hotelDetailsRequestSchema } = require("../schemas/hotelDetailsSchema");
const { hotelSearchSchema } = require("../schemas/hotelSearchSchema");

const router = express.Router();

router.post(
  "/search",
  validateBody(hotelSearchSchema),
  searchHotels
);

router.post(
  "/:hotelId/details",
  validateParams(hotelDetailsParamsSchema),
  validateBody(hotelDetailsRequestSchema),
  getHotelDetails
);

module.exports = router;
