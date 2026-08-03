import circleDevWallet from "@circle-fin/developer-controlled-wallets";

const initiateDeveloperControlledWalletsClient =
  (circleDevWallet as any).initiateDeveloperControlledWalletsClient ||
  (circleDevWallet as any).default?.initiateDeveloperControlledWalletsClient ||
  (circleDevWallet as any).CircleDeveloperControlledWalletsClient;

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

async function main() {
  console.log("Sending real 1.00 USDC transaction on Arc Testnet via Circle SDK...");
  const res = await client.createTransaction({
    walletId: process.env.WALLET_ID!,
    blockchain: "ARC-TESTNET",
    destinationAddress: process.env.WALLET_ADDRESS!, // self transfer for test
    amounts: ["1.00"],
    tokenId: "15dc2b5d-0994-58b0-bf8c-3a0501148ee8", // Real native USDC token ID on Arc
    fee: {
      type: "level",
      config: {
        feeLevel: "MEDIUM",
      },
    },
  });

  console.log("Real Transaction Response:", JSON.stringify(res.data, null, 2));

  const txId = res.data?.id;
  if (txId) {
    console.log(`\nPolling transaction ${txId} for on-chain txHash...`);
    let complete = false;
    let attempts = 0;
    while (!complete && attempts < 15) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
      const tx = await client.getTransaction({ id: txId });
      const state = tx.data?.transaction?.state;
      const txHash = tx.data?.transaction?.txHash;
      console.log(`Attempt ${attempts}: state = ${state}, txHash = ${txHash}`);
      if (state === "COMPLETE") {
        complete = true;
        console.log("\n🎉 REAL ON-CHAIN TRANSACTION CONFIRMED ON ARC TESTNET!");
        console.log(`📜 Tx Hash: ${txHash}`);
        console.log(`🔍 ArcScan Explorer Link: https://testnet.arcscan.app/tx/${txHash}`);
      }
    }
  }
}

main().catch(console.error);
