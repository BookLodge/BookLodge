const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");
const { registerSchema, loginSchema } = require("../schemas/authSchema");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/login", validateRequest(loginSchema), loginUser);

module.exports = router;