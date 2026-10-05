const { AppError } = require("../errors");
const { sendSuccess } = require("../utils/apiResponse");

exports.getMyProfile = async (req, res) => {
    let id = req.user.id
    if (req.user.role === "admin") {
        id = req.params.id
    }
    
    const user = await User.findById(id).select("-password");
    if (!user) {
        throw new AppError("User not found.", 404);
    };

    sendSuccess(res, "User retrieved successfully", user);

};

