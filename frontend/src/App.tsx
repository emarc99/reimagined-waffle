import { useState, useEffect, useCallback } from 'react';

const API = '';

const POLICY = {
  Engineering: 500,
  Marketing: 300,
  Sales: 1000,
  Operations: 400,
};

const DEPARTMENTS = Object.keys(POLICY);

const ARC_EXPLORER = 'https://testnet.arcscan.app';

interface SpendResult {
  txnId: string;
  approved: boolean;
  department: string;
  merchantName: string;
  amount: number;
  reason: string;
  onChain: {
    requestTxHash: string | null;
    settlementTxHash: string | null;
    requestExplorerUrl: string | null;
    settlementExplorerUrl: string | null;
    contractAddress: string;
    network: string;
  };
}

interface Transaction {
  txnId: string;
  department: string;
  merchantName: string;
  merchantWallet: string;
  amount: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason: string;
  createdAt: string;
  settledAt: string | null;
}

interface Balance {
  usdc: string;
  address: string;
  explorerUrl: string;
}

function truncateHash(hash: string) {
  if (!hash) return '';
  return hash.slice(0, 8) + '...' + hash.slice(-6);
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [merchantWallet, setMerchantWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpendResult | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [txnsLoading, setTxnsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/balance`);
      const data = await res.json();
      setBalance(data);
    } catch { }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setTxnsLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions`);
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch { }
    setTxnsLoading(false);
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
    const interval = setInterval(() => { fetchBalance(); fetchTransactions(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchBalance, fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API}/api/spend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, merchantWallet: merchantWallet || undefined }),
      });
      const data: SpendResult = await res.json();
      setResult(data);
      // Immediately refresh transactions and balance
      fetchTransactions();
      fetchBalance();
      setTimeout(fetchTransactions, 2000);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const approved = transactions.filter(t => t.status === 'Approved').length;
  const rejected = transactions.filter(t => t.status === 'Rejected').length;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-logo">
          <div className="logo-icon">🛡️</div>
          <span className="logo-text">CapSpend</span>
          <span className="logo-badge">ARC TESTNET</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="header-chain">
            <div className="chain-dot" />
            <span>Arc Testnet · Chain ID 5042002</span>
          </div>
          {balance && (
            <a
              href={balance.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: '#2775ca',
                background: 'rgba(39,117,202,0.1)',
                padding: '5px 12px',
                borderRadius: 20,
                border: '1px solid rgba(39,117,202,0.25)',
                textDecoration: 'none',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600,
              }}
            >
              ${balance.usdc} USDC
            </a>
          )}
        </div>
      </header>

      <main className="main">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Treasury Balance</div>
            <div className="stat-value usdc">${balance?.usdc ?? '—'}</div>
            <div className="stat-sub">USDC on Arc Testnet</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved Requests</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{approved}</div>
            <div className="stat-sub">USDC disbursed on-chain</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rejected Requests</div>
            <div className="stat-value" style={{ color: '#ef4444' }}>{rejected}</div>
            <div className="stat-sub">Policy violations blocked</div>
          </div>
        </div>

        <div className="content-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Spend Request Form */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-icon">🤖</span>
                <span className="panel-title">Submit Spend Request</span>
              </div>
              <div className="panel-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Natural Language Request</label>
                    <textarea
                      id="spend-prompt"
                      className="form-textarea"
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder='e.g. "Requesting $150 for JetBrains IDE license for Engineering"'
                      disabled={loading}
                      style={{ minHeight: 90 }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Merchant Wallet Address (optional)</label>
                    <input
                      id="merchant-wallet"
                      className="form-input"
                      value={merchantWallet}
                      onChange={e => setMerchantWallet(e.target.value)}
                      placeholder="0x... (Arc Testnet address to receive USDC)"
                      disabled={loading}
                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
                    />
                  </div>
                  <button id="submit-spend-btn" className="btn btn-primary" type="submit" disabled={loading || !prompt.trim()}>
                    {loading ? (
                      <><div className="spinner" /> Processing on Arc...</>
                    ) : (
                      <><span>⚡</span> Submit & Settle on Arc</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* AI Decision Result */}
            {result && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-icon">{result.approved ? '✅' : '❌'}</span>
                  <span className="panel-title">AI Policy Decision</span>
                </div>
                <div className="panel-body">
                  <div className={`decision-card ${result.approved ? 'approved' : 'rejected'}`}>
                    <div className="decision-header">
                      <span className={`decision-badge ${result.approved ? 'approved' : 'rejected'}`}>
                        {result.approved ? '✓ APPROVED' : '✗ REJECTED'}
                      </span>
                      <span className="decision-amount">${result.amount} USDC</span>
                    </div>
                    <div className="decision-row">
                      <span>Merchant</span>
                      <span>{result.merchantName}</span>
                    </div>
                    <div className="decision-row">
                      <span>Department</span>
                      <span>{result.department}</span>
                    </div>
                    <div className="decision-row">
                      <span>Txn ID</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{result.txnId}</span>
                    </div>
                    {result.onChain.requestTxHash && (
                      <div className="decision-row">
                        <span>Request Tx</span>
                        <a
                          href={result.onChain.requestExplorerUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          {truncateHash(result.onChain.requestTxHash)} ↗
                        </a>
                      </div>
                    )}
                    {result.onChain.settlementTxHash && (
                      <div className="decision-row">
                        <span>{result.approved ? 'Settlement Tx' : 'Rejection Tx'}</span>
                        <a
                          href={result.onChain.settlementExplorerUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          {truncateHash(result.onChain.settlementTxHash)} ↗
                        </a>
                      </div>
                    )}
                    {result.onChain.contractAddress && (
                      <div className="decision-row">
                        <span>Contract</span>
                        <a
                          href={`${ARC_EXPLORER}/address/${result.onChain.contractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tx-link"
                        >
                          {truncateHash(result.onChain.contractAddress)} ↗
                        </a>
                      </div>
                    )}
                    <div className="decision-reason">"{result.reason}"</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Corporate Policy Matrix */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-icon">📋</span>
                <span className="panel-title">Corporate Policy Matrix</span>
              </div>
              <div className="panel-body" style={{ padding: 0 }}>
                <table className="policy-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Max Per Txn</th>
                      <th>Allowed Categories</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Engineering</td><td className="limit-value">$500</td><td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Software, Cloud, Dev Tools</td></tr>
                    <tr><td>Marketing</td><td className="limit-value">$300</td><td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Design, Ads, Analytics</td></tr>
                    <tr><td>Sales</td><td className="limit-value">$1,000</td><td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CRM, Outreach, Contracts</td></tr>
                    <tr><td>Operations</td><td className="limit-value">$400</td><td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Logistics, SaaS, Hardware</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction Feed */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-icon">⛓️</span>
                <span className="panel-title">On-Chain Transactions</span>
                {txnsLoading && <div className="spinner" style={{ marginLeft: 'auto' }} />}
              </div>
              <div className="panel-body">
                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    No on-chain transactions yet.<br />Submit a spend request above.
                  </div>
                ) : (
                  <div className="tx-feed">
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.txnId} className="tx-item">
                        <div className="tx-item-header">
                          <span className="tx-merchant">{tx.merchantName}</span>
                          <span className="tx-amount">${tx.amount} USDC</span>
                        </div>
                        <div className="tx-meta">
                          <span className="tx-dept">{tx.department}</span>
                          <span className={`status-badge ${tx.status}`}>{tx.status}</span>
                          <span className="tx-time">{formatTime(tx.createdAt)}</span>
                        </div>
                        {(tx as any).explorerUrl && (
                          <div style={{ marginTop: 6 }}>
                            <a
                              href={(tx as any).explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tx-link"
                            >
                              View on ArcScan ↗
                            </a>
                          </div>
                        )}
                        {tx.status === 'Rejected' && tx.rejectionReason && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
                            {tx.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          CapSpend Arc · Agentic Economy Track ·{' '}
          <a href={`${ARC_EXPLORER}`} target="_blank" rel="noopener noreferrer">ArcScan Explorer</a>{' '}
          · <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer">USDC Faucet</a>
        </p>
      </footer>
    </div>
  );
}
