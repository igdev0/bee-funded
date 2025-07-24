import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

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

  await deploy("BeeFunded", {
    from: deployer,
    // Contract constructor arguments
    args: [],
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

  const contract = new hre.ethers.Contract(result.address, result.abi, await hre.ethers.getSigner(deployer));
  console.log(`Minting new tokens to ${process.env.MOCKED_TOKEN_MINT_TO}`);
  await contract.mint(process.env.MOCKED_TOKEN_MINT_TO, BigInt(1000000000000000000000n));
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["BeeFunded"];
