const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `yarn dapp:lint --fix`;

const checkTypesNextCommand = () => "yarn contracts:check-types";

const buildHardhatEslintCommand = (filenames) =>
  `yarn contracts:lint-staged --fix ${filenames
    .map((f) => path.relative(path.join("packages", "contracts"), f))
    .join(" ")}`;


const fixBackendEslintCommand = () => `yarn backend:lint`
module.exports = {
  "packages/dapp/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/contracts/**/*.ts": [buildHardhatEslintCommand],
  "packages/backend/**/*.ts": [fixBackendEslintCommand],
};
