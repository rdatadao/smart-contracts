// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRDataReferralStaking {
    struct Staker {
        uint256 amount;
        uint256 unstakedAmount;
    }
    function signerWalletAddress() external view returns(address);
    function minStakeAmount() external view returns(uint256);
    function rdat() external view returns(IERC20);
    function updateSignerWalletAddress(address newSignerAddress) external;
    function stakers(address stakers) external view returns(uint256 amount, uint256 unstakedAmount);
    function stake(uint256 _amount) external;
    function unstake(address stakerAddress, uint256 amount, bytes calldata signatures) external;
}
