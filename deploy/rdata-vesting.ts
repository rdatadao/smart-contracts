import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rdat = await ethers.deployContract("Rdat");

	await rdat.waitForDeployment();

	console.log("RDat token deployed at:", rdat.target);
	return;

	const rDataVestingDeploy = await upgrades.deployProxy(
		await ethers.getContractFactory("RDataVesting"),
		[
			rdat.target,
			process.env.BACKEND_WALLET_ADDRESS
		],
		{
			kind: "uups"
		}
		);

	const rDataVesting = await ethers.getContractAt(
		"RDataVesting",
		rDataVestingDeploy.target
	);

	console.log("RDataVesting deployed at:", rDataVestingDeploy.target);
};

export default func;
func.tags = ["RDataVesting"];
