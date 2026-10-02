const express = require("express");

const router = express.Router();

// Import the user controller
const userController = require("../controllers/userController"); 

// Define routes
router.get("/me", userController.getMyProfile);

// Export the router to be used in other files
module.exports = router; 

