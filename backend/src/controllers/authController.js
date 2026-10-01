const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require("../errors");
const env = require("../config/env");

const registerUser = async (req, res) => {
  const { firstName, lastName, email, password, phone, role } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    phone,
    role
  });

  res.status(201).json({
    message: "User registered successfully",
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

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role
    },
    env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );

  res.status(200).json({
    message: "Login successful",
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