const express = require("express");
const { prebookHotel } = require("../controllers/hotelSeachController");

const router = express.Router();

router.post("/prebook", prebookHotel);

module.exports = router;