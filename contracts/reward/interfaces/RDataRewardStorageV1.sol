// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "./IRDataReward.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title Storage for RDataReward
 * @notice For future upgrades, do not change RDataRewardStorageV1. Create a new
 * contract which implements RDataRewardStorageV1 and following the naming convention
 * RDataRewardStorageVX.
 */
abstract contract RDataRewardStorageV1 is IRDataReward {
    address public override signerWalletAddress;
    IERC20 public override rdat;

    mapping(uint256 => uint256) public override userClaimAmounts;

}
