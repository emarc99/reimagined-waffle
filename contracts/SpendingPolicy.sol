// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

/**
 * @title SpendingPolicy
 * @notice On-chain corporate spending policy enforcement and USDC disbursement on Arc Testnet.
 *         AI agents submit and approve spend requests; approved requests trigger USDC transfers.
 */
contract SpendingPolicy {
    // Arc Testnet USDC ERC-20 address (6 decimals)
    address public constant USDC = 0x3600000000000000000000000000000000000000;

    address public owner;
    address public agent; // The AI agent wallet authorized to approve/reject

    enum Status { Pending, Approved, Rejected }

    struct SpendRequest {
        string txnId;
        string department;
        string merchantName;
        address merchantWallet;
        uint256 amount; // in USDC (6 decimals)
        Status status;
        string rejectionReason;
        uint256 createdAt;
        uint256 settledAt;
    }

    // Department limits in USDC (6 decimals: 1 USDC = 1_000_000)
    mapping(string => uint256) public departmentLimits;

    // txnId => SpendRequest
    mapping(string => SpendRequest) public spendRequests;
    string[] public allTxnIds;

    // Events
    event SpendRequested(string indexed txnId, string department, string merchantName, uint256 amount, uint256 timestamp);
    event SpendApproved(string indexed txnId, address merchantWallet, uint256 amount, uint256 timestamp);
    event SpendRejected(string indexed txnId, string reason, uint256 timestamp);
    event DepartmentLimitSet(string department, uint256 limit);
    event AgentUpdated(address newAgent);

    modifier onlyOwner() {
        require(msg.sender == owner, "SpendingPolicy: caller is not owner");
        _;
    }

    modifier onlyAgent() {
        require(msg.sender == agent || msg.sender == owner, "SpendingPolicy: caller is not authorized agent");
        _;
    }

    constructor(address _agent) {
        owner = msg.sender;
        agent = _agent;

        // Default corporate spending limits (USDC, 6 decimals)
        departmentLimits["Engineering"] = 500 * 1e6;   // $500 USDC
        departmentLimits["Marketing"]   = 300 * 1e6;   // $300 USDC
        departmentLimits["Sales"]       = 1000 * 1e6;  // $1000 USDC
        departmentLimits["Operations"]  = 400 * 1e6;   // $400 USDC
    }

    /**
     * @notice Submit a new spend request for AI agent evaluation.
     * @param txnId       Unique transaction reference ID
     * @param department  Employee's department (must have a configured limit)
     * @param merchantName Merchant name for display purposes
     * @param merchantWallet Merchant's wallet address to receive USDC
     * @param amount      Amount in USDC (6 decimals: $150 = 150_000_000)
     */
    function requestSpend(
        string calldata txnId,
        string calldata department,
        string calldata merchantName,
        address merchantWallet,
        uint256 amount
    ) external {
        require(bytes(txnId).length > 0, "SpendingPolicy: empty txnId");
        require(bytes(spendRequests[txnId].txnId).length == 0, "SpendingPolicy: txnId already exists");
        require(merchantWallet != address(0), "SpendingPolicy: zero merchant address");
        require(amount > 0, "SpendingPolicy: amount must be > 0");
        require(departmentLimits[department] > 0, "SpendingPolicy: unknown department");
        require(amount <= departmentLimits[department], "SpendingPolicy: exceeds department limit");

        spendRequests[txnId] = SpendRequest({
            txnId: txnId,
            department: department,
            merchantName: merchantName,
            merchantWallet: merchantWallet,
            amount: amount,
            status: Status.Pending,
            rejectionReason: "",
            createdAt: block.timestamp,
            settledAt: 0
        });

        allTxnIds.push(txnId);

        emit SpendRequested(txnId, department, merchantName, amount, block.timestamp);
    }

    /**
     * @notice AI agent approves a spend request and triggers USDC disbursement.
     * @param txnId Unique transaction reference ID to approve
     */
    function approveSpend(string calldata txnId) external onlyAgent {
        SpendRequest storage req = spendRequests[txnId];
        require(bytes(req.txnId).length > 0, "SpendingPolicy: request not found");
        require(req.status == Status.Pending, "SpendingPolicy: request not pending");

        req.status = Status.Approved;
        req.settledAt = block.timestamp;

        // Transfer USDC from this contract to merchant wallet
        bool success = IERC20(USDC).transfer(req.merchantWallet, req.amount);
        require(success, "SpendingPolicy: USDC transfer failed");

        emit SpendApproved(txnId, req.merchantWallet, req.amount, block.timestamp);
    }

    /**
     * @notice AI agent rejects a spend request with a reason.
     * @param txnId Unique transaction reference ID to reject
     * @param reason Human-readable rejection reason
     */
    function rejectSpend(string calldata txnId, string calldata reason) external onlyAgent {
        SpendRequest storage req = spendRequests[txnId];
        require(bytes(req.txnId).length > 0, "SpendingPolicy: request not found");
        require(req.status == Status.Pending, "SpendingPolicy: request not pending");

        req.status = Status.Rejected;
        req.rejectionReason = reason;
        req.settledAt = block.timestamp;

        emit SpendRejected(txnId, reason, block.timestamp);
    }

    /**
     * @notice Update a department's spending limit.
     */
    function setDepartmentLimit(string calldata department, uint256 limitInUsdc6Decimals) external onlyOwner {
        departmentLimits[department] = limitInUsdc6Decimals;
        emit DepartmentLimitSet(department, limitInUsdc6Decimals);
    }

    /**
     * @notice Update the authorized AI agent address.
     */
    function setAgent(address newAgent) external onlyOwner {
        agent = newAgent;
        emit AgentUpdated(newAgent);
    }

    /**
     * @notice Get all spend request IDs.
     */
    function getAllTxnIds() external view returns (string[] memory) {
        return allTxnIds;
    }

    /**
     * @notice Get the USDC balance held by this contract.
     */
    function contractUsdcBalance() external view returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }
}
