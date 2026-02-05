/**
 * PPLP EIP-712 Typed Data Signing
 * 
 * Implements EIP-712 structured data signing for on-chain mint authorization.
 * Used by PPLP Signer to create verifiable mint requests.
 */

// ============================================
// EIP-712 DOMAIN & TYPES
// ============================================

export const PPLP_DOMAIN = {
  name: 'FUNMoney-PPLP',
  version: '1',
  chainId: 97, // BSC Testnet
  verifyingContract: '0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2', // FUNMoney Contract
};

export const MINT_REQUEST_TYPES = {
  MintRequest: [
    { name: 'to', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'actionId', type: 'bytes32' },
    { name: 'evidenceHash', type: 'bytes32' },
    { name: 'policyVersion', type: 'uint32' },
    { name: 'validAfter', type: 'uint64' },
    { name: 'validBefore', type: 'uint64' },
    { name: 'nonce', type: 'uint256' },
  ],
};

// ============================================
// INTERFACES
// ============================================

export interface MintRequestPayload {
  to: string; // Recipient wallet address
  amount: bigint; // Token amount in wei
  actionId: string; // bytes32 hash of action
  evidenceHash: string; // bytes32 hash of evidence bundle
  policyVersion: number;
  validAfter: number; // Unix timestamp
  validBefore: number; // Unix timestamp
  nonce: bigint;
}

