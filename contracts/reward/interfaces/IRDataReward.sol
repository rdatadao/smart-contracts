// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRDataReward {
    function signerWalletAddress() external view returns(address);
    function rdat() external view returns(IERC20);
    function updateSignerWalletAddress(address newSignerAddress) external;
    function userClaimAmounts(uint256 usserId) external view returns(uint256);
    function claim(
        uint256 _userId,
        address _receiveAddress,
        uint256 _amount,
        uint256 _deadline,
        bytes calldata _signatures
    ) external;
}
