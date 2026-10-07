const express = require("express");

const { searchHotels, searchLocation } = require("../controllers/hotelSearchController");
const { validateBody, validateQuery } = require("../middleware/validators");
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

module.exports = router;
