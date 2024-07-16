// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/RDataReferralStakingStorageV1.sol";

contract RDataReferralStaking is
    UUPSUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    RDataReferralStakingStorageV1
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /**
     * @notice Triggered when a user has staked some RDAT
     *
     * @param stakerAddress                      address of the staker
     * @param amount                             amount staked in this call
     * @param totalAmount                        total amount staked by the user
     */
    event Staked(
        address indexed stakerAddress,
        uint256 amount,
        uint256 totalAmount
    );
    using MessageHashUtils for bytes32;

    /**
     * @notice Triggered when a user has unstaked some RDAT
     *
     * @param stakerAddress                      address of the staker
     * @param amount                             amount unstaked
     */
    event Unstaked(address indexed stakerAddress, uint256 amount);

    error InvalidSignature();

    error NothingToUnstake();

    error AlreadyStaked();

    error AlreadyUnstaked();

    error InvalidStakeAmount();

    error InvalidUnstakeAmount();

    /**
     * @notice Used to initialize a new RdataStaking contract
     *
     * @param _rdatAddress            Address of the rdat token
     * @param _signerWalletAddress    Address of the backend wallet
     * @param _ownerAddress           Address of the owner
    * @param _minStakeAmount         Minimum amount to stake
     */
    function initialize(
        address _rdatAddress,
        address _signerWalletAddress,
        address _ownerAddress,
        uint256 _minStakeAmount
    ) external initializer {
        __Ownable_init(_ownerAddress);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init_unchained();

        rdat = IERC20(_rdatAddress);
        signerWalletAddress = _signerWalletAddress;

        minStakeAmount = _minStakeAmount;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    /**
     * @notice Returns the voting power of a user
     *
     * @param userAddress           address of the user
     */
    function votingPower(address userAddress) external view returns (uint256) {
        Staker memory _staker = stakers[userAddress];
        return _staker.amount > _staker.unstakedAmount ? _staker.amount - _staker.unstakedAmount : 0;
    }

    /**
     * @dev Pauses the contract
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /** Updates the address of the backend wallet
     *
     * @param _newSignerWalletAddress address of the new backend wallet
     */
    function updateSignerWalletAddress(
        address _newSignerWalletAddress
    ) external override onlyOwner {
        signerWalletAddress = _newSignerWalletAddress;
    }

    /**
     * @notice Allows users to stake
     *
     * @param _amount             amount to be staked
     */
    function stake(
        uint256 _amount
    ) external override whenNotPaused nonReentrant {
        Staker storage _staker = stakers[msg.sender];

        if (_amount < minStakeAmount) {
            revert InvalidStakeAmount();
        }

        // if (_staker.amount > 0) {
        //     revert AlreadyStaked();
        // }

        if (_staker.unstakedAmount > 0) {
            revert AlreadyUnstaked();
        }

        rdat.safeTransferFrom(msg.sender, address(this), _amount);

        _staker.amount += _amount;

        emit Staked(msg.sender, _amount, _staker.amount);
    }

    /**
     * @notice Allows users to claim their staking
     *
     * @param _stakerAddress      address of the staker
     * @param _amount             amount to be unstaked
     * @param _signatures         backend signature
     */
    function unstake(
        address _stakerAddress,
        uint256 _amount,
        bytes calldata _signatures
    ) external override whenNotPaused {
        Staker storage _staker = stakers[_stakerAddress];

        if (_staker.unstakedAmount > 0) {
            revert AlreadyUnstaked();
        }

        if (_staker.amount != _amount) {
            revert InvalidUnstakeAmount();
        }

        bytes32 _messageHash = keccak256(
            abi.encodePacked(_stakerAddress, _amount)
        );

//        if (
//            signerWalletAddress !=
//            _messageHash.toEthSignedMessageHash().recover(_signatures)
//        ) {
//            revert InvalidSignature();
//        }

        _staker.unstakedAmount = _amount;

        rdat.safeTransfer(_stakerAddress, _amount);

        emit Unstaked(_stakerAddress, _amount);
    }
}
