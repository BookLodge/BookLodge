const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided"
      });
    }

    // Check that it starts with Bearer
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format"
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store the decoded user information in req.user
    req.user = decoded;

    // Continue to the next middleware/controller
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = {
  protect
};