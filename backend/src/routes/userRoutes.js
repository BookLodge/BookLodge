const express = require("express");

const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/authorizeRoles");
const { getUserParams } = require("../schemas/userSchema");

const router = express.Router();

// Import the user controller
const { getMyProfile } = require("../controllers/userController"); 

// Define routes
router.get(
    "/me",
    protect,
    getMyProfile
);
router.get(
    "/:id",
    protect,
    authorizeRoles(["admin"]),
    validate(getUserParams),
    getMyProfile
);

// Export the router to be used in other files
module.exports = router; 

