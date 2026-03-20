const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
	testDir: "./e2e",
	timeout: 30000,
	retries: 0,
	use: {
		baseURL: "http://localhost:3001",
		headless: true,
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: { browserName: "chromium" },
		},
	],
	webServer: [
		{
			command: "node app.js",
			cwd: "./backend",
			port: 3000,
			reuseExistingServer: true,
		},
		{
			command: "npx serve . -l 3001",
			cwd: "./frontend",
			port: 3001,
			reuseExistingServer: true,
		},
	],
});
