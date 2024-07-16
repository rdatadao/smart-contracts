// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/RDataRewardStorageV1.sol";

contract RDataReward is
    UUPSUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    RDataRewardStorageV1
{
    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /**
     * @notice Triggered when a reward has been claimed
     *
     * @param userId             user identification
     * @param receiveAddress     address where the reward will be send
     * @param claimAmount        amount sent to the receive
     * @param totalAmount        total amount gained by the user
     */
    event Claimed(
        uint256 indexed userId,
        address indexed receiveAddress,
        uint256 claimAmount,
        uint256 totalAmount
    );

    error InvalidSignature();

    error AlreadyClaimed();

    error SignatureExpired();

    /**
     * @notice Used to initialize a new RdataReward contract
     *
     * @param _rdatAddress            Address of the rdat token
     * @param _signerWalletAddress    Address of the backend wallet
     */
    function initialize(
        address _rdatAddress,
        address _signerWalletAddress
    ) external initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init_unchained();

        rdat = IERC20(_rdatAddress);
        signerWalletAddress = _signerWalletAddress;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

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
     * @notice Allows users to claim their reward
     *
     * @param _userId             user identification
     * @param _receiveAddress    address where the reward will be send
     * @param _amount             amount gained by the user
     * @param _deadline           deadline for the signature valability
     * @param _signatures         bakend signature
     */
    function claim(
        uint256 _userId,
        address _receiveAddress,
        uint256 _amount,
        uint256 _deadline,
        bytes calldata _signatures
    ) external override whenNotPaused nonReentrant {
        bytes32 _messageHash = keccak256(
            abi.encodePacked(_userId, _receiveAddress, _amount, _deadline)
        );

        if (
            signerWalletAddress !=
            _messageHash.toEthSignedMessageHash().recover(_signatures)
        ) {
            revert InvalidSignature();
        }

        if (_amount <= userClaimAmounts[_userId]) {
            revert AlreadyClaimed();
        }

        if (_deadline <= block.timestamp) {
            revert SignatureExpired();
        }

        uint256 _diffAmount = _amount - userClaimAmounts[_userId];

        userClaimAmounts[_userId] = _amount;

        rdat.safeTransfer(_receiveAddress, _diffAmount);

        emit Claimed(_userId, _receiveAddress, _diffAmount, _amount);
    }

    /**
     * @notice Allows the owner to withdraw tokens from the contract
     *
     * @param _token    address of the token to withdraw use address(0) for ETH
     * @param _to       address where the token will be send
     * @param _amount   amount to withdraw
     */
    function withdraw(
        address _token,
        address _to,
        uint256 _amount
    ) public onlyOwner nonReentrant returns (bool success) {
        bool _result;

        if (_token == address(0)) {
            (_result, ) = _to.call{value: _amount}("");
            return _result;
        } else {
            IERC20(_token).safeTransfer(_to, _amount);
            _result = true;
        }

        return _result;
    }
}
