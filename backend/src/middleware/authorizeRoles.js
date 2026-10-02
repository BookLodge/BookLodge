const { AppError } = require("../errors");

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // User is not authenticated
    if (!req.user || !req.user.role) {
      return next(new AppError("Unauthorized", 401));
    }

    // User is authenticated but does not have the required role
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }

    // User has an allowed role
    next();
  };
};

module.exports = authorizeRoles;