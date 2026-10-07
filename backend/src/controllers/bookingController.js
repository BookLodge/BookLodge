const { liteApiService } = require("../services/liteapi/liteApiService");
const { sendSuccess } = require("../utils/apiResponse");

const prebookHotel = async (req, res) => {
  const result = await liteApiService.prebook(req.body);

  sendSuccess(res, "Hotel prebooked successfully", result);
};

module.exports = {
  prebookHotel,
};
