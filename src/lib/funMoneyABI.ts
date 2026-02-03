/**
 * FUN Money Contract ABI
 * 
 * Essential functions for frontend integration with the FUNMoney BEP-20 token.
 */

export const FUN_MONEY_ABI = [
  // ============================================
  // ERC-20 STANDARD
  // ============================================
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // ============================================
  // ERC-20 PERMIT (Gasless Approvals)
  // ============================================
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  
  // ============================================
  // PPLP MINT ENGINE
  // ============================================
  "function mintWithSignature((address to, uint256 amount, bytes32 actionId, bytes32 evidenceHash, uint32 policyVersion, uint64 validAfter, uint64 validBefore, uint256 nonce) req, bytes signature)",
  
  // Mint state
  "function mintedAction(bytes32 actionId) view returns (bool)",
  "function mintNonces(address user) view returns (uint256)",
  "function getNonce(address user) view returns (uint256)",
  "function isActionMinted(bytes32 actionId) view returns (bool)",
  
  // ============================================
  // EPOCH CAPS
  // ============================================
  "function epochDurationSec() view returns (uint256)",
  "function epochMintCap() view returns (uint256)",
  "function userEpochCap() view returns (uint256)",
  "function mintedInEpoch(uint256 epoch) view returns (uint256)",
  "function userMintedInEpoch(uint256 epoch, address user) view returns (uint256)",
  "function currentEpoch() view returns (uint256)",
  "function remainingEpochCapacity() view returns (uint256)",
  "function remainingUserCapacity(address user) view returns (uint256)",
  
  // ============================================
  // ADMIN FUNCTIONS
  // ============================================
  "function mintingEnabled() view returns (bool)",
  "function currentPolicyVersion() view returns (uint32)",
  "function minMintAmount() view returns (uint256)",
  "function maxMintAmount() view returns (uint256)",
  "function domainSeparator() view returns (bytes32)",
  
  // Roles
  "function ADMIN_ROLE() view returns (bytes32)",
  "function SIGNER_ROLE() view returns (bytes32)",
  "function GOVERNOR_ROLE() view returns (bytes32)",
  "function PAUSER_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  
  // Pausable
  "function paused() view returns (bool)",
  
  // ============================================
  // EVENTS
  // ============================================
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event MintAuthorized(address indexed to, uint256 amount, bytes32 indexed actionId, bytes32 evidenceHash, uint32 policyVersion, uint64 validAfter, uint64 validBefore, uint256 nonce, address indexed signer)",
  "event EpochParamsUpdated(uint256 epochDurationSec, uint256 epochMintCap, uint256 userEpochCap)",
  "event MintingEnabledUpdated(bool enabled)",
  "event PolicyVersionUpdated(uint32 newVersion)",
  "event MintLimitsUpdated(uint256 minAmount, uint256 maxAmount)",
  "event SignerAdded(address indexed signer)",
  "event SignerRemoved(address indexed signer)",
  "event Paused(address account)",
  "event Unpaused(address account)",
] as const;

// Contract addresses per network
export const FUN_MONEY_ADDRESSES: Record<number, string> = {
  56: "", // BSC Mainnet - to be filled after deployment
  97: "", // BSC Testnet - to be filled after deployment
};

// EIP-712 Domain for signing
export const FUN_MONEY_DOMAIN = {
  name: "FUNMoney-PPLP",
  version: "1",
  chainId: 56, // BSC Mainnet
  verifyingContract: "", // To be filled after deployment
};

// MintRequest types for EIP-712
export const MINT_REQUEST_TYPES = {
  MintRequest: [
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "actionId", type: "bytes32" },
    { name: "evidenceHash", type: "bytes32" },
    { name: "policyVersion", type: "uint32" },
    { name: "validAfter", type: "uint64" },
    { name: "validBefore", type: "uint64" },
    { name: "nonce", type: "uint256" },
  ],
} as const;

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
