import { ethers } from "hardhat";
import { BeeFunded } from "../typechain-types";

describe("BeeFunded", function () {
  // We define a fixture to reuse the same setup in every test.

  let yourContract: BeeFunded;
  before(async () => {
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = (await yourContractFactory.deploy()) as BeeFunded;
    await yourContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should be abl", () => {});
  });
});
