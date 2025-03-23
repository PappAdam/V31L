const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
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
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterEnv: ["./__tests__/_setup/setup.ts"],
  reporters: [
    "default",
    ["jest-ctrf-json-reporter", {}],
    [
      "jest-html-reporters",
      {
        publicPath: "./__tests__/report",
        filename: "index.html",
      },
    ],
  ],
};
