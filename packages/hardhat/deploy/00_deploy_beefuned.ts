import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "ethers";

/**
 * Deploys a hardhat named "BeeFunded" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for hardhat creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  const nonce = await hre.ethers.provider.getTransactionCount(deployer);
  // 1st Deploy BeeFundedCore contract
  const { address: beeFundedCoreAddress } = await deploy("BeeFundedCore", {
    from: deployer,
    // Compute the address of the donationManager
    args: [ethers.getCreateAddress({ from: deployer, nonce: nonce + 1 })],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the hardhat deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // 2nd Deploy DonationManager contract
  const { address: donationManagerAddress } = await deploy("DonationManager", {
    from: deployer,
    args: [
      beeFundedCoreAddress, // BeeFundedCore address
      ethers.getCreateAddress({
        from: deployer,
        nonce: nonce + 2,
      }), // AutomationUpKeeper address
      ethers.getCreateAddress({ from: deployer, nonce: nonce + 3 }), // SubscriptionManager address
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the hardhat deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
  const AUTOMATION_UP_KEEP_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
  // 2nd Deploy AutomationUpKeep contract
  const { address: automationUpKeepAddress } = await deploy("AutomationUpkeep", {
    from: deployer,
    args: [
      ethers.getCreateAddress({
        from: deployer,
        nonce: nonce + 3,
      }), // SubscriptionManager address
      beeFundedCoreAddress, // BeeFundedCore address
      donationManagerAddress,
      AUTOMATION_UP_KEEP_ADDRESS,
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the hardhat deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // 3rd SubscriptionManager address
  const { address: subscriptionManagerAddress } = await deploy("SubscriptionManager", {
    from: deployer,
    args: [
      beeFundedCoreAddress, // BeeFundedCore address
      donationManagerAddress,
      automationUpKeepAddress,
    ],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the hardhat deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Deploy the test permit token
  const result = await deploy("MockERC20", {
    from: deployer,
    args: ["MockToken", "MTK"],
    log: true,
    autoMine: true,
  });

  console.log(`BeeFundedCore address: ${beeFundedCoreAddress}} 📑`);
  console.log(`DonationManager address: ${donationManagerAddress}} 📑`);
  console.log(`SubscriptionManager address: ${subscriptionManagerAddress}} 📑`);
  console.log(`AutomationUpKeep address: ${automationUpKeepAddress}} 📑`);

  const contract = new hre.ethers.Contract(result.address, result.abi, await hre.ethers.getSigner(deployer));
  console.log(`Minting new tokens to ${process.env.MOCKED_TOKEN_MINT_TO}`);
  await contract.mint(process.env.MOCKED_TOKEN_MINT_TO, BigInt(1000000000000000000000n));
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["BeeFunded"];
