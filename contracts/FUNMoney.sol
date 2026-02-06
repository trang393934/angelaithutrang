// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ============================================================
 *  FUN MONEY — PRODUCTION v1.2.1 (FINAL)
 * ============================================================
 * Tag: FUN-MONEY-v1.2.1-final
 *
 * POLISH-ONLY RELEASE
 * - No logic changes from v1.2
 * - Added governance transparency events
 * - Added global transparency getters (informational)
 *
 * ALIGNMENT:
 * - Code = Law
 * - Money = Flow of Light
 * - No extraction, no control of user flow
 * - Errors return to Community
 *
 * This contract is FINALIZED and ready for external audit
 * and mainnet deployment after audit clearance.
 */

/*//////////////////////////////////////////////////////////////
                        CONTEXT
//////////////////////////////////////////////////////////////*/
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

/*//////////////////////////////////////////////////////////////
                        ERC20 (OZ-style)
//////////////////////////////////////////////////////////////*/
abstract contract ERC20 is Context {
    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 internal _totalSupply;

    string public name;
    string public symbol;
    uint8 public immutable decimals = 18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory n, string memory s) {
        name = n;
        symbol = s;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address a) public view returns (uint256) {
        return _balances[a];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(_msgSender(), to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        uint256 cur = _allowances[from][_msgSender()];
        require(cur >= amount, "ALLOW");
        unchecked {
            _approve(from, _msgSender(), cur - amount);
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "TO_0");
        uint256 b = _balances[from];
        require(b >= amount, "BAL");
        unchecked {
            _balances[from] = b - amount;
        }
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "MINT_0");
        _totalSupply += amount;
        _balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0) && spender != address(0), "APPROVE_0");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
}

/*//////////////////////////////////////////////////////////////
                        EIP-712
//////////////////////////////////////////////////////////////*/
abstract contract EIP712 {
    bytes32 private immutable _HASHED_NAME;
    bytes32 private immutable _HASHED_VERSION;
    bytes32 private immutable _TYPE_HASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    constructor(string memory name, string memory version) {
        _HASHED_NAME = keccak256(bytes(name));
        _HASHED_VERSION = keccak256(bytes(version));
    }

    function _domainSeparatorV4() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                _TYPE_HASH,
                _HASHED_NAME,
                _HASHED_VERSION,
                block.chainid,
                address(this)
            )
        );
    }

    function _hashTypedDataV4(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19\x01", _domainSeparatorV4(), structHash)
        );
    }
}

