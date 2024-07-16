import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rdatReward = await ethers.deployContract("RDataReward");

	console.log("RDataRewardImplementation deployed at:", rdatReward.target);
};

export default func;
func.tags = ["RDataRewardImplementation"];
