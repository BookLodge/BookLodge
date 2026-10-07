import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const User = require("../../src/models/User.js");
const { getMyProfile } = require("../../src/controllers/userController.js");
const { AppError } = require("../../src/errors.js");

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };

  res.status.mockReturnValue(res);

  return res;
};

// findById(...).select("-password") resolves to the user.
const mockFindById = (user) => {
  const select = vi.fn().mockResolvedValue(user);

  User.findById.mockReturnValue({ select });

  return select;
};

describe("getMyProfile", () => {
  beforeEach(() => {
    vi.spyOn(User, "findById");
  });

  afterEach(() => vi.restoreAllMocks());

  it("looks up the caller's own id and omits the password", async () => {
    const select = mockFindById({ _id: "user-1", email: "ada@example.com" });
    const req = { user: { userId: "user-1", role: "customer" }, params: { id: "99" } };
    const res = mockRes();

    await getMyProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith("user-1");
    expect(select).toHaveBeenCalledWith("-password");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User retrieved successfully",
      data: { _id: "user-1", email: "ada@example.com" },
    });
  });

  it("lets an admin look up the id from the route params", async () => {
    mockFindById({ _id: "42" });
    const req = { user: { userId: "user-1", role: "admin" }, params: { id: "42" } };

    await getMyProfile(req, mockRes());

    expect(User.findById).toHaveBeenCalledWith("42");
  });

  it("rejects with 404 when the user does not exist", async () => {
    mockFindById(null);

    const error = await getMyProfile(
      { user: { userId: "user-1", role: "customer" }, params: {} },
      mockRes()
    ).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("User not found.");
  });
});
