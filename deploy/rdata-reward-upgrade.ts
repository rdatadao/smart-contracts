import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rDataRewardDeploy = await upgrades.upgradeProxy(
		'0x504f5456229676906c7406419169874f02329665',
		await ethers.getContractFactory("RDataReward"),
	);

	const rDataReward = await ethers.getContractAt(
		"RDataReward",
		rDataRewardDeploy.target
	);

	console.log("RDataReward deployed at:", rDataRewardDeploy.target);
};

export default func;
func.tags = ["RDataRewardUpgrade"];
