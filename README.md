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

## 📊 Written Summary of Progress

### 🚀 What’s Working Today:
- **Circle Developer-Controlled Wallet Integration**: Generated and registered Circle entity secret ciphertext & initialized a Developer-Controlled Wallet on Arc Testnet ([`0xfd701ef535647a4d502baf960a971c7dfb698176`](https://testnet.arcscan.app/address/0xfd701ef535647a4d502baf960a971c7dfb698176)).
- **On-Chain Smart Contract Deployment**: Deployed contract templates natively on Arc Testnet via **Circle Smart Contract Platform SDK** (`@circle-fin/smart-contract-platform`), verified on ArcScan ([`0x040456b7c43090c5ea912826f04deb5575438b0a`](https://testnet.arcscan.app/address/0x040456b7c43090c5ea912826f04deb5575438b0a)).
- **AI Policy Evaluation Engine**: OpenAI (`gpt-4o-mini`) agent that ingests natural language spending requests and evaluates them against department budget policies (`Engineering: $500`, `Marketing: $300`, `Sales: $1,000`, `Operations: $400`).
- **Autonomous On-Chain USDC Settlement**: Real sub-second USDC transfer execution on Arc Testnet via **Circle Developer-Controlled Wallets SDK** (`@circle-fin/developer-controlled-wallets`).
- **Dark-Themed React Dashboard**: Full web UI displaying live Circle treasury balances, interactive spend request form, AI decision breakdown, and real-time ArcScan transaction feed.

### 🔮 What’s Next:
- **Cross-Chain Liquidity**: Integrating Circle’s **App Kit Unified Balance** for cross-chain USDC liquidity sourcing.
- **Agent Interoperability**: Implementing **ERC-8004 On-Chain Agent Registration** & **ERC-8183 Escrow Job Settlement** for agent-to-agent procurement.

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
WALLET_ID=YOUR_CIRCLE_WALLET_ID_HERE
WALLET_ADDRESS=YOUR_CIRCLE_WALLET_ADDRESS_HERE
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
# Starts server on http://localhost:3002
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
