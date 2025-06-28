import { ethers } from "hardhat";
import { expect } from "chai";
import { BeeFunded, MockERC20 } from "../typechain-types"; // Ensure MockERC20 supports Permit!

// Define constants for clarity
const ONE_WEEK = 60 * 60 * 24 * 7;
const ONE_DAY = 60 * 60 * 24; // For testing rejection

describe("BeeFunded", function () {
  let beeFunded: BeeFunded;
  let mockToken: MockERC20; // This MockERC20 MUST implement ERC20Permit
  let owner: any, addr1: any, addr2: any;
  const metadataURL = "https://example.com/meta/...";

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

  // --- End of Helper Function ---

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const MockTokenFactory = await ethers.getContractFactory("MockERC20");
    // Ensure MockERC20 is deployed with Permit capabilities for testing
    mockToken = await MockTokenFactory.deploy("MockToken", "MTK");
    await mockToken.waitForDeployment();

    const BeeFundedFactory = await ethers.getContractFactory("BeeFunded");
    beeFunded = await BeeFundedFactory.deploy();
    await beeFunded.waitForDeployment();
  });

  describe("Pool Management", () => {
    it("creates a pool", async () => {
      const tx = await beeFunded.connect(owner).createPool(1000, metadataURL);
      await tx.wait();

      const poolId = await beeFunded.poolID();
      const pool = await beeFunded.pools(poolId);
      expect(pool.owner).to.equal(await owner.getAddress());
    });
  });

  describe("Donations", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(500, metadataURL);
      poolId = Number(await beeFunded.poolID());

      // Mint tokens to addr1 for direct donations and permit donations
      await mockToken.mint(await addr1.getAddress(), ethers.parseUnits("10000", 18));
    });

    it("accepts ERC20 donations using direct approve/transferFrom flow", async () => {
      // First, addr1 approves the BeeFunded contract
      await mockToken.connect(addr1).approve(await beeFunded.getAddress(), ethers.parseUnits("100", 18));

      // Then addr1 calls donate, which uses transferFrom
      await expect(
        beeFunded.connect(addr1).donate(poolId, await mockToken.getAddress(), ethers.parseUnits("100", 18), "For bees"),
      ).to.emit(beeFunded, "NewDonation");
    });

    it("accepts ERC20 donations using permit flow", async () => {
      const donorAmount = ethers.parseUnits("200", 18);
      // Deadline for the permit signature (e.g., a few minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000)) + BigInt(60 * 5); // 5 minutes

      const { v, r, s } = await generatePermitSignature(
        addr1,
        await beeFunded.getAddress(), // BeeFunded contract is the spender
        mockToken, // The token contract
        donorAmount, // The amount to permit
        deadline,
      );

      // Call donateWithPermit, which uses the permit signature
      await expect(
        beeFunded.connect(addr1).donateWithPermit(
          // addr1 is msg.sender here, but _donor can be different
          await addr1.getAddress(), // _donor argument in donateWithPermit
          poolId,
          await mockToken.getAddress(),
          donorAmount,
          "For bees with permit",
          deadline,
          v,
          r,
          s,
        ),
      ).to.emit(beeFunded, "NewDonation");

      // Verify the allowance was consumed (or partially consumed if amount < permitted)
      const allowanceAfter = await mockToken.allowance(await addr1.getAddress(), await beeFunded.getAddress());
      expect(allowanceAfter).to.equal(0n); // Expect allowance to be fully used
    });

    it("accepts native token (ETH) donations", async () => {
      await expect(
        beeFunded.connect(addr1).donate(poolId, ethers.ZeroAddress, ethers.parseEther("0.02"), "With ETH", {
          value: ethers.parseEther("0.02"),
        }),
      ).to.emit(beeFunded, "NewDonation");
    });

    it("rejects invalid pool", async () => {
      await expect(
        beeFunded.connect(addr1).donate(99, await mockToken.getAddress(), ethers.parseUnits("100", 18), "Oops"),
      ).to.be.revertedWith("Pool does not exist");
    });
  });

  describe("Subscriptions", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(1000, metadataURL);
      poolId = Number(await beeFunded.poolID());

      // Mint tokens to addr2 for subscriptions (subscriber)
      await mockToken.mint(await addr2.getAddress(), ethers.parseUnits("100000", 18));
      // No need for approve here, as subscribe uses permit
    });

    it("creates a valid subscription using permit", async () => {
      const amount = ethers.parseUnits("100", 18); // Amount per interval
      const interval = ONE_WEEK; // 7 days in seconds
      const duration = 10; // 10 intervals (total payments including first)

      const totalSubscriptionValue = amount * BigInt(duration); // Calculate total amount
      const blockTimestamp = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
      // Add a buffer to the deadline, e.g., 1 week beyond the last payment due date
      const deadline = blockTimestamp + BigInt(interval * duration) + BigInt(ONE_WEEK);

      const { v, r, s } = await generatePermitSignature(
        addr2,
        await beeFunded.getAddress(), // BeeFunded contract is the spender
        mockToken, // The token contract
        totalSubscriptionValue, // The amount to permit
        deadline,
      );
      // Call donateWithPermit, which uses the permit signature
      await expect(
        await beeFunded.connect(addr1).subscribe(
          // addr1 is msg.sender here, but _donor can be different
          await addr2.address, // _donor argument in donateWithPermit
          poolId,
          await mockToken.getAddress(),
          amount,
          interval,
          duration,
          deadline,
          v,
          r,
          s,
        ),
      ).to.emit(beeFunded, "NewDonation");
      const sub = await beeFunded.subscriptions(0);
      expect(sub.subscriber).to.equal(await addr2.getAddress());
      expect(sub.amount).to.equal(amount);
      expect(sub.interval).to.equal(interval);
      expect(sub.remainingDuration).to.equal(duration - 1); // 1 payment made immediately
      expect(sub.active).to.equal(true);

      const poolBalance = await beeFunded.balanceOf(poolId, await mockToken.getAddress());
      expect(poolBalance).to.equal(amount);

      const remainingAllowance = await mockToken.allowance(await addr2.getAddress(), await beeFunded.getAddress());
      expect(remainingAllowance).to.equal(totalSubscriptionValue - amount);
    });

    it("rejects interval < 1 week", async () => {
      const amount = ethers.parseUnits("100", 18);
      const interval = ONE_DAY; // This is less than 1 week
      const duration = 10;
      const totalSubscriptionValue = amount * BigInt(duration);
      const blockTimestamp = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
      const deadline = blockTimestamp + BigInt(interval * duration) + BigInt(ONE_WEEK);

      const { v, r, s } = await generatePermitSignature(
        addr2,
        await beeFunded.getAddress(),
        mockToken,
        totalSubscriptionValue,
        deadline,
      );

      await expect(
        beeFunded
          .connect(addr1)
          .subscribe(
            await addr2.getAddress(),
            poolId,
            await mockToken.getAddress(),
            amount,
            interval,
            duration,
            deadline,
            v,
            r,
            s,
          ),
      ).to.be.revertedWith("Min interval is 1 week");
    });

    it("Checks if user is subscribed", async () => {
      const amount = ethers.parseUnits("100", 18);
      const interval = ONE_WEEK;
      const duration = 10;
      const totalSubscriptionValue = amount * BigInt(duration);
      const blockTimestamp = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
      const deadline = blockTimestamp + BigInt(interval * duration) + BigInt(ONE_WEEK);

      const { v, r, s } = await generatePermitSignature(
        addr2,
        await beeFunded.getAddress(),
        mockToken,
        totalSubscriptionValue,
        deadline,
      );

      await beeFunded
        .connect(addr1)
        .subscribe(
          await addr2.getAddress(),
          poolId,
          await mockToken.getAddress(),
          amount,
          interval,
          duration,
          deadline,
          v,
          r,
          s,
        );

      const is = await beeFunded.isSubscribed(await addr2.getAddress(), await owner.getAddress());
      expect(is).to.equal(true);
    });

    it("List subscriptions for pools", async () => {
      const amount = ethers.parseUnits("100", 18);
      const interval = ONE_WEEK;
      const duration = 10;
      const totalSubscriptionValue = amount * BigInt(duration);
      const blockTimestamp = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
      const deadline = blockTimestamp + BigInt(interval * duration) + BigInt(ONE_WEEK);

      // Subscription 1
      const { v, r, s } = await generatePermitSignature(
        addr2,
        await beeFunded.getAddress(),
        mockToken,
        totalSubscriptionValue,
        deadline,
      );
      await beeFunded
        .connect(addr1)
        .subscribe(
          await addr2.getAddress(),
          poolId,
          await mockToken.getAddress(),
          amount,
          interval,
          duration,
          deadline,
          v,
          r,
          s,
        );

      // Create another pool and a second subscription for testing filtering
      await beeFunded.connect(owner).createPool(500, metadataURL);
      const poolId2 = Number(await beeFunded.poolID());

      // Subscription 2 (for poolId2)
      // Note: The second permit would use the next nonce for addr2
      const {
        v: v2,
        r: r2,
        s: s2,
      } = await generatePermitSignature(
        addr2,
        await beeFunded.getAddress(),
        mockToken,
        totalSubscriptionValue,
        deadline,
      );
      await beeFunded
        .connect(addr1)
        .subscribe(
          await addr2.getAddress(),
          poolId2,
          await mockToken.getAddress(),
          amount,
          interval,
          duration,
          deadline,
          v2,
          r2,
          s2,
        );

      // Test filtering for poolId
      const subs = await beeFunded.connect(addr2).getSubsByPoolIds([poolId]);
      expect(subs.length).to.equal(1);
      expect(subs[0].poolId).to.equal(BigInt(poolId)); // Access BigInt from struct
    });
  });

  describe("Chainlink Upkeep", () => {
    let poolId: number;
    beforeEach(async () => {
      // let initialPoolBalance: bigint;
      await beeFunded.connect(owner).createPool(1000, metadataURL);
      poolId = Number(await beeFunded.poolID());

      await mockToken.mint(await addr2.getAddress(), ethers.parseUnits("100000", 18)); // Ensure sufficient tokens

      const amount = ethers.parseUnits("50", 18); // Amount per interval
      const interval = ONE_WEEK; // 1 week in seconds
      const duration = 10; // 10 intervals
      const totalSubscriptionValue = amount * BigInt(duration);
      const blockTimestamp = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
      const deadline = blockTimestamp + BigInt(interval * duration) + BigInt(ONE_WEEK);

      // Generate permit for the setup subscription
      const { v, r, s } = await generatePermitSignature(
        addr2,
        await beeFunded.getAddress(),
        mockToken,
        totalSubscriptionValue,
        deadline,
      );

      // Create the subscription using the permit
      await beeFunded
        .connect(addr1)
        .subscribe(
          await addr2.getAddress(),
          poolId,
          await mockToken.getAddress(),
          amount,
          interval,
          duration,
          deadline,
          v,
          r,
          s,
        );
      // initialPoolBalance = await beeFunded.balanceOf(poolId, await mockToken.getAddress()); // Should be 'amount' after initial subscribe

      // Fast-forward time for upkeep to be due
      await ethers.provider.send("evm_increaseTime", [ONE_WEEK]);
      await ethers.provider.send("evm_mine", []);
    });

    it("checkUpKeep returns true if due", async () => {
      const [needed] = await beeFunded.checkUpkeep("0x");
      expect(needed).to.equal(true);
    });

    it("performUpkeep executes and updates nextPaymentTime", async () => {
      const [, data] = await beeFunded.checkUpkeep("0x");
      const subBefore = await beeFunded.subscriptions(0);
      const expectedNextPaymentTime = subBefore.nextPaymentTime + BigInt(subBefore.interval);
      const expectedRemainingDuration = Number(subBefore.remainingDuration) - 1;

      // Expect a NewDonation event from the upkeep
      await beeFunded.performUpkeep(data);

      const subAfter = await beeFunded.subscriptions(0);
      expect(subAfter.nextPaymentTime).to.equal(expectedNextPaymentTime);
      expect(subAfter.remainingDuration).to.equal(expectedRemainingDuration);
      //
      // // Verify pool balance increased by 'amount'
      // const poolBalanceAfterUpkeep = await beeFunded.balanceOf(poolId, await mockToken.getAddress());
      // expect(poolBalanceAfterUpkeep).to.equal(initialPoolBalance + subBefore.amount);

      // Verify subscriber's allowance decreased
      // const totalSubscriptionValue = subBefore.amount * (BigInt(subBefore.remainingDuration) + 1n); // Re-calculate total from remaining before upkeep
      // const allowanceAfterUpkeep = await mockToken.allowance(await addr2.getAddress(), await beeFunded.getAddress());
      // expect(allowanceAfterUpkeep).to.equal(totalSubscriptionValue - subBefore.amount);
    });

    // it("marks subscription inactive and emits SubscriptionExpired after last payment", async () => {
    //   // Create a specific subscription for this test with duration 2
    //   // (1 initial payment + 1 recurring payment via upkeep = 2 total payments)
    //   const amount = ethers.parseUnits("50", 18);
    //   const interval = ONE_WEEK;
    //   const duration = 2;
    //   const totalSubscriptionValue = amount * BigInt(duration);
    //   const blockTimestamp = BigInt((await ethers.provider.getBlock("latest"))!.timestamp);
    //   const deadline = blockTimestamp + BigInt(interval * duration) + BigInt(ONE_WEEK);
    //
    //   // Generate permit for this specific short-lived subscription
    //   const { v, r, s } = await generatePermitSignature(
    //     addr2,
    //     await beeFunded.getAddress(),
    //     mockToken,
    //     totalSubscriptionValue,
    //     deadline,
    //   );
    //
    //   // Subscribe to create a new entry for this test
    //   await beeFunded.connect(addr1).subscribe(
    //     await addr2.getAddress(),
    //     poolId, // Using the existing poolId
    //     await mockToken.getAddress(),
    //     amount,
    //     interval,
    //     duration,
    //     v,
    //     r,
    //     s,
    //   );
    //
    //   // Find the index of this newly created subscription
    //   // (Assuming it's the latest one, or iterate subscriptions to find it)
    //   const subscriptionCount = beeFunded.subscriptions.length; // Hardhat doesn't expose .length() directly, need to track or loop.
    //   // For simplicity in test, assume it's the 2nd (index 1) if a previous beforeEach created one,
    //   // or the first (index 0) if it's the only one by clearing subscriptions array.
    //   // For now, let's assume it's at index 0 for this isolated test within the block.
    //   // If `subscriptions` array can grow, consider more robust index finding or resetting state.
    //   const initialSubscriptionIndex = beeFunded.subscriptions.length - 1; // Last added subscription
    //
    //   // Fast-forward time for the single recurring payment
    //   await ethers.provider.send("evm_increaseTime", [ONE_WEEK]);
    //   await ethers.provider.send("evm_mine", []);
    //
    //   // Check upkeep will find this subscription
    //   const [, data] = await beeFunded.checkUpkeep("0x");
    //   const upkeepIndex = ethers.decodeBytes32String(["uint256"], data)[0];
    //
    //   // Ensure it's the subscription we just created for this test
    //   expect(upkeepIndex).to.equal(initialSubscriptionIndex);
    //
    //   await expect(beeFunded.performUpkeep(data))
    //     .to.emit(beeFunded, "SubscriptionExpired")
    //     .withArgs(poolId, await addr2.getAddress(), await owner.getAddress());
    //
    //   const subAfter = await beeFunded.subscriptions(upkeepIndex);
    //   expect(subAfter.active).to.be.false;
    //   expect(subAfter.remainingDuration).to.equal(0); // All payments made
    // });
  });

  describe("Withdrawals", () => {
    let poolId: number;

    beforeEach(async () => {
      await beeFunded.connect(owner).createPool(1000, metadataURL);
      poolId = Number(await beeFunded.poolID());

      await mockToken.mint(await addr1.getAddress(), ethers.parseUnits("10000", 18));
      await mockToken.connect(addr1).approve(await beeFunded.getAddress(), ethers.parseUnits("10000", 18)); // For direct donate
      await beeFunded
        .connect(addr1)
        .donate(poolId, await mockToken.getAddress(), ethers.parseUnits("100", 18), "Funding");
    });

    it("allows pool owner to withdraw tokens", async () => {
      const initialOwnerBalance = await mockToken.balanceOf(await owner.getAddress());
      const amount = await beeFunded.balanceOf(poolId, await mockToken.getAddress());

      await expect(beeFunded.connect(owner).withdraw(poolId, await mockToken.getAddress(), amount)).to.not.be.reverted;

      const finalOwnerBalance = await mockToken.balanceOf(await owner.getAddress());
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + amount);
      expect(await beeFunded.balanceOf(poolId, await mockToken.getAddress())).to.equal(0n); // Use 0n for BigInt comparison
    });

    it("allows pool owner to withdraw ETH", async () => {
      // Add ETH to the pool first
      const ethDonationAmount = ethers.parseEther("1");
      await beeFunded.connect(addr1).donate(poolId, ethers.ZeroAddress, ethDonationAmount, "ETH Donation", {
        value: ethDonationAmount,
      });

      const initialOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());
      const initialPoolEthBalance = await beeFunded.balanceOf(poolId, ethers.ZeroAddress);

      const tx = await beeFunded.connect(owner).withdraw(poolId, ethers.ZeroAddress, initialPoolEthBalance);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.cumulativeGasUsed;

      const finalOwnerBalance = await ethers.provider.getBalance(await owner.getAddress());
      expect(finalOwnerBalance).to.approximately(
        initialOwnerBalance + initialPoolEthBalance - gasUsed,
        ethers.parseUnits("0.0001"),
      );
      expect(await beeFunded.balanceOf(poolId, ethers.ZeroAddress)).to.equal(0n); // Use 0n for BigInt comparison
    });

    it("prevents non-owner from withdrawing", async () => {
      await expect(
        beeFunded.connect(addr1).withdraw(poolId, await mockToken.getAddress(), ethers.parseUnits("100", 18)),
      ).to.be.revertedWith("Not pool owner");
    });

    it("prevents withdrawing more than available balance", async () => {
      const currentBalance = await beeFunded.balanceOf(poolId, await mockToken.getAddress());
      await expect(
        beeFunded.connect(owner).withdraw(poolId, await mockToken.getAddress(), currentBalance + 1n), // Use 1n for BigInt comparison
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});
