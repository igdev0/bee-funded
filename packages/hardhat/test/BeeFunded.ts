import { deployments, ethers, getNamedAccounts, getUnnamedAccounts, network } from "hardhat";
import {
  AutomationUpkeep,
  BeeFundedCore,
  DonationManager,
  MockERC20,
  MockUSDC,
  SubscriptionManager,
} from "../typechain-types";
import { expect } from "chai";
import { Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const AUTOMATION_UP_KEEP_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";

// --- Helper function for generating Permit signature ---
async function generatePermitSignature(
  ownerSigner: Signer, // The ethers.Signer of the token owner
  spenderAddress: string, // The address of BeeFunded contract
  tokenContract: MockERC20 | MockUSDC, // The MockERC20 contract instance
  value: bigint, // The amount to permit (e.g., total subscription value)
  deadline: bigint, // The deadline for the permit signature
) {
  const ownerAddress = await ownerSigner.getAddress();
  const nonce = await tokenContract.nonces(ownerAddress); // Get current nonce for the owner
  const chainId = (await ethers.provider.getNetwork()).chainId; // Get current chain ID
  const domain = {
    name: await tokenContract.name(), // Name of the ERC20Permit token (e.g., "MockToken")
    version: "1", // EIP-2612 standard version
    chainId: chainId,
    verifyingContract: await tokenContract.getAddress(), // Address of the ERC20Permit token contract
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    owner: ownerAddress,
    spender: spenderAddress,
    value: value,
    nonce: nonce,
    deadline: deadline,
  };

  // Use ownerSigner to sign the typed data
  const signature = await ownerSigner.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature); // Use ethers.Signature.from for splitting

  return {
    v: BigInt(sig.v),
    r: sig.r,
    s: sig.s,
    deadline,
  };
}

