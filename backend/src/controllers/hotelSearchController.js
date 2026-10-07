const { liteApiService } = require("../services/liteapi/liteApiService");
const { sendSuccess } = require("../utils/apiResponse");

const searchLocation = async (req, res) => {
  const result = await liteApiService.searchLocations(req.query.query);

  sendSuccess(res, "Locations retrieved successfully", result);
};

const searchHotels = async (req, res) => {
  const result = await liteApiService.searchHotels(req.body);

  sendSuccess(res, "Hotels retrieved successfully", result);
};

module.exports = {
  searchHotels,
  searchLocation,
};
