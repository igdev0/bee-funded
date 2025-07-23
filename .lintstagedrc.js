const path = require("path");

const buildNextEslintCommand = (filenames) =>
  `yarn dapp:lint --fix`;

const checkTypesNextCommand = () => "yarn hardhat:check-types";

const buildHardhatEslintCommand = (filenames) =>
  `yarn hardhat:lint-staged --fix ${filenames
    .map((f) => path.relative(path.join("packages", "hardhat"), f))
    .join(" ")}`;


const fixBackendEslintCommand = () => `yarn backend:lint`
module.exports = {
  "packages/dapp/**/*.{ts,tsx}": [
    buildNextEslintCommand,
    checkTypesNextCommand,
  ],
  "packages/hardhat/**/*.ts": [buildHardhatEslintCommand],
  "packages/backend/**/*.ts": [fixBackendEslintCommand],
};