describe("BeeFunded", function () {
  let beeFundedCore: BeeFundedCore;
  let subscriptionManager: SubscriptionManager;
  let donationManager: DonationManager;
  let automationUpKeep: AutomationUpkeep;
  let mockToken: MockERC20;
  let mockUSDC: MockUSDC;
  let deployer: string, addr1: any, addr2: any;

  const externalId = "some-random-uuid-generated";
  const hashedExternalId = ethers.keccak256(Buffer.from(externalId));
  before(async () => {
    await deployments.fixture(["BeeFunded"]);
    const { deployer: _deployer } = await getNamedAccounts();
    deployer = _deployer;
    beeFundedCore = await ethers.getContract("BeeFundedCore", deployer);
    subscriptionManager = await ethers.getContract("SubscriptionManager", deployer);
    donationManager = await ethers.getContract("DonationManager", deployer);
    automationUpKeep = await ethers.getContract("AutomationUpkeep", deployer);
    mockToken = await ethers.getContract("MockERC20", deployer);
    mockUSDC = await ethers.getContract("MockUSDC", deployer);
    [addr1, addr2] = await getUnnamedAccounts();
  });

  it("Owner should be defined", () => {
    expect(deployer).not.equal(undefined);
  });

  it("Contracts should all be set", () => {
    expect(beeFundedCore).not.equal(undefined);
    expect(subscriptionManager).not.equal(undefined);
    expect(donationManager).not.equal(undefined);
    expect(automationUpKeep).not.equal(undefined);
    expect(mockToken).not.equal(undefined);
    expect(mockUSDC).not.equal(undefined);
  });

  describe("BeeFundedCore", () => {
    it("should be able to create a pool", async () => {
      await expect(beeFundedCore.createPool(await mockUSDC.getAddress(), hashedExternalId)).to.emit(
        beeFundedCore,
        "DonationPoolCreated",
      );
    });

    it("should be able to retrieve a pool by its internal id", async () => {
      const pool = await beeFundedCore.getPool(0);
      expect(pool.metadataId).equal(hashedExternalId);
    });

    it("should be able to retrieve the pool owner by its internal id", async () => {
      const poolOwner = await beeFundedCore.getPoolOwner(0);
      expect(poolOwner).equal(deployer);
    });

    it("should be able to update pool metadata ID ", async () => {
      await expect(beeFundedCore.updatePoolMetadataId(0, ethers.keccak256(Buffer.from("new-uuid")))).emit(
        beeFundedCore,
        "PoolMetadataUpdated",
      );
    });

    it("should be able to increase token balance", async () => {
      const hexAmount = "0x" + ethers.parseUnits("1", 18).toString(16); // "0x0de0b6b3a7640000"
      await network.provider.send("hardhat_setBalance", [await donationManager.getAddress(), hexAmount]);

      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [await donationManager.getAddress()],
      });

      await expect(
        beeFundedCore
          .connect(await ethers.getSigner(await donationManager.getAddress()))
          .increaseTokenBalance(BigInt(0), await mockUSDC.getAddress(), ethers.parseUnits("10", 6)),
      ).not.revertedWithoutReason();
    });

    it("should be able to decrease token balance", async () => {
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [await donationManager.getAddress()],
      });

      await expect(
        beeFundedCore
          .connect(await ethers.getSigner(await donationManager.getAddress()))
          .decreaseTokenBalance(BigInt(0), await mockUSDC.getAddress(), ethers.parseUnits("10", 6)),
      ).not.revertedWithoutReason();
    });
  });

  describe("DonationManager", () => {
    it("should be able to donate with native token", async () => {
      await expect(
        donationManager.donateNative(0, "Thank you!", {
          value: ethers.parseEther("1"),
        }),
      ).emit(donationManager, "DonationSuccess");
    });
    it("should be able to donate with permit token", async () => {
      const value = ethers.parseUnits("100", 6);
      const { v, r, s, deadline } = await generatePermitSignature(
        await ethers.getSigner(deployer),
        await donationManager.getAddress(),
        mockUSDC,
        value,
        BigInt(Date.now() + 1000 * 60 * 60 * 60),
      );
      await expect(
        donationManager.donateWithPermit(
          deployer,
          BigInt(0),
          await mockUSDC.getAddress(),
          value,
          "Thank you",
          deadline,
          v,
          r,
          s,
        ),
      ).emit(donationManager, "DonationSuccess");
    });
    it("should be able to perform a subscription", async () => {
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [await subscriptionManager.getAddress()],
      });
      await mockUSDC.transfer(await subscriptionManager.getAddress(), ethers.parseUnits("1000", 6));

      // Approve so the performSubscription won't fail.
      await mockUSDC.approve(await donationManager.getAddress(), BigInt(10));
      await expect(
        donationManager.performSubscription(
          await subscriptionManager.getAddress(),
          BigInt(0),
          await mockUSDC.getAddress(),
          BigInt(10),
        ),
      ).not.revertedWithoutReason();
    });

    describe("withdraw tokens", () => {
      it("should be able to withdraw native tokens", async () => {
        await expect(donationManager.withdraw(0, ethers.ZeroAddress, ethers.parseUnits("1", 18))).emit(
          donationManager,
          "WithdrawSuccess",
        );
      });

      it("should not be able to withdraw native tokens more than you own", async () => {
        await expect(donationManager.withdraw(0, ethers.ZeroAddress, ethers.parseUnits("1", 18))).revertedWith(
          "Insufficient balance",
        );
      });

      it("should be able to withdraw permit tokens", async () => {
        await expect(donationManager.withdraw(0, await mockUSDC.getAddress(), ethers.parseUnits("10", 6))).emit(
          donationManager,
          "WithdrawSuccess",
        );
      });

      it("should not be able to withdraw permit tokens more than you own", async () => {
        await expect(
          donationManager.withdraw(0, await mockUSDC.getAddress(), ethers.parseUnits("100000", 6)),
        ).revertedWith("Insufficient balance");
      });
    });
  });
  describe("SubscriptionManager", () => {
    it("should be able to create subscription", async () => {
      const duration = BigInt(7);
      const totalValue = ethers.parseUnits("10", 6) * duration;
      const { v, r, s, deadline } = await generatePermitSignature(
        await ethers.getSigner(deployer),
        await donationManager.getAddress(),
        mockUSDC,
        totalValue,
        BigInt(Date.now() + 1000 * 60 * 60 * 24 * 7),
      );
      const amount = totalValue / duration;
      await expect(
        subscriptionManager.subscribe(
          deployer,
          BigInt(0),
          await mockUSDC.getAddress(),
          amount,
          deadline / duration,
          duration,
          deadline,
          v,
          r,
          s,
        ),
      ).emit(subscriptionManager, "SubscriptionCreated");
    });
    it("should be able to unsubscribe from a pool", async () => {
      await expect(subscriptionManager.unsubscribe(0)).emit(subscriptionManager, "Unsubscribed");
    });
    it("should be able to list subscriptions", async () => {
      await expect(subscriptionManager.getSubscriptions()).not.revertedWithoutReason();
    });
    it("should be able to get a subscription", async () => {
      const sub = await subscriptionManager.getSubscription(0);
      expect(sub.poolId).to.equal(0);
      expect(sub.active).to.equal(false);
    });

    it("should be able to update subscription", async () => {
      const hexAmount = "0x" + ethers.parseUnits("1", 18).toString(16);
      await network.provider.send("hardhat_setBalance", [await automationUpKeep.getAddress(), hexAmount]);
      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [await automationUpKeep.getAddress()],
      });
      const remainingDuration = BigInt(6);
      const nextPaymentTime = BigInt(Math.floor(Date.now() / 1000) * 60 * 60 * 24);
      await expect(
        subscriptionManager
          .connect(await ethers.getSigner(await automationUpKeep.getAddress()))
          .updateSubscription(0, true, false, remainingDuration, nextPaymentTime),
      ).not.revertedWithoutReason();

      const sub = await subscriptionManager.getSubscription(0);

      expect(sub.active).to.equal(true);
      expect(sub.remainingDuration).to.equal(remainingDuration);
      expect(sub.nextPaymentTime).to.equal(nextPaymentTime);
    });
  });

  describe("AutomationsUpKeep", () => {
    it("should return a tuple of true and a list of subscriptions if any is due", async () => {
      await time.increase(Math.floor(Date.now() / 1000) * 60 * 60 * 24);
      const list = await subscriptionManager.getSubscriptions();
      expect(list.length).to.equal(1);
      const hexAmount = "0x" + ethers.parseUnits("1", 18).toString(16);
      await network.provider.send("hardhat_setBalance", [AUTOMATION_UP_KEEP_ADDRESS, hexAmount]);
      const sub = await subscriptionManager.getSubscription(0);
      expect(sub.active).to.equal(true);
      const [performNeeded, performArrayHash] = await automationUpKeep
        .connect(await ethers.getSigner(AUTOMATION_UP_KEEP_ADDRESS))
        .checkUpkeep(Buffer.from(""));
      expect(performNeeded).to.equal(true);
      expect(performArrayHash).not.to.equal(undefined);
    });
  });
});