export interface SignedMintRequest extends MintRequestPayload {
  signature: string;
  signer: string;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

// ============================================
// HASH UTILITIES
// ============================================

/**
 * Convert UUID to bytes32 format
 */
export function uuidToBytes32(uuid: string): string {
  // Remove hyphens and ensure 0x prefix
  const hex = uuid.replace(/-/g, '');
  return '0x' + hex.padStart(64, '0');
}

/**
 * Keccak256 hash using Web Crypto (SHA-256 fallback for Deno)
 * Note: For production, use ethers.keccak256
 */
async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash EIP-712 domain separator
 */
export async function hashDomainSeparator(domain: EIP712Domain): Promise<string> {
  const domainStr = JSON.stringify({
    name: domain.name,
    version: domain.version,
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract,
  });
  return await sha256Hash('EIP712Domain' + domainStr);
}

/**
 * Hash the mint request struct
 */
export async function hashMintRequest(request: MintRequestPayload): Promise<string> {
  const structStr = JSON.stringify({
    to: request.to.toLowerCase(),
    amount: request.amount.toString(),
    actionId: request.actionId,
    evidenceHash: request.evidenceHash,
    policyVersion: request.policyVersion,
    validAfter: request.validAfter,
    validBefore: request.validBefore,
    nonce: request.nonce.toString(),
  });
  return await sha256Hash('MintRequest' + structStr);
}

/**
 * Create the full EIP-712 message hash for signing
 */
export async function createTypedDataHash(
  domain: EIP712Domain,
  request: MintRequestPayload
): Promise<string> {
  const domainHash = await hashDomainSeparator(domain);
  const requestHash = await hashMintRequest(request);
  return await sha256Hash('\x19\x01' + domainHash + requestHash);
}

// ============================================
// SIGNATURE CREATION (Server-side)
// ============================================

/**
 * Sign a mint request with the PPLP Signer private key
 * Uses ethers.js for actual signing
 */
export async function signMintRequest(
  request: MintRequestPayload,
  privateKey: string,
  domain: EIP712Domain = PPLP_DOMAIN
): Promise<SignedMintRequest> {
  // Dynamic import of ethers for Deno
  const { ethers } = await import('https://esm.sh/ethers@6.16.0');
  
  const wallet = new ethers.Wallet(privateKey);
  
  // Create typed data
  const typedData = {
    domain: {
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: MINT_REQUEST_TYPES,
    primaryType: 'MintRequest' as const,
    message: {
      to: request.to,
      amount: request.amount,
      actionId: request.actionId,
      evidenceHash: request.evidenceHash,
      policyVersion: request.policyVersion,
      validAfter: request.validAfter,
      validBefore: request.validBefore,
      nonce: request.nonce,
    },
  };
  
  // Sign with EIP-712
  const signature = await wallet.signTypedData(
    typedData.domain,
    typedData.types,
    typedData.message
  );
  
  return {
    ...request,
    signature,
    signer: wallet.address,
  };
}

// ============================================
// SIGNATURE VERIFICATION
// ============================================

/**
 * Verify a signed mint request
 */
export async function verifyMintSignature(
  signedRequest: SignedMintRequest,
  expectedSigner: string,
  domain: EIP712Domain = PPLP_DOMAIN
): Promise<boolean> {
  const { ethers } = await import('https://esm.sh/ethers@6.16.0');
  
  const typedData = {
    domain: {
      name: domain.name,
      version: domain.version,
      chainId: domain.chainId,
      verifyingContract: domain.verifyingContract,
    },
    types: MINT_REQUEST_TYPES,
    primaryType: 'MintRequest' as const,
    message: {
      to: signedRequest.to,
      amount: signedRequest.amount,
      actionId: signedRequest.actionId,
      evidenceHash: signedRequest.evidenceHash,
      policyVersion: signedRequest.policyVersion,
      validAfter: signedRequest.validAfter,
      validBefore: signedRequest.validBefore,
      nonce: signedRequest.nonce,
    },
  };
  
  const recoveredAddress = ethers.verifyTypedData(
    typedData.domain,
    typedData.types,
    typedData.message,
    signedRequest.signature
  );
  
  return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
}

// ============================================
// PAYLOAD BUILDERS
// ============================================

/**
 * Create a mint request payload from action data
 */
export function createMintPayload(params: {
  recipientAddress: string;
  amount: number;
  actionId: string;
  evidenceHash: string;
  policyVersion: number;
  nonce: bigint | number | string;
  validityHours?: number;
}): MintRequestPayload {
  const now = Math.floor(Date.now() / 1000);
  const validitySeconds = (params.validityHours || 24) * 3600;
  // Buffer to avoid small clock skews between server time and blockchain time
  // (prevents RequestTooEarly right after authorization)
  const validAfter = Math.max(0, now - 60);
  const WEI = 10n ** 18n;
  
  // Ensure evidenceHash is exactly 32 bytes (64 hex chars)
  let evidenceHash = params.evidenceHash;
  if (!evidenceHash || evidenceHash === '0x' || evidenceHash.length < 10) {
    // Generate a default hash from actionId if no evidence
    evidenceHash = '0x' + '0'.repeat(64);
  } else if (!evidenceHash.startsWith('0x')) {
    evidenceHash = '0x' + evidenceHash;
  }
  // Pad to 64 hex characters (32 bytes)
  const hexPart = evidenceHash.slice(2);
  evidenceHash = '0x' + hexPart.padStart(64, '0');
  
  // Normalize nonce to bigint (accepts bigint, number, or string)
  const normalizedNonce = typeof params.nonce === 'bigint' 
    ? params.nonce 
    : BigInt(params.nonce);
  
  return {
    to: params.recipientAddress,
    // Scale to 18 decimals (FUN Money has 18 decimals like ETH)
    amount: BigInt(params.amount) * WEI,
    actionId: uuidToBytes32(params.actionId),
    evidenceHash: evidenceHash,
    policyVersion: params.policyVersion,
    validAfter,
    validBefore: now + validitySeconds,
    nonce: normalizedNonce,
  };
}

/**
 * Serialize signed request for API response
 */
export function serializeSignedRequest(request: SignedMintRequest): Record<string, string> {
  return {
    to: request.to,
    amount: request.amount.toString(),
    actionId: request.actionId,
    evidenceHash: request.evidenceHash,
    policyVersion: request.policyVersion.toString(),
    validAfter: request.validAfter.toString(),
    validBefore: request.validBefore.toString(),
    nonce: request.nonce.toString(),
    signature: request.signature,
    signer: request.signer,
  };
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if a mint request is still valid (not expired)
 */
export function isMintRequestValid(request: MintRequestPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= request.validAfter && now < request.validBefore;
}

/**
 * Validate wallet address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
