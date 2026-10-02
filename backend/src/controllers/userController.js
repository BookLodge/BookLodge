const { AppError } = require("../errors");

const { sendSuccess } = require("../utils/apiResponse");


exports.getMyProfile = async (req, res) => {
  
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
        throw new AppError("User not found.", 404);
    };

    sendSuccess(res, "User retrieved successfully", user);

};

