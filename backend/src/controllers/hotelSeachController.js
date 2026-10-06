const { AppError } = require("../errors");
const { sendSuccess } = require("../utils/apiResponse");
const liteApiService = require("../services/liteApiService");

const prebookHotel = async (req, res) => {
  const { offerId, usePaymentSdk = true } = req.body;

  if (!offerId) {
    throw new AppError("offerId is required", 400);
  }

  const result = await liteApiService.prebookRate({
    offerId,
    usePaymentSdk,
  });

  return sendSuccess(res, "Hotel prebooked successfully", result);
};

module.exports = {
  prebookHotel,
};