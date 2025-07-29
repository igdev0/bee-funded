import { deployments, ethers, getNamedAccounts, getUnnamedAccounts } from "hardhat";
import {
  AutomationUpkeep,
  BeeFundedCore,
  DonationManager,
  MockERC20,
  MockUSDC,
  SubscriptionManager,
} from "../typechain-types";
import { expect } from "chai";

// Define constants for clarity
const ONE_WEEK = 60 * 60 * 24 * 7;
const ONE_DAY = 60 * 60 * 24; // For testing rejection

// --- Helper function for generating Permit signature ---
async function generatePermitSignature(
  ownerSigner: any, // The ethers.Signer of the token owner
  spenderAddress: string, // The address of your BeeFunded contract
  tokenContract: MockERC20, // The MockERC20 contract instance
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
    v: sig.v,
    r: sig.r,
    s: sig.s,
  };
}

describe("BeeFunded", function () {
  let beeFundedCore: BeeFundedCore;
  let subscriptionManager: SubscriptionManager;
  let donationManager: DonationManager;
  let automationUpKeep: AutomationUpkeep;
  let mockToken: MockERC20;
  let mockUSDC: MockUSDC;
  let deployer: any, addr1: any, addr2: any;

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
  });
});
