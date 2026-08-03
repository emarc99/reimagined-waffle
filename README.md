<div align="center">
  <h1>🛡️ CapSpend Arc</h1>
  <h3><b>Agentic Corporate Spending on Arc — USDC Settlement via Circle Developer-Controlled Wallets</b></h3>
  <p>
    <a href="https://encodeclub.com/programmes/arc-hackathon"><img src="https://img.shields.io/badge/Encode%20Club-Arc%20Hackathon-6366f1?style=flat-square" alt="Encode Club Arc Hackathon" /></a>
    <a href="https://testnet.arcscan.app"><img src="https://img.shields.io/badge/Arc%20Testnet-Chain%205042002-8b5cf6?style=flat-square" alt="Arc Testnet" /></a>
    <a href="https://developers.circle.com"><img src="https://img.shields.io/badge/Circle-Developer%20Controlled%20Wallets-2775ca?style=flat-square" alt="Circle" /></a>
  </p>
</div>

---

## 🎯 Overview

CapSpend Arc is an autonomous corporate spending assistant purpose-built for the **Arc Hackathon (Agentic Economy Track)**:

1. **Accepts** natural language spend requests via a dark-themed React dashboard
2. **Evaluates** each request against corporate spending limits using an OpenAI policy engine (`gpt-4o-mini`)
3. **Executes** on-chain USDC settlement on Arc Testnet natively using **Circle Developer-Controlled Wallets SDK** (`@circle-fin/developer-controlled-wallets`)
4. **Deploys** smart contracts using **Circle Smart Contract Platform SDK** (`@circle-fin/smart-contract-platform`)

---

## 🏗️ Architecture

```
[ React Dashboard (Vite) ]
        │
        ▼
[ Express Backend: OpenAI Policy Agent ]
        │
        ▼
[ Circle Developer-Controlled Wallets SDK ]
   - initiateDeveloperControlledWalletsClient ({ apiKey, entitySecret })
   - createTransaction / createContractExecutionTransaction
        │
        ▼
[ Arc Testnet (Chain ID 5042002) ]
   Wallet ID: db28a671-1586-515e-9d5b-6a2712ce9667
   Address: 0xfd701ef535647a4d502baf960a971c7dfb698176
   Gas Token: USDC
```

---

## 🚀 Quickstart

### 1. Configure Environment (`.env`)

```ini
CIRCLE_API_KEY=YOUR_CIRCLE_API_KEY
CIRCLE_ENTITY_SECRET=YOUR_REGISTERED_ENTITY_SECRET
WALLET_ID=db28a671-1586-515e-9d5b-6a2712ce9667
WALLET_ADDRESS=0xfd701ef535647a4d502baf960a971c7dfb698176
OPENAI_API_KEY=sk-proj-...
```

### 2. Deploy Contract via Circle SDK

```bash
# Deploys contract template on Arc Testnet using Circle Developer-Controlled Wallet & SCP SDK
npm run deploy-contract
```

### 3. Run Agentic Backend

```bash
cd backend
npm run dev
# Starts server on http://localhost:3001
```

### 4. Run React Dashboard

```bash
cd frontend
npm run dev
# Opens dashboard at http://localhost:5173
```

---

## 🏆 Hackathon Track Alignment: Agentic Economy

- ✅ **Circle Developer-Controlled Wallets**: Managed programmatically via entity secret ciphertext without raw private key exposure.
- ✅ **Autonomous USDC Settlement**: Agent evaluates spending prompt and directly dispatches USDC transfers on Arc Testnet.
- ✅ **Sub-Second Finality**: Leverages Arc's sub-second EVM execution engine and USDC native gas token model.

---

## 📜 License
ISC License
