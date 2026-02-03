// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║                     FUN Money (BEP-20/ERC-20)                         ║
  ║                      + PPLP Mint Engine v1.0                          ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║  - Mint authorized by off-chain PPLP signer                           ║
  ║    (Angel AI + PPLP Engine + Governance)                              ║
  ║  - Prevent double-mint per actionId (idempotent)                      ║
  ║  - Epoch mint cap + user epoch cap                                    ║
  ║  - EIP-712 typed signature verification                               ║
  ╚═══════════════════════════════════════════════════════════════════════╝
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FUNMoney is 
    ERC20, 
    ERC20Burnable, 
    ERC20Permit, 
    AccessControl, 
    EIP712, 
    Pausable,
    ReentrancyGuard 
{
    using ECDSA for bytes32;

    // ═══════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════
    
    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE"); // Trusted PPLP signers
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE"); // For governance updates

    // ═══════════════════════════════════════════════════════════════════
    // MINT REPLAY PROTECTION
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Tracks which actionIds have been minted (idempotent)
    mapping(bytes32 => bool) public mintedAction;
    
    /// @notice Nonce per user for signature replay protection
    mapping(address => uint256) public mintNonces;

    // ═══════════════════════════════════════════════════════════════════
    // EPOCH CAPS
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Duration of each epoch in seconds (default: 1 day)
    uint256 public epochDurationSec = 1 days;
    
    /// @notice Total tokens minted in each epoch
    mapping(uint256 => uint256) public mintedInEpoch;
    
    /// @notice Maximum tokens that can be minted per epoch globally
    uint256 public epochMintCap;
    
    /// @notice Maximum tokens each user can mint per epoch
    uint256 public userEpochCap;
    
    /// @notice Tokens minted by each user in each epoch
    mapping(uint256 => mapping(address => uint256)) public userMintedInEpoch;

    // ═══════════════════════════════════════════════════════════════════
    // POLICY / GOVERNANCE FLAGS
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Master switch for minting
    bool public mintingEnabled = true;
    
    /// @notice Current policy version (must match signed requests)
    uint32 public currentPolicyVersion = 1;
    
    /// @notice Minimum amount per mint (anti-dust)
    uint256 public minMintAmount = 1e18; // 1 token
    
    /// @notice Maximum amount per single mint
    uint256 public maxMintAmount = 1_000_000e18; // 1M tokens

    // ═══════════════════════════════════════════════════════════════════
    // EIP-712 TYPEHASH
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice EIP-712 typehash for MintRequest
    /// MintRequest(address to,uint256 amount,bytes32 actionId,bytes32 evidenceHash,uint32 policyVersion,uint64 validAfter,uint64 validBefore,uint256 nonce)
    bytes32 public constant MINT_TYPEHASH = keccak256(
        "MintRequest(address to,uint256 amount,bytes32 actionId,bytes32 evidenceHash,uint32 policyVersion,uint64 validAfter,uint64 validBefore,uint256 nonce)"
    );

    // ═══════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════
    
    event MintAuthorized(
        address indexed to,
        uint256 amount,
        bytes32 indexed actionId,
        bytes32 evidenceHash,
        uint32 policyVersion,
        uint64 validAfter,
        uint64 validBefore,
        uint256 nonce,
        address indexed signer
    );

    event EpochParamsUpdated(
        uint256 epochDurationSec, 
        uint256 epochMintCap, 
        uint256 userEpochCap
    );
    
    event MintingEnabledUpdated(bool enabled);
    event PolicyVersionUpdated(uint32 newVersion);
    event MintLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);

    // ═══════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════
    
    error MintingDisabled();
    error InvalidRecipient();
    error InvalidAmount();
    error AmountBelowMinimum(uint256 amount, uint256 minimum);
    error AmountAboveMaximum(uint256 amount, uint256 maximum);
    error RequestTooEarly(uint64 validAfter, uint256 currentTime);
    error RequestExpired(uint64 validBefore, uint256 currentTime);
    error ActionAlreadyMinted(bytes32 actionId);
    error InvalidNonce(uint256 expected, uint256 provided);
    error InvalidSigner(address recovered);
    error PolicyVersionMismatch(uint32 expected, uint32 provided);
    error EpochCapExceeded(uint256 requested, uint256 remaining);
    error UserEpochCapExceeded(uint256 requested, uint256 remaining);
    error EpochDurationTooShort(uint256 provided, uint256 minimum);

    // ═══════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 epochMintCap_,
        uint256 userEpochCap_,
        address admin_
    ) 
        ERC20(name_, symbol_) 
        ERC20Permit(name_)
        EIP712("FUNMoney-PPLP", "1") 
    {
        require(admin_ != address(0), "Invalid admin");
        
        _grantRole(ADMIN_ROLE, admin_);
        _grantRole(PAUSER_ROLE, admin_);
        _grantRole(GOVERNOR_ROLE, admin_);
        
        epochMintCap = epochMintCap_;
        userEpochCap = userEpochCap_;
    }

    // ═══════════════════════════════════════════════════════════════════
    // ADMIN CONTROLS
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Enable or disable minting
    function setMintingEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        mintingEnabled = enabled;
        emit MintingEnabledUpdated(enabled);
    }

    /// @notice Update epoch parameters
    function setEpochParams(
        uint256 durationSec, 
        uint256 epochCap, 
        uint256 perUserCap
    ) external onlyRole(GOVERNOR_ROLE) {
        if (durationSec < 1 hours) {
            revert EpochDurationTooShort(durationSec, 1 hours);
        }
        
        epochDurationSec = durationSec;
        epochMintCap = epochCap;
        userEpochCap = perUserCap;
        
        emit EpochParamsUpdated(durationSec, epochCap, perUserCap);
    }

    /// @notice Update mint amount limits
    function setMintLimits(
        uint256 minAmount, 
        uint256 maxAmount
    ) external onlyRole(GOVERNOR_ROLE) {
        require(minAmount <= maxAmount, "min > max");
        minMintAmount = minAmount;
        maxMintAmount = maxAmount;
        emit MintLimitsUpdated(minAmount, maxAmount);
    }

    /// @notice Update policy version (invalidates old signatures)
    function setPolicyVersion(uint32 newVersion) external onlyRole(GOVERNOR_ROLE) {
        require(newVersion > currentPolicyVersion, "Version must increase");
        currentPolicyVersion = newVersion;
        emit PolicyVersionUpdated(newVersion);
    }

    /// @notice Add a trusted PPLP signer
    function grantSigner(address signer) external onlyRole(ADMIN_ROLE) {
        require(signer != address(0), "Invalid signer");
        _grantRole(SIGNER_ROLE, signer);
        emit SignerAdded(signer);
    }

    /// @notice Remove a PPLP signer
    function revokeSigner(address signer) external onlyRole(ADMIN_ROLE) {
        _revokeRole(SIGNER_ROLE, signer);
        emit SignerRemoved(signer);
    }

    /// @notice Pause all transfers (emergency)
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Unpause transfers
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════
    // CORE MINT WITH SIGNATURE
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Mint request structure
    struct MintRequest {
        address to;
        uint256 amount;
        bytes32 actionId;
        bytes32 evidenceHash;
        uint32 policyVersion;
        uint64 validAfter;
        uint64 validBefore;
        uint256 nonce;
    }

    /// @notice Mint tokens with a signed authorization from PPLP
    /// @param req The mint request parameters
    /// @param signature EIP-712 signature from authorized signer
    function mintWithSignature(
        MintRequest calldata req, 
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        // Basic validation
        if (!mintingEnabled) revert MintingDisabled();
        if (req.to == address(0)) revert InvalidRecipient();
        if (req.amount == 0) revert InvalidAmount();
        if (req.amount < minMintAmount) revert AmountBelowMinimum(req.amount, minMintAmount);
        if (req.amount > maxMintAmount) revert AmountAboveMaximum(req.amount, maxMintAmount);

        // Time window validation
        if (block.timestamp < req.validAfter) {
            revert RequestTooEarly(req.validAfter, block.timestamp);
        }
        if (block.timestamp > req.validBefore) {
            revert RequestExpired(req.validBefore, block.timestamp);
        }

        // Policy version check
        if (req.policyVersion != currentPolicyVersion) {
            revert PolicyVersionMismatch(currentPolicyVersion, req.policyVersion);
        }

        // Replay protection: actionId only once (idempotent)
        if (mintedAction[req.actionId]) {
            revert ActionAlreadyMinted(req.actionId);
        }

        // Nonce check per user
        if (req.nonce != mintNonces[req.to]) {
            revert InvalidNonce(mintNonces[req.to], req.nonce);
        }

        // Verify EIP-712 signature
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            MINT_TYPEHASH,
            req.to,
            req.amount,
            req.actionId,
            req.evidenceHash,
            req.policyVersion,
            req.validAfter,
            req.validBefore,
            req.nonce
        )));
        
        address recovered = digest.recover(signature);
        if (!hasRole(SIGNER_ROLE, recovered)) {
            revert InvalidSigner(recovered);
        }

        // Epoch caps
        uint256 epoch = block.timestamp / epochDurationSec;
        
        uint256 remainingEpochCap = epochMintCap > mintedInEpoch[epoch] 
            ? epochMintCap - mintedInEpoch[epoch] 
            : 0;
        if (req.amount > remainingEpochCap) {
            revert EpochCapExceeded(req.amount, remainingEpochCap);
        }

        uint256 remainingUserCap = userEpochCap > userMintedInEpoch[epoch][req.to]
            ? userEpochCap - userMintedInEpoch[epoch][req.to]
            : 0;
        if (req.amount > remainingUserCap) {
            revert UserEpochCapExceeded(req.amount, remainingUserCap);
        }

        // State updates (before external call for CEI pattern)
        mintedAction[req.actionId] = true;
        mintNonces[req.to] += 1;
        mintedInEpoch[epoch] += req.amount;
        userMintedInEpoch[epoch][req.to] += req.amount;

        // Mint tokens
        _mint(req.to, req.amount);

        emit MintAuthorized(
            req.to,
            req.amount,
            req.actionId,
            req.evidenceHash,
            req.policyVersion,
            req.validAfter,
            req.validBefore,
            req.nonce,
            recovered
        );
    }

    // ═══════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Get current epoch number
    function currentEpoch() external view returns (uint256) {
        return block.timestamp / epochDurationSec;
    }

    /// @notice Get remaining epoch mint capacity
    function remainingEpochCapacity() external view returns (uint256) {
        uint256 epoch = block.timestamp / epochDurationSec;
        return epochMintCap > mintedInEpoch[epoch] 
            ? epochMintCap - mintedInEpoch[epoch] 
            : 0;
    }

    /// @notice Get remaining user epoch capacity
    function remainingUserCapacity(address user) external view returns (uint256) {
        uint256 epoch = block.timestamp / epochDurationSec;
        return userEpochCap > userMintedInEpoch[epoch][user]
            ? userEpochCap - userMintedInEpoch[epoch][user]
            : 0;
    }

    /// @notice Check if an action has been minted
    function isActionMinted(bytes32 actionId) external view returns (bool) {
        return mintedAction[actionId];
    }

    /// @notice Get the current nonce for a user
    function getNonce(address user) external view returns (uint256) {
        return mintNonces[user];
    }

    /// @notice Get domain separator for EIP-712
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ═══════════════════════════════════════════════════════════════════
    // OVERRIDES
    // ═══════════════════════════════════════════════════════════════════
    
    /// @notice Override transfer to respect pause
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
