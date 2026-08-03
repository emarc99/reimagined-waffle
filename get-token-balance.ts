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
  const res = await client.getWalletTokenBalance({
    id: process.env.WALLET_ID!,
  });

  console.log("Wallet Token Balance Response:", JSON.stringify(res.data, null, 2));
}

main().catch(console.error);
