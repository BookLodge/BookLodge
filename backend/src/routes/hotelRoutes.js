const express = require("express");

const { searchHotels } = require("../controllers/hotelSeachController");
const { validateBody } = require("../middleware/validators");
const { hotelSearchSchema } = require("../schemas/hotelSchema");

const router = express.Router();

router.post(
  "/search",
  validateBody(hotelSearchSchema),
  searchHotels
);

module.exports = router;

