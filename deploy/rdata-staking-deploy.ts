import { ethers, upgrades } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers";


// base
const rdatAddress = '0x4498cd8Ba045E00673402353f5a4347562707e7D';
const backendWallet = '0xE2359d7e4C7a51448BBaBaabA36648e41f058dbD';
const ownerAddress = '0x7EC35BA4391555BE65131345DeE6c1275Ed1E648';
const minStakeAmount = parseEther("500");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const rDataStakingDeploy = await upgrades.deployProxy(
		await ethers.getContractFactory("RDataReferralStaking"),
		[
			rdatAddress,
			backendWallet,
			ownerAddress,
			minStakeAmount
		],
		{
			kind: "uups"
		}
		);

	const rDataStaking = await ethers.getContractAt(
		"RDataReferralStaking",
		rDataStakingDeploy.target
	);

	console.log("RDataStaking deployed at:", rDataStakingDeploy.target);
};

export default func;
func.tags = ["RDataStaking"];
