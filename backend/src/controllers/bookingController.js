const liteApiService = require("../services/liteApiService");

const bookHotel = async (req, res, next) => {
  try {
    const result = await liteApiService.bookRate(req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookHotel,
};