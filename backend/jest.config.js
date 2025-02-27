/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        // Ensure `ts-jest` uses your `tsconfig.json` paths
        tsconfig: "tsconfig.json",
      },
    ],
  },
  // Add this section to map the '@' alias
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // Maps `@/...` to `src/...`
  },
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterEnv: ["./__tests__/_setup/setup.ts"],
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./__tests__/report",
        filename: "index.html",
      },
    ],
  ],
};
