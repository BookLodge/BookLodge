import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const env = require("../../src/config/env.js");
const { generateToken, comparePassword } = require("../../src/utils/authHelper.js");

const toSeconds = (value) => {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) return Number(value);

  return Number(match[1]) * { s: 1, m: 60, h: 3600, d: 86400 }[match[2]];
};

describe("generateToken", () => {
  it("signs a token that verifies with the configured secret", () => {
    const token = generateToken({ _id: "user-1", role: "customer" });

    expect(typeof token).toBe("string");
    expect(jwt.verify(token, env.JWT_SECRET)).toMatchObject({
      userId: "user-1",
      role: "customer",
    });
  });

  it("carries only the user id and role", () => {
    const token = generateToken({ _id: "user-1", role: "admin", email: "ada@example.com" });

    expect(Object.keys(jwt.verify(token, env.JWT_SECRET)).sort()).toEqual([
      "exp",
      "iat",
      "role",
      "userId",
    ]);
  });

  it("expires according to JWT_EXPIRES_IN", () => {
    const { iat, exp } = jwt.verify(
      generateToken({ _id: "user-1", role: "customer" }),
      env.JWT_SECRET
    );

    expect(exp - iat).toBe(toSeconds(env.JWT_EXPIRES_IN));
  });

  it("rejects a token signed with a different secret", () => {
    const token = generateToken({ _id: "user-1", role: "customer" });

    expect(() => jwt.verify(token, "some-other-secret")).toThrow();
  });
});

describe("comparePassword", () => {
  const hash = bcrypt.hashSync("secret123", 4);

  it("returns true for the matching password", async () => {
    await expect(comparePassword("secret123", hash)).resolves.toBe(true);
  });

  it("returns false for a wrong password", async () => {
    await expect(comparePassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("returns false rather than throwing for a malformed hash", async () => {
    await expect(comparePassword("secret123", "not-a-hash")).resolves.toBe(false);
  });
});
