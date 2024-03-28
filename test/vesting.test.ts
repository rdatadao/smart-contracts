import chai, {should} from "chai";
import chaiAsPromised from "chai-as-promised";
import {ethers, upgrades} from "hardhat";
import {BigNumberish, parseEther} from "ethers";
import { log } from "console";
import { RData, RDataVesting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {ethers as ethersOriginal} from "ethers";

chai.use(chaiAsPromised);
should();

describe("ERC20Swapper", () => {
  let deployer: HardhatEthersSigner;
  let backendWallet: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;

  let rData: RData;
  let vesting: RDataVesting;

  const initialVestingBalance = parseEther('1000000');
  const initialUser1Balance = parseEther('10000');

  const deploy = async () => {
    [deployer, backendWallet, user1, user2, user3, user4] = await ethers.getSigners();

    rData = await ethers.deployContract("RData");
    await rData.waitForDeployment();
  
  
    const rDataVestingDeploy = await upgrades.deployProxy(
      await ethers.getContractFactory("RDataVesting"),
      [
        rData.target,
        backendWallet.address
      ],
      {
        kind: "uups"
      }
      );
  
      vesting = await ethers.getContractAt(
      "RDataVesting",
      rDataVestingDeploy.target
    );
  }

  async function signParams(
		signer: HardhatEthersSigner,
		userId: number,
		receive: HardhatEthersSigner,
		amount: BigNumberish,
		deadline: BigNumberish,
	): Promise<string> {
		const hash = ethers.solidityPackedKeccak256(
      ["uint256", "address", "uint256", "uint256"],
    [userId, receive.address, amount, deadline]
    );

		return signer.signMessage(ethers.getBytes(hash));
	}

  describe("Vesting - basic", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();
    });

    it("should have correct params after deploy", async function () {
      (await vesting.owner()).should.eq(deployer);
      (await vesting.rData()).should.eq(rData);
    });
  });

  describe("Vesting - claim", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();

      await rData.mint(vesting.target, initialVestingBalance);
    });

    it.only("Should claim reward", async function () {
			const rewardAmount = parseEther('10');
			const deadline: BigNumberish = 2222222222222222;

			const signedMessage = await signParams(
				backendWallet,
				1,
				user1,
				rewardAmount,
        deadline
			);

			const user1InitialBalance = await rData.balanceOf(
				user1.address
			);

      log(backendWallet.address)

			await vesting.connect(user1)
				.claim(
					1,
					user1.address,
					rewardAmount,
          deadline,
					signedMessage
				)
				.should.emit(vesting, "Claimed")
				.withArgs(1, user1.address, rewardAmount, rewardAmount);

			(await vesting.userClaimAmounts(1)).should.eq(rewardAmount);

			(await rData.balanceOf(user1.address)).should.eq(user1InitialBalance + rewardAmount);

			(await rData.balanceOf(vesting.target)).should.eq(initialVestingBalance - rewardAmount);
		});
  });
});