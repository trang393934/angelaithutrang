const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║            FUN Money Token Deployment                         ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
  console.log("");

  // Configuration
  const config = {
    name: "FUN Money",
    symbol: "FUN",
    // 10 million tokens per epoch (daily cap)
    epochMintCap: hre.ethers.parseEther("10000000"),
    // 100k tokens per user per epoch
    userEpochCap: hre.ethers.parseEther("100000"),
    admin: deployer.address,
  };

  console.log("Configuration:");
  console.log("  Name:", config.name);
  console.log("  Symbol:", config.symbol);
  console.log("  Epoch Mint Cap:", hre.ethers.formatEther(config.epochMintCap), "FUN");
  console.log("  User Epoch Cap:", hre.ethers.formatEther(config.userEpochCap), "FUN");
  console.log("  Admin:", config.admin);
  console.log("");

  // Deploy
  console.log("Deploying FUNMoney contract...");
  const FUNMoney = await hre.ethers.getContractFactory("FUNMoney");
  const funMoney = await FUNMoney.deploy(
    config.name,
    config.symbol,
    config.epochMintCap,
    config.userEpochCap,
    config.admin
  );

  await funMoney.waitForDeployment();
  const contractAddress = await funMoney.getAddress();

  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║                    Deployment Complete!                       ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("  Contract Address:", contractAddress);
  console.log("");

  // Setup initial signer (Treasury wallet)
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (treasuryAddress) {
    console.log("Setting up Treasury as PPLP Signer...");
    const tx = await funMoney.grantSigner(treasuryAddress);
    await tx.wait();
    console.log("  ✓ Treasury added as signer:", treasuryAddress);
  } else {
    console.log("  ⚠ TREASURY_ADDRESS not set, skipping signer setup");
  }

  console.log("");
  console.log("Next Steps:");
  console.log("  1. Verify contract on BscScan:");
  console.log(`     npx hardhat verify --network ${hre.network.name} ${contractAddress} "${config.name}" "${config.symbol}" "${config.epochMintCap}" "${config.userEpochCap}" "${config.admin}"`);
  console.log("");
  console.log("  2. Add PPLP Signers:");
  console.log("     funMoney.grantSigner(<signer_address>)");
  console.log("");
  console.log("  3. Update pplp-eip712.ts with contract address:");
  console.log(`     verifyingContract: "${contractAddress}"`);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress,
    deployer: deployer.address,
    config,
    timestamp: new Date().toISOString(),
  };

  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`Deployment info saved to: deployments/${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
