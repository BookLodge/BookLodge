const { liteApiService } = require("../services/liteapi/liteApiService");
const { sendSuccess } = require("../utils/apiResponse");
const { generateClientReference } = require("../utils/generateRef");

const bookHotel = async (req, res) => {
  const result = await liteApiService.bookRate({
    ...req.body,
    clientReference: generateClientReference(),
  });

  sendSuccess(res, "Hotel booked successfully", result, 201);
};

const prebookHotel = async (req, res) => {
  const result = await liteApiService.prebook(req.body);

  sendSuccess(res, "Hotel prebooked successfully", result);
};

module.exports = {
  bookHotel,
  prebookHotel,
};
