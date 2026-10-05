const liteApiService = require("../services/liteApiService");
const getHotelDetails = async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    const hotelDetails = await liteApiService.getHotelDetails(hotelId);

    return res.status(200).json(hotelDetails);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotelDetails,
};