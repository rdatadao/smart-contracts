// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "./IRDataReferralStaking.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title Storage for RDataReferralStaking
 * @notice For future upgrades, do not change RDataStakingStorageV1. Create a new
 * contract which implements RDataStakingStorageV1 and following the naming convention
 * RDataStakingStorageVX.
 */
abstract contract RDataReferralStakingStorageV1 is IRDataReferralStaking {
    address public override signerWalletAddress;
    IERC20 public override rdat;

    mapping(address => Staker) public override stakers;

    uint256 public override minStakeAmount;
}
