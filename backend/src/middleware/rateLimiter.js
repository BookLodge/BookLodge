const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { AppError } = require("../errors");

const rateLimitHandler = (message) => (req, res, next, options) => {
  next(new AppError(message, options.statusCode)); // 429, handled by errorHandler
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body.email;
    return `${ipKeyGenerator(req.ip)}|${email}`;
  },
  handler: rateLimitHandler(
    "Too many failed login attempts. Please try again in 15 minutes."
  ),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: rateLimitHandler(
    "Too many requests. Please try again in an hour."
  ),
});

module.exports = { loginLimiter, registerLimiter };
