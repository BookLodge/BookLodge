const jwt = require("jsonwebtoken");
const { AppError } = require("../errors");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new AppError("No token provided", 401));
  }

  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError("Invalid authorization format", 401));
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return next(new AppError("Invalid or expired token", 401));
    }

    req.user = decoded;
    next();
  });
};

module.exports = {
  protect
};