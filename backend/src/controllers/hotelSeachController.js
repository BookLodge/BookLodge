const liteApiService = require("../services/liteApiService");

const searchLocation = async (req, res, next) => {
  try {
    const result = await liteApiService.searchHotels(req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchLocation,
};