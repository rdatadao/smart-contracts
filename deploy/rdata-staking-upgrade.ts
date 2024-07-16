import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rDataRewardDeploy = await upgrades.upgradeProxy(
		'0x641A088f1a6Cf004491CBA2B72C6f40743Fb9447',
		await ethers.getContractFactory("RDataReferralStaking"),
	);

	const rDataReward = await ethers.getContractAt(
		"RDataReferralStaking",
		rDataRewardDeploy.target
	);

	console.log("RDataReward deployed at:", rDataRewardDeploy.target);
};

export default func;
func.tags = ["RDataStakingUpgrade"];
