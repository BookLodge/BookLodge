const liteApiService = require("../services/liteApiService");

const searchHotels = async (req, res, next) => {
  try {
    const result = await liteApiService.searchHotels(req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchHotels,
};