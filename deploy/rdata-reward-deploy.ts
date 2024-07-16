import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rdat = await ethers.deployContract("Rdat", [process.env.OWNER_ADDRESS]);

	await rdat.waitForDeployment();

	console.log("RDat token deployed at:", rdat.target);

	// const rdatReward = await ethers.deployContract("RDataReward");

	// await rdat.waitForDeployment();

	// console.log("RDat token deployed at:", rdat.target);
	// return;

	const rDataRewardDeploy = await upgrades.deployProxy(
		await ethers.getContractFactory("RDataReward"),
		[
			rdat.target,
			process.env.BACKEND_WALLET_ADDRESS
		],
		{
			kind: "uups"
		}
		);

	const rDataReward = await ethers.getContractAt(
		"RDataReward",
		rDataRewardDeploy.target
	);

	console.log("RDataReward deployed at:", rDataRewardDeploy.target);
};

export default func;
func.tags = ["RDataReward"];
