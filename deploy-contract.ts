import circleDevWallet from "@circle-fin/developer-controlled-wallets";
import circleScp from "@circle-fin/smart-contract-platform";

const initiateDeveloperControlledWalletsClient =
  (circleDevWallet as any).initiateDeveloperControlledWalletsClient ||
  (circleDevWallet as any).default?.initiateDeveloperControlledWalletsClient ||
  (circleDevWallet as any).CircleDeveloperControlledWalletsClient;

const initiateSmartContractPlatformClient =
  (circleScp as any).initiateSmartContractPlatformClient ||
  (circleScp as any).default?.initiateSmartContractPlatformClient;

const apiKey = process.env.CIRCLE_API_KEY!;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET!;
const walletId = process.env.WALLET_ID!;
const walletAddress = process.env.WALLET_ADDRESS!;

if (!apiKey || !entitySecret || !walletId) {
  throw new Error("Missing required CIRCLE_API_KEY, CIRCLE_ENTITY_SECRET, or WALLET_ID in environment.");
}

const scpClient = initiateSmartContractPlatformClient({
  apiKey,
  entitySecret,
});

const dcwClient = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});

async function main() {
  console.log("🚀 Deploying Smart Contract via Circle Smart Contract Platform...");
  console.log(`💼 Using Circle Developer-Controlled Wallet ID: ${walletId}`);
  console.log(`🌐 Wallet Address: ${walletAddress}`);

  // Deploy ERC-20 Token Template on Arc Testnet via Circle SCP
  const response = await scpClient.deployContractTemplate({
    id: "a1b74add-23e0-4712-88d1-6b3009e85a86", // Circle ERC-20 template ID
    blockchain: "ARC-TESTNET",
    name: "CapSpendTreasury",
    walletId: walletId,
    templateParameters: {
      name: "CapSpend Corporate Treasury Token",
      symbol: "CSUSD",
      defaultAdmin: walletAddress,
      primarySaleRecipient: walletAddress,
    },
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
  });

  console.log("✅ Contract Deployment Initiated via Circle Developer-Controlled Wallet!");
  console.log("Response Data:", JSON.stringify(response.data, null, 2));

  const contractIds = response.data?.contractIds;
  const transactionId = response.data?.transactionId;

  if (transactionId) {
    console.log(`\n⏳ Checking transaction status for TX ID: ${transactionId}`);
    let txComplete = false;
    let attempts = 0;
    while (!txComplete && attempts < 20) {
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
      const txRes = await dcwClient.getTransaction({ id: transactionId });
      const state = txRes.data?.transaction?.state;
      console.log(`Attempt ${attempts}: Transaction State = ${state}`);

      if (state === "COMPLETE") {
        txComplete = true;
        const txHash = txRes.data?.transaction?.txHash;
        const contractAddress = txRes.data?.transaction?.contractAddress;
        console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
        console.log(`📜 Tx Hash: ${txHash}`);
        console.log(`📍 Contract Address: ${contractAddress}`);
        console.log(`🔍 ArcScan: https://testnet.arcscan.app/tx/${txHash}`);
        break;
      } else if (state === "FAILED") {
        console.error("❌ Transaction Failed:", txRes.data);
        break;
      }
    }
  }

  if (contractIds && contractIds.length > 0) {
    console.log(`\n📌 Circle Contract ID: ${contractIds[0]}`);
    try {
      const contractRes = await scpClient.getContract({ id: contractIds[0] });
      console.log("Contract Details:", JSON.stringify(contractRes.data, null, 2));
    } catch (e) {
      console.log("Note: Contract details will populate once on-chain indexing completes.");
    }
  }
}

main().catch((err) => {
  console.error("Error deploying contract with Circle SDK:", err);
  process.exit(1);
});
