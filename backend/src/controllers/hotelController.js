const liteApiService = require("../services/liteApiService");

const getHotelDetails = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { rateCriteria } = req.body;

    const hotelDetails = await liteApiService.getHotelDetails(
      hotelId,
      rateCriteria
    );

    return res.status(200).json(hotelDetails);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotelDetails,
};