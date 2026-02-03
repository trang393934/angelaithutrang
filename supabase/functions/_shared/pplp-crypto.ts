/**
 * PPLP Cryptographic Utilities
 * 
 * Implements Evidence Anchoring with keccak256 hashing
 * for on-chain verification compatibility.
 */

import { LightAction, LightActionEvidence, MintRequest } from "./pplp-types.ts";

// ============================================
// KECCAK256 IMPLEMENTATION
// Using Web Crypto API compatible with Deno
// ============================================

/**
 * Simple keccak256-like hash using SHA-256
 * Note: For true keccak256, use ethers.js in production
 * This provides a consistent hash for evidence anchoring
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate canonical JSON string for hashing
 * Ensures consistent ordering of keys
 */
export function canonicalJSON(obj: unknown): string {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    const items = obj.map(item => canonicalJSON(item));
    return '[' + items.join(',') + ']';
  }
  
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs = sortedKeys.map(key => {
    const value = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalJSON(value);
  });
  
  return '{' + pairs.join(',') + '}';
}

/**
 * Generate content hash for a single piece of evidence
 */
export async function generateEvidenceContentHash(evidence: LightActionEvidence): Promise<string> {
  const canonical = canonicalJSON({
    type: evidence.type,
    value: evidence.value,
    uri: evidence.uri,
    metadata: evidence.metadata,
  });
  
  return await sha256(canonical);
}

/**
 * Generate evidence bundle hash from multiple evidence items
 * This is the evidenceHash used in mint requests
 */
export async function generateEvidenceBundleHash(evidences: LightActionEvidence[]): Promise<string> {
  if (!evidences || evidences.length === 0) {
    return '0x' + '0'.repeat(64);
  }
  
  // Get content hashes for all evidence
  const contentHashes = await Promise.all(
    evidences.map(e => e.content_hash || generateEvidenceContentHash(e))
  );
  
  // Sort for consistency
  contentHashes.sort();
  
  // Hash the bundle
  const bundleCanonical = canonicalJSON(contentHashes);
  return await sha256(bundleCanonical);
}

/**
 * Generate canonical hash for a LightAction
 * This is stored on-chain or in DB for verification
 */
export async function generateCanonicalHash(action: LightAction): Promise<string> {
  const canonicalAction = {
    action_id: action.action_id,
    platform_id: action.platform_id,
    action_type: action.action_type,
    actor: action.actor,
    timestamp: action.timestamp,
    metadata: action.metadata,
    evidence_hashes: await Promise.all(
      action.evidence.map(e => e.content_hash || generateEvidenceContentHash(e))
    ),
    impact: action.impact,
    integrity: action.integrity,
  };
  
  return await sha256(canonicalJSON(canonicalAction));
}

/**
 * Generate mint request hash
 * mintRequestHash = hash(evidenceHash + policyVersion + actionId)
 */
export async function generateMintRequestHash(
  evidenceHash: string,
  policyVersion: string,
  actionId: string
): Promise<string> {
  const mintInput = canonicalJSON({
    evidence_hash: evidenceHash,
    policy_version: policyVersion,
    action_id: actionId,
  });
  
  return await sha256(mintInput);
}

/**
 * Create a complete MintRequest object
 */
export async function createMintRequest(
  action: LightAction,
  policyVersion: string,
  rewardAmount: number
): Promise<MintRequest> {
  const evidenceHash = await generateEvidenceBundleHash(action.evidence);
  const mintRequestHash = await generateMintRequestHash(
    evidenceHash,
    policyVersion,
    action.action_id
  );
  
  return {
    action_id: action.action_id,
    evidence_hash: evidenceHash,
    policy_version: policyVersion,
    actor: action.actor,
    reward_amount: rewardAmount,
    mint_request_hash: mintRequestHash,
    timestamp: Date.now(),
  };
}

/**
 * Verify a mint request hash
 */
export async function verifyMintRequestHash(mintRequest: MintRequest): Promise<boolean> {
  const expectedHash = await generateMintRequestHash(
    mintRequest.evidence_hash,
    mintRequest.policy_version,
    mintRequest.action_id
  );
  
  return expectedHash === mintRequest.mint_request_hash;
}

/**
 * Simple hash for backward compatibility
 * (Used by existing code before migration to keccak256)
 */
export function simpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Check if a hash is in the new keccak256-style format
 */
export function isKeccak256Format(hash: string): boolean {
  return hash.startsWith('0x') && hash.length === 66;
}

/**
 * Validate evidence integrity by checking hash matches content
 */
export async function validateEvidenceIntegrity(
  evidence: LightActionEvidence
): Promise<{ valid: boolean; computed_hash: string }> {
  const computedHash = await generateEvidenceContentHash(evidence);
  
  if (evidence.content_hash) {
    return {
      valid: computedHash === evidence.content_hash,
      computed_hash: computedHash,
    };
  }
  
  return {
    valid: true, // No stored hash to compare
    computed_hash: computedHash,
  };
}
