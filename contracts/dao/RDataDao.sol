// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.24;

// import {IGovernor, GovernorUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
// import {GovernorCountingSimpleUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
// import {GovernorVotesUpgradeableUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
// import {GovernorVotesQuorumFractionUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
// import {GovernorTimelockControlUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
// import {TimelockControllerUpgradeable} from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
// import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
// import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";

// contract RDataDao is
//     Governor,
//     GovernorCountingSimple,
//     GovernorVotes,
//     GovernorVotesQuorumFraction,
//     GovernorTimelockControl
// {
//     constructor(
//         IVotes _token,
//         TimelockController _timelock
//     ) Governor("RDataDao") GovernorVotes(_token) GovernorVotesQuorumFraction(4) GovernorTimelockControl(_timelock) {}

//     function votingDelay() public pure override returns (uint256) {
//         return 1 days; // 1 day
//     }

//     function votingPeriod() public pure override returns (uint256) {
//         return 1 weeks; // 1 week
//     }

//     function proposalThreshold() public pure override returns (uint256) {
//         return 0;
//     }

//     // The functions below are overrides required by Solidity.

//     function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
//         return super.state(proposalId);
//     }

//     function proposalNeedsQueuing(
//         uint256 proposalId
//     ) public view virtual override(Governor, GovernorTimelockControl) returns (bool) {
//         return super.proposalNeedsQueuing(proposalId);
//     }

//     function _queueOperations(
//         uint256 proposalId,
//         address[] memory targets,
//         uint256[] memory values,
//         bytes[] memory calldatas,
//         bytes32 descriptionHash
//     ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
//         return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
//     }

//     function _executeOperations(
//         uint256 proposalId,
//         address[] memory targets,
//         uint256[] memory values,
//         bytes[] memory calldatas,
//         bytes32 descriptionHash
//     ) internal override(Governor, GovernorTimelockControl) {
//         super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
//     }

//     function _cancel(
//         address[] memory targets,
//         uint256[] memory values,
//         bytes[] memory calldatas,
//         bytes32 descriptionHash
//     ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
//         return super._cancel(targets, values, calldatas, descriptionHash);
//     }

//     function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
//         return super._executor();
//     }
// }