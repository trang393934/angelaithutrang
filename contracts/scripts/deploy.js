const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║        FUN Money v1.2.1 FINAL — Deployment                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
  console.log("");

  // Configuration — v1.2.1 constructor: (gov, community, attesters[], threshold)
  const config = {
    guardianGov: deployer.address, // Guardian Governance address
    communityPool: process.env.COMMUNITY_POOL || deployer.address,
    attesters: [],
    attesterThreshold: 1,
  };

  // Add Treasury as attester if configured
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  if (treasuryAddress) {
    config.attesters.push(treasuryAddress);
  }

  console.log("Configuration:");
  console.log("  Contract: FUNMoneyProductionV1_2_1");
  console.log("  EIP-712 Domain: FUN Money v1.2.1");
  console.log("  Guardian Gov:", config.guardianGov);
  console.log("  Community Pool:", config.communityPool);
  console.log("  Attesters:", config.attesters.length > 0 ? config.attesters.join(", ") : "(none - add via govSetAttester)");
  console.log("  Attester Threshold:", config.attesterThreshold);
  console.log("");

  // Deploy
  console.log("Deploying FUNMoneyProductionV1_2_1...");
  const FUNMoney = await hre.ethers.getContractFactory("FUNMoneyProductionV1_2_1");
  const funMoney = await FUNMoney.deploy(
    config.guardianGov,
    config.communityPool,
    config.attesters,
    config.attesterThreshold
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

  // Register initial action types (Master Charter 5D)
  const initialActions = [
    "QUESTION_ASK",
    "LEARN_COMPLETE",
    "CONTENT_CREATE",
    "DONATE",
    "VOLUNTEER",
    "TREE_PLANT",
    "DAILY_RITUAL",
    "COMMUNITY_POST",
    "COMMUNITY_COMMENT",
    "COMMUNITY_ENGAGEMENT",
    "JOURNAL_SUBMIT",
    "SHARE_CONTENT",
    "MENTOR_HELP",
    "IDEA_SUBMIT",
    "DAILY_LOGIN",
    "VISION_CREATE",
  ];

  console.log("Registering action types (Master Charter 5D)...");
  for (const actionName of initialActions) {
    try {
      const tx = await funMoney.govRegisterAction(actionName, 1);
      await tx.wait();
      console.log(`  ✓ Registered: ${actionName}`);
    } catch (err) {
      console.log(`  ⚠ Failed to register ${actionName}:`, err.message);
    }
  }

  console.log("");
  console.log("Next Steps:");
  console.log("  1. Verify contract on BscScan:");
  console.log(`     npx hardhat verify --network ${hre.network.name} ${contractAddress} "${config.guardianGov}" "${config.communityPool}" "[${config.attesters.map(a => `\\"${a}\\"`).join(',')}]" "${config.attesterThreshold}"`);
  console.log("");
  console.log("  2. Add Attesters (if not done via constructor):");
  console.log("     funMoney.govSetAttester(<attester_address>, true)");
  console.log("");
  console.log("  3. Update pplp-eip712.ts and funMoneyABI.ts with contract address:");
  console.log(`     verifyingContract: "${contractAddress}"`);
  console.log("");
  console.log("  4. Vesting Flow: lockWithPPLP() → activate() → claim()");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress,
    contractName: "FUNMoneyProductionV1_2_1",
    version: "1.2.1",
    tag: "FUN-MONEY-v1.2.1-final",
    eip712Domain: {
      name: "FUN Money",
      version: "1.2.1",
    },
    deployer: deployer.address,
    config,
    registeredActions: initialActions,
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
