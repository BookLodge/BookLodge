const express = require("express");

const { searchLocation } = require("../controllers/hotelSearchController");
const { validateQuery } = require("../middleware/validators");
const { locationSearchRequestSchema } = require("../schemas/locationSearchSchema");

const router = express.Router();

router.get(
  "/location-search",
  validateQuery(locationSearchRequestSchema),
  searchLocation
);

module.exports = router;