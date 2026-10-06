const express = require("express");
const router = express.Router();

const { getHotelDetails } = require("../controllers/hotelController");

const {
  validateBody,
  validateParams,
} = require("../middleware/validators");

const {
  hotelDetailsParamsSchema,
  hotelDetailsRequestSchema,
} = require("../schemas/hotelSchema");

router.post(
  "/:hotelId/details",
  validateParams(hotelDetailsParamsSchema),
  validateBody(hotelDetailsRequestSchema),
  getHotelDetails
);

module.exports = router;