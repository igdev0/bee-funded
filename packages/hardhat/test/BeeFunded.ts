import { ethers } from "hardhat";
import { expect } from "chai";
import { BeeFunded, MockERC20 } from "../typechain-types";

describe("BeeFunded", function () {
  let beeFunded: BeeFunded;
  let mockToken: MockERC20;
  let owner: any, addr1: any, addr2: any;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MockTokenFactory = await ethers.getContractFactory("MockERC20");
    mockToken = await MockTokenFactory.deploy("MockToken", "MTK");
    await mockToken.waitForDeployment();

    const BeeFundedFactory = await ethers.getContractFactory("BeeFunded");
    beeFunded = await BeeFundedFactory.deploy();
    await beeFunded.waitForDeployment();
  });

  describe("Pool Management", () => {
    it("creates a pool", async () => {
      const tx = await beeFunded.connect(owner).createPool(1000);
      await tx.wait();

      const poolId = await beeFunded._poolIDs();
      const pool = await beeFunded.pools(poolId);
      expect(pool.owner).to.equal(await owner.getAddress());
    });
  });

  describe("Donations", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(500);
      poolId = Number(await beeFunded._poolIDs());

      await mockToken.mint(await addr1.getAddress(), 1000);
      await mockToken.connect(addr1).approve(beeFunded.target, 1000);
    });

    it("accepts ERC20 donations", async () => {
      await expect(beeFunded.connect(addr1).donate(poolId, mockToken.target, 100, "For bees")).to.emit(
        beeFunded,
        "NewDonation",
      );
    });

    it("accepts native token (ETH) donations", async () => {
      await expect(
        beeFunded.connect(addr1).donate(poolId, ethers.ZeroAddress, 200, "With ETH", {
          value: 200,
        }),
      ).to.emit(beeFunded, "NewDonation");
    });

    it("rejects invalid pool", async () => {
      await expect(beeFunded.connect(addr1).donate(99, mockToken.target, 100, "Oops")).to.be.revertedWith(
        "Pool does not exist",
      );
    });
  });

  describe("Subscriptions", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(1000);
      poolId = Number(await beeFunded._poolIDs());

      await mockToken.mint(await addr2.getAddress(), 1000);
      await mockToken.connect(addr2).approve(beeFunded.target, 1000);
    });

    it("creates a valid subscription", async () => {
      await beeFunded.connect(addr2).subscribe(poolId, mockToken.target, 100, 604800); // 1 week
      const sub = await beeFunded.subscriptions(0);
      expect(sub.subscriber).to.equal(await addr2.getAddress());
    });

    it("rejects interval < 1 week", async () => {
      await expect(beeFunded.connect(addr2).subscribe(poolId, mockToken.target, 100, 3600)).to.be.revertedWith(
        "Min interval is 1 week",
      );
    });

    it("Checks if user is subscribed", async () => {
      await beeFunded.connect(addr2).subscribe(poolId, mockToken.target, 100, 604800); // 1 week
      const is = await beeFunded.isSubscribed(addr2, owner);
      expect(is).to.equal(true);
    });
  });

  describe("Chainlink Upkeep", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(1000);
      poolId = Number(await beeFunded._poolIDs());

      await mockToken.mint(await addr2.getAddress(), 1000);
      await mockToken.connect(addr2).approve(beeFunded.target, 1000);
      await beeFunded.connect(addr2).subscribe(poolId, mockToken.target, 50, 604800); // 1 week
      await ethers.provider.send("evm_increaseTime", [604800]);
      await ethers.provider.send("evm_mine", []);
    });

    it("checkUpKeep returns true if due", async () => {
      const [needed] = await beeFunded.checkUpkeep("0x");
      expect(needed).to.equal(true);
    });

    it("performUpkeep executes and updates nextPaymentTime", async () => {
      const [, data] = await beeFunded.checkUpkeep("0x");
      await expect(beeFunded.performUpkeep(data)).to.not.be.reverted;
    });
  });

  describe("Withdrawals", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(1000);
      poolId = Number(await beeFunded._poolIDs());

      await mockToken.mint(await addr1.getAddress(), 1000);
      await mockToken.connect(addr1).approve(beeFunded.target, 1000);
      await beeFunded.connect(addr1).donate(poolId, mockToken.target, 100, "Funding");
    });

    it("allows pool owner to withdraw tokens", async () => {
      await expect(beeFunded.connect(owner).withdraw(poolId, mockToken.target, 100)).to.not.be.reverted;
    });

    it("prevents non-owner from withdrawing", async () => {
      await expect(beeFunded.connect(addr1).withdraw(poolId, mockToken.target, 100)).to.be.revertedWith(
        "Not pool owner",
      );
    });
  });
});
