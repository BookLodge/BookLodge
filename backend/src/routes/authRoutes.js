const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const {
  registerSchema,
  loginSchema
} = require("../schemas/authSchema");

const {
  validateBody
} = require("../middleware/validators");

const {
  loginLimiter,
  registerLimiter
} = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  registerUser
);

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  loginUser
);

module.exports = router;