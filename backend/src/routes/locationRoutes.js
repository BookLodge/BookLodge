const express = require("express");

const { searchLocation } = require("../controllers/locationController");
const { validateQuery } = require("../middleware/validators");
const { locationSearchRequestSchema } = require("../schemas/locationSearchSchema");

const router = express.Router();

router.get("/search", validateQuery(locationSearchRequestSchema), searchLocation);

module.exports = router;
