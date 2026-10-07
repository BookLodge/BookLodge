const express = require("express");

const {
  getHotelDetails,
  searchHotels,
  searchLocation,
} = require("../controllers/hotelSearchController");
const { validateBody, validateParams, validateQuery } = require("../middleware/validators");
const { hotelDetailsParamsSchema, hotelDetailsRequestSchema } = require("../schemas/hotelDetailsSchema");
const { hotelSearchSchema } = require("../schemas/hotelSearchSchema");
const { locationSearchRequestSchema } = require("../schemas/locationSearchSchema");

const router = express.Router();

router.get(
  "/location-search",
  validateQuery(locationSearchRequestSchema),
  searchLocation
);

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
