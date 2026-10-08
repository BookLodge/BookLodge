const User = require("../models/User");
const { AppError } = require("../errors");
const { comparePassword, generateToken } = require("../utils/authHelper");
const { sendSuccess } = require("../utils/apiResponse");

const registerUser = async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const user = await User.create(req.body);
  const userData = user.toObject();

  delete userData.password;

sendSuccess(res, "User registered successfully", { user: userData }, 201);
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await comparePassword(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user);

  sendSuccess(res, "Login successful", {
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
};

module.exports = {
  registerUser,
  loginUser
};