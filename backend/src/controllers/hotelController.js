const { liteApiService } = require("../services/liteapi/liteApiService");
const { sendSuccess } = require("../utils/apiResponse");

const getHotelDetails = async (req, res) => {
  const result = await liteApiService.getHotelDetails(req.params.hotelId, req.body);

  sendSuccess(res, "Hotel details retrieved successfully", result);
};

const searchHotels = async (req, res) => {
  const result = await liteApiService.searchHotels(req.body);

  sendSuccess(res, "Hotels retrieved successfully", result);
};

module.exports = {
  getHotelDetails,
  searchHotels,
};
