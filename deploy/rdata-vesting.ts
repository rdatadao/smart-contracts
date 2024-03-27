import {ethers, upgrades} from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rData = await ethers.deployContract("RData");

	await rData.waitForDeployment();

	console.log("RData token deployed at:", rData.target);

	const rDataVestingDeploy = await upgrades.deployProxy(
		await ethers.getContractFactory("RDataVesting"),
		[
			rData.target,
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
