import { describe, it, expect, vi } from "vitest";
import { createRequire } from "node:module";
import { z } from "zod";

// Source modules are CommonJS; loading them through Node keeps one instance of each module.
const require = createRequire(import.meta.url);
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../../src/middleware/validators.js");

const run = (middleware, req) => {
  const next = vi.fn();

  middleware(req, {}, next);

  return { error: next.mock.calls[0]?.[0], next };
};

describe("validateBody", () => {
  const schema = z.object({ email: z.string().email(), age: z.coerce.number().int() });

  it("replaces the body with the parsed value", () => {
    const req = { body: { email: "ada@example.com", age: "36" } };
    const { next } = run(validateBody(schema), req);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body).toEqual({ email: "ada@example.com", age: 36 });
  });

  it("strips fields the schema does not define", () => {
    const req = { body: { email: "ada@example.com", age: 36, role: "admin" } };
    run(validateBody(schema), req);

    expect(req.body).not.toHaveProperty("role");
  });

  it("throws a ZodError for an invalid body", () => {
    const req = { body: { email: "not-an-email", age: 36 } };

    expect(() => validateBody(schema)(req, {}, vi.fn())).toThrow(
      expect.objectContaining({ name: "ZodError" })
    );
  });
});

describe("validateQuery and validateParams", () => {
  it("parses the query instead of the body", () => {
    const req = { query: { page: "2" }, body: {} };
    run(validateQuery(z.object({ page: z.coerce.number().int() })), req);

    expect(req.query).toEqual({ page: 2 });
    expect(req.body).toEqual({});
  });

  it("parses params with an object schema", () => {
    const req = { params: { id: "42" } };
    run(validateParams(z.object({ id: z.coerce.number().int() })), req);

    expect(req.params).toEqual({ id: 42 });
  });

  it("rejects params shaped as an object when the schema expects a scalar", () => {
    const req = { params: { id: "42" } };

    expect(() => validateParams(z.coerce.number().int())(req, {}, vi.fn())).toThrow(
      expect.objectContaining({ name: "ZodError" })
    );
  });
});
