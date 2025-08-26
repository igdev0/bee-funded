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

  // Deploy the test permit token
  const mockERC20Result = await deploy("MockERC20", {
    from: deployer,
    args: ["MockToken", "MTK"],
    log: true,
    autoMine: true,
  });

  const mockERC20contract = new hre.ethers.Contract(
    mockERC20Result.address,
    mockERC20Result.abi,
    await hre.ethers.getSigner(deployer),
  );
  console.log(`Token MockToken (MTK) deployed to: ` + mockERC20Result.address);
  if (process.env.MOCKED_TOKEN_MINT_TO) {
    console.log(`Minting new tokens to ${process.env.MOCKED_TOKEN_MINT_TO}`);
    await mockERC20contract.mint(process.env.MOCKED_TOKEN_MINT_TO, BigInt(1000000000000000000000n));
  }

  const mockedUSDCResult = await deploy("MockUSDC", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log(`Token MockUSDC (USDC) deployed to: ` + mockedUSDCResult.address);

  const mockedERC721Result = await deploy("MockERC721", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const erc721Contract = new hre.ethers.Contract(
    mockedERC721Result.address,
    mockedERC721Result.abi,
    await hre.ethers.getSigner(deployer),
  );

  await erc721Contract.mint(deployer, "https://somewhere.io/path_to_json.json");
  console.log(`MockedERC721 deployed to: ${mockedERC721Result.address}`);

  const mockedERC1155Result = await deploy("MockERC1155", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log(`MockedERC1155 deployed to: ${mockedERC1155Result.address}`);
  const erc1155Contract = new hre.ethers.Contract(
    mockedERC1155Result.address,
    mockedERC1155Result.abi,
    await hre.ethers.getSigner(deployer),
  );
  await erc1155Contract.mint(deployer, BigInt(1), BigInt(1), Buffer.from(""));
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["BeeFunded"];
