import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "../../src/schemas/authSchema.js";

describe("auth validation schemas", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.parse({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret123",
      phone: "08012345678",
    });

    expect(result).toMatchObject({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      phone: "08012345678",
      role: "customer",
    });
  });

  it("rejects invalid registration input", () => {
    const result = registerSchema.safeParse({
      firstName: "Jane",
      lastName: "Doe",
      email: "not-an-email",
      password: "123",
      phone: "08012345678",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid login payload", () => {
    const result = loginSchema.parse({
      email: "jane@example.com",
      password: "secret123",
    });

    expect(result).toMatchObject({
      email: "jane@example.com",
      password: "secret123",
    });
  });
});
