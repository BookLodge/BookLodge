const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
	test: {
		environment: "node",
		// Ensures env.js loads ".env.test" when tests run via vitest.
		env: {
			NODE_ENV: "test",
		},
	},
});

