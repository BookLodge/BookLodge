const { liteApiService } = require("../services/liteapi/liteApiService");
const { sendSuccess } = require("../utils/apiResponse");

const searchLocation = async (req, res) => {
  const result = await liteApiService.searchLocations(req.query.query);

  sendSuccess(res, "Locations retrieved successfully", result);
};

module.exports = {
  searchLocation,
};
