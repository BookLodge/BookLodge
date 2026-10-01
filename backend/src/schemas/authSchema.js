const { z } = require("zod");

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(1),
  role: z.enum(["customer", "admin"]).default("customer")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

module.exports = {
  registerSchema,
  loginSchema
};