const express = require("express");

const { searchLocation } = require("../controllers/hotelSeachController");
const { validateQuery } = require("../middleware/validators");
const { locationSearchRequestSchema } = require("../schemas/hotelSchema");

const router = express.Router();

router.get(
  "/location-search",
  validateQuery(locationSearchRequestSchema),
  searchLocation
);

module.exports = router;