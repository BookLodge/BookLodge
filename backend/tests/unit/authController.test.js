import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRequire } from "node:module";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../../src/config/env.js");
const User = require("../../src/models/User.js");
const { registerUser, loginUser } = require("../../src/controllers/authController.js");
const { AppError } = require("../../src/errors.js");

const mockRes = () => {
  const res = { status: vi.fn(), json: vi.fn() };

  res.status.mockReturnValue(res);

  return res;
};

const storedUser = (overrides = {}) => ({
  _id: "user-1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "+2348000000000",
  role: "customer",
  password: bcrypt.hashSync("secret123", 4),
  ...overrides,
});

describe("registerUser", () => {
  beforeEach(() => {
    vi.spyOn(User, "findOne");
    vi.spyOn(User, "create");
  });

  afterEach(() => vi.restoreAllMocks());

  it("rejects an email that is already registered", async () => {
    User.findOne.mockResolvedValue(storedUser());

    await expect(registerUser({ body: { email: "ada@example.com" } }, mockRes())).rejects.toThrow(
      expect.objectContaining({ message: "Email already registered", statusCode: 409 })
    );
    expect(User.create).not.toHaveBeenCalled();
  });

  it("creates the user and responds 201 without the password", async () => {
    const created = storedUser();
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      toObject: () => ({ ...created, password: created.password }),
    });

    const res = mockRes();
    await registerUser({ body: { email: "ada@example.com", password: "secret123" } }, res);

    expect(User.create).toHaveBeenCalledWith({ email: "ada@example.com", password: "secret123" });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User registered successfully",
      data: { user: expect.not.objectContaining({ password: expect.anything() }) },
    });

    const body = res.json.mock.calls[0][0];

    expect(body.data.user).not.toHaveProperty("password");
    expect(body.data.user.email).toBe("ada@example.com");
  });

  it("propagates a duplicate-key error from the unique index", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockRejectedValue(
      Object.assign(new Error("E11000 duplicate key error"), { code: 11000 })
    );

    await expect(
      registerUser({ body: { email: "ada@example.com", password: "secret123" } }, mockRes())
    ).rejects.toMatchObject({ code: 11000 });
  });
});

describe("loginUser", () => {
  beforeEach(() => {
    vi.spyOn(User, "findOne");
  });

  afterEach(() => vi.restoreAllMocks());

  it("rejects an unknown email", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(
      loginUser({ body: { email: "nobody@example.com", password: "secret123" } }, mockRes())
    ).rejects.toThrow(
      expect.objectContaining({ message: "Invalid email or password", statusCode: 401 })
    );
  });

  it("rejects a wrong password", async () => {
    User.findOne.mockResolvedValue(storedUser());

    const error = await loginUser(
      { body: { email: "ada@example.com", password: "wrong-password" } },
      mockRes()
    ).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Invalid email or password");
  });

  it("returns a token and the user's public fields on success", async () => {
    User.findOne.mockResolvedValue(storedUser());

    const res = mockRes();
    await loginUser({ body: { email: "ada@example.com", password: "secret123" } }, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.message).toBe("Login successful");
    expect(body.data.user).toEqual({
      id: "user-1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "+2348000000000",
      role: "customer",
    });
    expect(jwt.verify(body.data.token, env.JWT_SECRET)).toMatchObject({
      userId: "user-1",
      role: "customer",
    });
  });

  it("never returns the stored password hash", async () => {
    const user = storedUser();
    User.findOne.mockResolvedValue(user);

    const res = mockRes();
    await loginUser({ body: { email: "ada@example.com", password: "secret123" } }, res);

    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(user.password);
  });
});
