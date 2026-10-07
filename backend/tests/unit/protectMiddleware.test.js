import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken");
const env = require("../../src/config/env.js");
const { protect } = require("../../src/middleware/auth.js");
const { AppError } = require("../../src/errors");

const run = (headers) => {
  const req = { headers };
  const next = vi.fn();

  protect(req, {}, next);

  return { req, error: next.mock.calls[0]?.[0], next };
};

const expectUnauthorized = (error) => {
  expect(error).toBeInstanceOf(AppError);
  expect(error.statusCode).toBe(401);
};

describe("protect", () => {
  it("rejects a request with no Authorization header", () => {
    expectUnauthorized(run({}).error);
  });

  it("rejects a header that is not a bearer token", () => {
    expectUnauthorized(run({ authorization: "Token abc.def.ghi" }).error);
  });

  it("rejects a bearer header with no token", () => {
    expectUnauthorized(run({ authorization: "Bearer" }).error);
  });

  it("rejects a token that does not verify", () => {
    expectUnauthorized(run({ authorization: "Bearer not-a-jwt" }).error);
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ userId: "user-1" }, "some-other-secret");

    expectUnauthorized(run({ authorization: `Bearer ${token}` }).error);
  });

  it("rejects an expired token", () => {
    const token = jwt.sign({ userId: "user-1", role: "customer" }, env.JWT_SECRET, {
      expiresIn: -1,
    });

    expectUnauthorized(run({ authorization: `Bearer ${token}` }).error);
  });

  it("attaches the decoded payload and continues for a valid token", () => {
    const token = jwt.sign({ userId: "user-1", role: "admin" }, env.JWT_SECRET);
    const { req, error, next } = run({ authorization: `Bearer ${token}` });

    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ userId: "user-1", role: "admin" });
  });
});
