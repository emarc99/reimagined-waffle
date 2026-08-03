import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { evaluateSpendRequest } from './agent.js';
import {
  getUsdcBalance,
  executeUsdcSettlement,
  getContractTransactions,
  ARC_EXPLORER,
} from './services/arcSettlement.js';

dotenv.config();

const app: Express = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
const AGENT_WALLET = process.env.WALLET_ADDRESS || '0xfd701ef535647a4d502baf960a971c7dfb698176';
const CONTRACT_ADDRESS = process.env.SPENDING_POLICY_ADDRESS || '';

// In-memory store for recent spend transactions (max 5)
const recentTransactions: any[] = [];

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CapSpend Arc Agentic Backend',
    chain: 'Arc Testnet (Chain ID: 5042002)',
    custodyType: 'Circle Developer-Controlled Wallet',
    contract: CONTRACT_ADDRESS,
    agentWallet: AGENT_WALLET,
    timestamp: new Date().toISOString(),
  });
});

// Get USDC balance of agent wallet via Circle SDK
app.get('/api/balance', async (_req: Request, res: Response) => {
  try {
    const balance = await getUsdcBalance(AGENT_WALLET);
    res.json({
      address: AGENT_WALLET,
      usdc: balance,
      currency: 'USDC',
      network: 'Arc Testnet',
      custodyType: 'Circle Developer-Controlled Wallet',
      explorerUrl: `${ARC_EXPLORER}/address/${AGENT_WALLET}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch balance', details: String(err) });
  }
});

// Get max 5 recent transactions
app.get('/api/transactions', async (_req: Request, res: Response) => {
  try {
    const circleTxns = await getContractTransactions();
    const allTxns = [...recentTransactions, ...circleTxns];
    
    // Deduplicate by txnId and return max 5
    const uniqueMap = new Map<string, any>();
    for (const tx of allTxns) {
      if (tx.txnId && !uniqueMap.has(tx.txnId)) {
        uniqueMap.set(tx.txnId, tx);
      }
    }

    const max5Txns = Array.from(uniqueMap.values()).slice(0, 5);
    res.json({ transactions: max5Txns, count: max5Txns.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions', details: String(err) });
  }
});

/**
 * POST /api/spend-request
 * Submit a natural language spend request.
 * OpenAI Agent evaluates policy -> Circle Developer-Controlled Wallet executes USDC settlement on Arc.
 */
app.post('/api/spend-request', async (req: Request, res: Response) => {
  try {
    const { prompt, merchantWallet } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    // Step 1: OpenAI Policy Agent Evaluation
    console.log('[Agent] Evaluating spend request:', prompt);
    const decision = await evaluateSpendRequest(prompt);
    console.log('[Agent] Policy decision:', decision);

    const txnId = `CSARC-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const targetMerchantWallet = merchantWallet || '0xfd701ef535647a4d502baf960a971c7dfb698176';

    let settlementTxHash: string | null = null;
    let explorerUrl: string | null = null;

    // Step 2: If approved, execute USDC transfer via Circle Developer-Controlled Wallet SDK
    if (decision.approved) {
      try {
        const settlement = await executeUsdcSettlement({
          merchantWallet: targetMerchantWallet,
          amountUsdc: decision.amount,
          description: `CapSpend Arc: ${decision.merchantName} (${decision.department})`,
        });
        settlementTxHash = settlement.txHash || settlement.txId;
        explorerUrl = settlement.explorerUrl;
        console.log('[CircleSDK] On-chain USDC settlement completed:', settlementTxHash);
      } catch (circleErr) {
        console.warn('[CircleSDK] Settlement error:', String(circleErr));
      }
    }

    // Step 3: Record transaction in recent list (max 5)
    const newTxRecord = {
      txnId,
      department: decision.department,
      merchantName: decision.merchantName,
      merchantWallet: targetMerchantWallet,
      amount: decision.amount.toFixed(2),
      status: decision.approved ? 'Approved' : 'Rejected',
      rejectionReason: decision.approved ? '' : decision.reason,
      createdAt: new Date().toISOString(),
      settledAt: decision.approved ? new Date().toISOString() : null,
      txHash: settlementTxHash,
      explorerUrl,
    };

    recentTransactions.unshift(newTxRecord);
    if (recentTransactions.length > 5) {
      recentTransactions.pop();
    }

    res.json({
      txnId,
      approved: decision.approved,
      department: decision.department,
      merchantName: decision.merchantName,
      amount: decision.amount,
      currency: 'USDC',
      reason: decision.reason,
      onChain: {
        requestTxHash: settlementTxHash,
        settlementTxHash,
        requestExplorerUrl: explorerUrl,
        settlementExplorerUrl: explorerUrl,
        contractAddress: CONTRACT_ADDRESS || AGENT_WALLET,
        network: 'Arc Testnet (Chain ID 5042002)',
        custodyType: 'Circle Developer-Controlled Wallet',
      },
    });
  } catch (err) {
    console.error('[Server] Spend request error:', err);
    res.status(500).json({ error: 'Internal server error', details: String(err) });
  }
});

function startServer(port: number) {
  const server = app.listen(port, () => {
    console.log(`🚀 CapSpend Arc Backend running on port ${port}`);
    console.log(`   Chain: Arc Testnet (Chain ID 5042002)`);
    console.log(`   Circle Dev-Controlled Wallet: ${AGENT_WALLET}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Server] Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Server] Server error:', err);
    }
  });
}

startServer(Number(PORT));
