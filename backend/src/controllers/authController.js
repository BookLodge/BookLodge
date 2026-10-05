const User = require("../models/User");

const {
  comparePassword,
  generateToken
} = require("../utils/authHelper");

const {
  sendSuccess,
  sendError
} = require("../utils/apiResponse");

const registerUser = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    phone,
    role
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return sendError(
      res,
      "Email already registered",
      409
    );
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
    role
  });

  // Don't send the password back to the user
  return sendSuccess(
    res,
    "User registered successfully",
    {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    },
    201
  );
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    return sendError(
      res,
      "Invalid email or password",
      401
    );
  }

  // Check password
  const isPasswordCorrect = await comparePassword(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    return sendError(
      res,
      "Invalid email or password",
      401
    );
  }

  // Generate JWT
  const token = generateToken(user);

  return sendSuccess(
    res,
    "Login successful",
    {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    }
  );
};

module.exports = {
  registerUser,
  loginUser
};
