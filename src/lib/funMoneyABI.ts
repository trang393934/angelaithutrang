/**
 * FUN Money Contract ABI (FUNMoneyProductionV1_2_1)
 * 
 * This is the ACTUAL ABI of the deployed contract on BSC Testnet.
 * Flow: lockWithPPLP() → activate() → claim() → transfer()
 * 
 * Contract: 0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2
 */

export const FUN_MONEY_ABI = [
  // ============================================
  // ERC-20 STANDARD
  // ============================================
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address a) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // ============================================
  // PPLP VESTING/LOCK ENGINE
  // ============================================
  
  // Main minting function - requires attester signatures
  "function lockWithPPLP(address user, string action, uint256 amount, bytes32 evidenceHash, bytes[] sigs)",
  
  // Vesting transitions: locked → activated → claimable
  "function activate(uint256 amount)",
  "function claim(uint256 amount)",
  
  // ============================================
  // READ STATE
  // ============================================
  
  // User allocation: { locked, activated }
  "function alloc(address) view returns (uint256 locked, uint256 activated)",
  
  // Nonces mapping (for signature replay protection)
  "function nonces(address) view returns (uint256)",
  
  // Attester system
  "function isAttester(address) view returns (bool)",
  "function attesterThreshold() view returns (uint256)",
  
  // Action registry
  "function actions(bytes32) view returns (bool allowed, uint32 version, bool deprecated)",
  
  // Epoch caps
  "function epochDuration() view returns (uint256)",
  "function epochMintCap() view returns (uint256)",
  "function epochs(bytes32) view returns (uint64 start, uint256 minted)",
  
  // Governance
  "function guardianGov() view returns (address)",
  "function communityPool() view returns (address)",
  "function pauseTransitions() view returns (bool)",
  
  // Aggregate helpers
  "function totalLocked(address[] calldata users) view returns (uint256 sum)",
  "function totalActivated(address[] calldata users) view returns (uint256 sum)",
  
  // Constants
  "function MAX_SIGS() view returns (uint256)",
  "function PPLP_TYPEHASH() view returns (bytes32)",
  
  // ============================================
  // GOVERNANCE (requires guardianGov)
  // ============================================
  "function govRegisterAction(string name, uint32 version)",
  "function govDeprecateAction(string name, uint32 newVersion)",
  "function govSetAttester(address attester, bool allowed)",
  "function govSetAttesterThreshold(uint256 newThreshold)",
  "function govPauseTransitions(bool paused)",
  "function govRecycleExcessToCommunity(uint256 amount)",
  
  // ============================================
  // EVENTS
  // ============================================
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event PureLoveAccepted(address indexed user, bytes32 indexed action, uint256 amount, uint32 version)",
  "event ActionRegistered(bytes32 indexed action, uint32 version)",
  "event ActionDeprecated(bytes32 indexed action, uint32 oldVersion, uint32 newVersion)",
  "event AttesterUpdated(address indexed attester, bool allowed)",
  "event AttesterThresholdUpdated(uint256 oldThreshold, uint256 newThreshold)",
  "event TransitionsPaused(bool paused)",
  "event ExcessRecycled(uint256 amount)",
] as const;

// Contract addresses per network
export const FUN_MONEY_ADDRESSES: Record<number, string> = {
  56: "", // BSC Mainnet - to be deployed later
  97: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2", // BSC Testnet
};

// EIP-712 Domain for PPLP signatures (used by attesters)
export const FUN_MONEY_DOMAIN = {
  name: "FUNMoney-PPLP",
  version: "1",
  chainId: 97, // BSC Testnet
  verifyingContract: "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2",
};

// PPLP Lock Request types for EIP-712 (attester signing)
export const PPLP_LOCK_TYPES = {
  PPLPLock: [
    { name: "user", type: "address" },
    { name: "action", type: "bytes32" },
    { name: "amount", type: "uint256" },
    { name: "evidenceHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

export interface PPLPLockRequest {
  user: string;
  action: string; // action name string (will be hashed in contract)
  amount: bigint;
  evidenceHash: string;
  nonce: bigint;
}

export interface SignedPPLPLockRequest extends PPLPLockRequest {
  signatures: string[]; // multiple attester signatures required
  signers: string[];
}

// User allocation state
export interface UserAllocation {
  locked: bigint;
  activated: bigint;
  claimable: bigint; // = activated (can claim up to this)
}

// Error messages
export const PPLP_ERROR_MESSAGES: Record<string, string> = {
  "not allowed": "Action này chưa được đăng ký hoặc đã bị deprecate.",
  "threshold": "Chưa đủ số lượng chữ ký attester.",
  "duplicate sig": "Có chữ ký bị trùng lặp.",
  "invalid sig": "Chữ ký attester không hợp lệ.",
  "paused": "Hệ thống đang tạm dừng transitions.",
  "epoch cap": "Đã đạt giới hạn mint trong epoch này.",
  "exceed locked": "Số lượng activate vượt quá locked.",
  "exceed activated": "Số lượng claim vượt quá activated.",
};

// Legacy export for backward compatibility
export interface MintRequest {
  to: string;
  amount: bigint;
  actionId: string;
  evidenceHash: string;
  policyVersion: number;
  validAfter: number;
  validBefore: number;
  nonce: bigint;
}

export interface SignedMintRequest extends MintRequest {
  signature: string;
  signer: string;
}

// Legacy error messages (kept for backward compatibility)
export const MINT_ERROR_MESSAGES = PPLP_ERROR_MESSAGES;