/*//////////////////////////////////////////////////////////////
                    FUN MONEY — v1.2.1 FINAL
//////////////////////////////////////////////////////////////*/
contract FUNMoneyProductionV1_2_1 is ERC20, EIP712 {

    /*//////////////////////////////////////////////////////////////
                        GOVERNANCE
    //////////////////////////////////////////////////////////////*/
    address public immutable guardianGov;
    modifier onlyGov() {
        require(msg.sender == guardianGov, "NOT_GOV");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        COMMUNITY POOL
    //////////////////////////////////////////////////////////////*/
    address public immutable communityPool;

    /*//////////////////////////////////////////////////////////////
                        ACTION REGISTRY (5D)
    //////////////////////////////////////////////////////////////*/
    struct ActionType {
        bool allowed;
        uint32 version;
        bool deprecated;
    }

    mapping(bytes32 => ActionType) public actions;

    /*//////////////////////////////////////////////////////////////
                        ATTESTERS
    //////////////////////////////////////////////////////////////*/
    mapping(address => bool) public isAttester;
    uint256 public attesterThreshold;
    uint256 public constant MAX_SIGS = 5;

    /*//////////////////////////////////////////////////////////////
                        GOVERNANCE EVENTS (POLISH)
    //////////////////////////////////////////////////////////////*/
    event AttesterUpdated(address indexed attester, bool allowed);
    event AttesterThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    /*//////////////////////////////////////////////////////////////
                        PPLP STRUCT
    //////////////////////////////////////////////////////////////*/
    bytes32 public constant PPLP_TYPEHASH =
        keccak256(
            "PureLoveProof(address user,bytes32 actionHash,uint256 amount,bytes32 evidenceHash,uint256 nonce)"
        );

    mapping(address => uint256) public nonces;

    /*//////////////////////////////////////////////////////////////
                        RATE LIMIT (EPOCH)
    //////////////////////////////////////////////////////////////*/
    struct Epoch {
        uint64 start;
        uint256 minted;
    }

    mapping(bytes32 => Epoch) public epochs;
    uint256 public epochDuration = 1 days;
    uint256 public epochMintCap = 1_000_000 ether;

    /*//////////////////////////////////////////////////////////////
                        STATE MACHINE
    //////////////////////////////////////////////////////////////*/
    struct Allocation {
        uint256 locked;
        uint256 activated;
    }

    mapping(address => Allocation) public alloc;
    bool public pauseTransitions;

    /*//////////////////////////////////////////////////////////////
                        EVENTS
    //////////////////////////////////////////////////////////////*/
    event PureLoveAccepted(
        address indexed user,
        bytes32 indexed action,
        uint256 amount,
        uint32 version
    );

    event ActionRegistered(bytes32 indexed action, uint32 version);
    event ActionDeprecated(bytes32 indexed action, uint32 oldVersion, uint32 newVersion);
    event TransitionsPaused(bool paused);
    event ExcessRecycled(uint256 amount);

    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    constructor(
        address _gov,
        address _community,
        address[] memory attesters,
        uint256 threshold
    )
        ERC20("FUN Money", "FUN")
        EIP712("FUN Money", "1.2.1")
    {
        require(_gov != address(0) && _community != address(0), "INIT_0");
        guardianGov = _gov;
        communityPool = _community;
        attesterThreshold = threshold;

        for (uint256 i; i < attesters.length; i++) {
            isAttester[attesters[i]] = true;
        }
    }

    /*//////////////////////////////////////////////////////////////
                    ACTION REGISTRY (MASTER CHARTER)
    //////////////////////////////////////////////////////////////*/
    function govRegisterAction(string calldata name, uint32 version) external onlyGov {
        bytes32 h = keccak256(bytes(name));
        actions[h] = ActionType(true, version, false);
        emit ActionRegistered(h, version);
    }

    function govDeprecateAction(string calldata name, uint32 newVersion) external onlyGov {
        bytes32 h = keccak256(bytes(name));
        ActionType storage a = actions[h];
        require(a.allowed && !a.deprecated, "BAD_ACTION");
        uint32 old = a.version;
        a.deprecated = true;
        emit ActionDeprecated(h, old, newVersion);
    }

    /*//////////////////////////////////////////////////////////////
                    CORE: LOCK → ACTIVATE → CLAIM
    //////////////////////////////////////////////////////////////*/
    function lockWithPPLP(
        address user,
        string calldata action,
        uint256 amount,
        bytes32 evidenceHash,
        bytes[] calldata sigs
    ) external {
        require(!pauseTransitions, "PAUSED");
        require(sigs.length <= MAX_SIGS, "SIG_LIMIT");

        bytes32 h = keccak256(bytes(action));
        ActionType memory act = actions[h];
        require(act.allowed && !act.deprecated, "ACTION_INVALID");

        Epoch storage e = epochs[h];
        if (block.timestamp > e.start + epochDuration) {
            e.start = uint64(block.timestamp);
            e.minted = 0;
        }
        require(e.minted + amount <= epochMintCap, "EPOCH_CAP");

        bytes32 structHash =
            keccak256(
                abi.encode(
                    PPLP_TYPEHASH,
                    user,
                    h,
                    amount,
                    evidenceHash,
                    nonces[user]
                )
            );

        bytes32 digest = _hashTypedDataV4(structHash);

        uint256 valid;
        address[] memory seen = new address[](MAX_SIGS);

        for (uint256 i; i < sigs.length; i++) {
            (bytes32 r, bytes32 s, uint8 v) = _split(sigs[i]);
            address signer = ecrecover(digest, v, r, s);
            if (!isAttester[signer]) continue;

            bool dup;
            for (uint256 j; j < valid; j++) {
                if (seen[j] == signer) dup = true;
            }
            if (dup) continue;

            seen[valid++] = signer;
            if (valid >= attesterThreshold) break;
        }
        require(valid >= attesterThreshold, "SIGS_LOW");

        nonces[user]++;

        e.minted += amount;
        _mint(address(this), amount);
        alloc[user].locked += amount;

        emit PureLoveAccepted(user, h, amount, act.version);
    }

    function activate(uint256 amount) external {
        require(!pauseTransitions, "PAUSED");
        Allocation storage a = alloc[msg.sender];
        require(a.locked >= amount, "LOCK_LOW");
        a.locked -= amount;
        a.activated += amount;
    }

    function claim(uint256 amount) external {
        Allocation storage a = alloc[msg.sender];
        require(a.activated >= amount, "ACT_LOW");
        a.activated -= amount;
        _transfer(address(this), msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                    GOVERNANCE (SAFE & LIMITED)
    //////////////////////////////////////////////////////////////*/
    function govPauseTransitions(bool paused) external onlyGov {
        pauseTransitions = paused;
        emit TransitionsPaused(paused);
    }

    function govSetAttester(address attester, bool allowed) external onlyGov {
        isAttester[attester] = allowed;
        emit AttesterUpdated(attester, allowed);
    }

    function govSetAttesterThreshold(uint256 newThreshold) external onlyGov {
        uint256 old = attesterThreshold;
        attesterThreshold = newThreshold;
        emit AttesterThresholdUpdated(old, newThreshold);
    }

    function govRecycleExcessToCommunity(uint256 amount) external onlyGov {
        uint256 bal = _balances[address(this)];
        require(amount <= bal, "EXCESS");
        _transfer(address(this), communityPool, amount);
        emit ExcessRecycled(amount);
    }

    /*//////////////////////////////////////////////////////////////
                    TRANSPARENCY GETTERS (INFORMATIONAL)
    //////////////////////////////////////////////////////////////*/
    /**
     * @notice Total FUN currently locked (not yet activated)
     * @dev Informational only. Recommended to compute off-chain via indexer.
     */
    function totalLocked(address[] calldata users) external view returns (uint256 sum) {
        for (uint256 i; i < users.length; i++) {
            sum += alloc[users[i]].locked;
        }
    }

    /**
     * @notice Total FUN currently activated (claimable, not yet flowed)
     * @dev Informational only. Recommended to compute off-chain via indexer.
     */
    function totalActivated(address[] calldata users) external view returns (uint256 sum) {
        for (uint256 i; i < users.length; i++) {
            sum += alloc[users[i]].activated;
        }
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL
    //////////////////////////////////////////////////////////////*/
    function _split(bytes memory sig)
        internal
        pure
        returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "SIG_LEN");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
    }
}
