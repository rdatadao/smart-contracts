// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "./IRDataVesting.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title Storage for RDataVesting
 * @notice For future upgrades, do not change RDataVestingStorageV1. Create a new
 * contract which implements RDataVestingStorageV1 and following the naming convention
 * RDataVestingStorageVX.
 */
abstract contract RDataVestingStorageV1 is IRDataVesting {
    address public override signerWalletAddress;
    IERC20 public override rdat;

    mapping(uint256 => uint256) public override userclaimAmounts;

}
