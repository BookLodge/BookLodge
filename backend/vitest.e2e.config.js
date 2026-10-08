const { defineConfig } = require("vitest/config");

// Separate from vitest.config.js: this suite calls the live LiteAPI sandbox and
// the test database, so it is kept out of `npm test` and given long timeouts.
module.exports = defineConfig({
	test: {
		environment: "node",
		include: ["tests/e2e/**/*.e2e.js"],
		testTimeout: 180_000,
		hookTimeout: 180_000,
		env: {
			NODE_ENV: "test",
		},
	},
});
