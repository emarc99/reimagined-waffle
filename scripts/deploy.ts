import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying SpendingPolicy to Arc Testnet...");
  console.log("Deployer address:", deployer.address);

  // The AI agent address that can approve/reject spend requests
  // Using the funded Circle wallet as the agent
  const agentAddress = process.env.WALLET_ADDRESS || deployer.address;

  const SpendingPolicy = await ethers.getContractFactory("SpendingPolicy");
  const contract = await SpendingPolicy.deploy(agentAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ SpendingPolicy deployed at:", address);
  console.log("🤖 Agent address:", agentAddress);
  console.log("🔍 View on ArcScan:", `https://testnet.arcscan.app/address/${address}`);
  console.log("\nAdd to .env:");
  console.log(`SPENDING_POLICY_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
