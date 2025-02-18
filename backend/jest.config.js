/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
