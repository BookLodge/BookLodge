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

const router = express.Router();

router.post(
  "/register",
  validateBody(registerSchema),
  registerUser
);

router.post(
  "/login",
  validateBody(loginSchema),
  loginUser
);

module.exports = router;