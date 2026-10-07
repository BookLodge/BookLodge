import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const authorizeRoles = require("../../src/middleware/authorizeRoles.js");
const { AppError } = require("../../src/errors");

const run = (user, ...allowedRoles) => {
  const next = vi.fn();

  authorizeRoles(...allowedRoles)({ user }, {}, next);

  return { error: next.mock.calls[0]?.[0], next };
};

describe("authorizeRoles", () => {
  it("rejects an unauthenticated request", () => {
    const { error } = run(undefined, "admin");

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
  });

  it("rejects a user with no role", () => {
    const { error } = run({ userId: "user-1" }, "admin");

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
  });

  it("rejects a user whose role is not allowed", () => {
    const { error } = run({ userId: "user-1", role: "customer" }, "admin");

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
  });

  it("continues when the role is allowed", () => {
    const { error, next } = run({ userId: "user-1", role: "admin" }, "admin");

    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("accepts any of several allowed roles", () => {
    expect(run({ userId: "user-1", role: "hotel_manager" }, "admin", "hotel_manager").error).toBeUndefined();
    expect(run({ userId: "user-1", role: "admin" }, "admin", "hotel_manager").error).toBeUndefined();
  });

  it("takes the allowed roles as separate arguments, not an array", () => {
    const { error } = run({ userId: "user-1", role: "admin" }, ["admin"]);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
  });
});
