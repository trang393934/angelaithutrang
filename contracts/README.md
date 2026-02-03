# FUN Money Smart Contracts

## Overview

This directory contains the Solidity smart contracts for the FUN Ecosystem's token economy.

## Contracts

### FUNMoney.sol

The main BEP-20/ERC-20 token with integrated PPLP Mint Engine.

**Features:**
- EIP-712 typed signature verification for secure minting
- Idempotent minting (each actionId can only mint once)
- Epoch-based rate limiting (global + per-user caps)
- Role-based access control (Admin, Signer, Governor, Pauser)
- ERC20Permit for gasless approvals
- Pausable for emergency stops
- ReentrancyGuard for security

## Deployment

### Prerequisites

```bash
npm install -g hardhat
npm install @openzeppelin/contracts
```

### Compile

```bash
npx hardhat compile
```

### Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Deploy to BSC Mainnet

```bash
npx hardhat run scripts/deploy.js --network bscMainnet
```

## Configuration

### Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name_` | string | Token name (e.g., "FUN Money") |
| `symbol_` | string | Token symbol (e.g., "FUN") |
| `epochMintCap_` | uint256 | Max tokens mintable per epoch globally |
| `userEpochCap_` | uint256 | Max tokens mintable per user per epoch |
| `admin_` | address | Initial admin address |

### Recommended Settings

- **Epoch Duration**: 1 day (86400 seconds)
- **Epoch Mint Cap**: 10,000,000 FUN (10M tokens)
- **User Epoch Cap**: 100,000 FUN (100K tokens per user)
- **Min Mint Amount**: 1 FUN
- **Max Mint Amount**: 1,000,000 FUN

## Roles

| Role | Permissions |
|------|-------------|
| `ADMIN_ROLE` | Grant/revoke roles, enable/disable minting |
| `SIGNER_ROLE` | Sign mint requests (PPLP Engine) |
| `GOVERNOR_ROLE` | Update epoch params, policy version |
| `PAUSER_ROLE` | Pause/unpause all transfers |

## Integration with PPLP Engine

### Mint Flow

1. User performs a Light Action on FUN Platform
2. PPLP Engine scores the action and creates a `MintRequest`
3. PPLP Signer signs the request with EIP-712
4. User (or relayer) calls `mintWithSignature()` with the signed request
5. Contract verifies signature, caps, and mints tokens

### EIP-712 Domain

```solidity
EIP712Domain {
    name: "FUNMoney-PPLP",
    version: "1",
    chainId: 56,  // BSC Mainnet (97 for testnet)
    verifyingContract: <contract_address>
}
```

### MintRequest Type

```solidity
MintRequest {
    address to,
    uint256 amount,
    bytes32 actionId,
    bytes32 evidenceHash,
    uint32 policyVersion,
    uint64 validAfter,
    uint64 validBefore,
    uint256 nonce
}
```

## Security Considerations

1. **Double-mint Protection**: Each `actionId` can only be minted once
2. **Nonce Protection**: Prevents signature replay attacks
3. **Time Window**: Signatures expire after `validBefore`
4. **Policy Version**: Old signatures invalidated on version bump
5. **Rate Limiting**: Epoch caps prevent excessive minting
6. **Pausable**: Emergency stop for all transfers

## Audit Status

- [ ] Internal review
- [ ] External audit (planned)

## License

MIT
