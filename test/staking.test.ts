import chai, { should } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import { BigNumberish, parseEther } from "ethers";
import { Rdat, RDataStaking } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

chai.use(chaiAsPromised);
should();

describe("RDataStakingStaking", () => {
  let deployer: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let backendWallet: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;

  let rdat: Rdat;
  let staking: RDataStaking;

  const initialStakingBalance = parseEther('1000000');
  const initialUser1Balance = parseEther('10000');
  const initialUser2Balance = parseEther('20000');
  const initialUser3Balance = parseEther('30000');

  const minStakeAmount = parseEther('50');

  const deploy = async () => {
    [deployer, owner, backendWallet, user1, user2, user3, user4] = await ethers.getSigners();

    rdat = await ethers.deployContract("Rdat", [owner.address]);
    await rdat.waitForDeployment();


    const rDataStakingDeploy = await upgrades.deployProxy(
      await ethers.getContractFactory("RDataReferralStaking"),
      [
        rdat.target,
        backendWallet.address,
        owner.address,
        minStakeAmount,
      ],
      {
        kind: "uups"
      }
    );

    staking = await ethers.getContractAt(
      "RDataReferralStaking",
      rDataStakingDeploy.target
    );

    await rdat.connect(owner).mint(staking, initialStakingBalance);
    await rdat.connect(owner).mint(user1, initialUser1Balance);
    await rdat.connect(owner).mint(user2, initialUser2Balance);
    await rdat.connect(owner).mint(user3, initialUser3Balance);

    await rdat.connect(user1).approve(staking, initialUser1Balance);
    await rdat.connect(user2).approve(staking, initialUser2Balance);
    await rdat.connect(user3).approve(staking, initialUser3Balance);
  }

  async function signParams(
    signer: HardhatEthersSigner,
    staker: HardhatEthersSigner,
    amount: BigNumberish,
  ): Promise<string> {
    const hash = ethers.solidityPackedKeccak256(
      ["address", "uint256"],
      [staker.address, amount]
    );

    return signer.signMessage(ethers.getBytes(hash));
  }

  describe("Staking - basic", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();
    });

    it("should have correct params after deploy", async function () {
      (await staking.owner()).should.eq(owner);
      (await staking.rdat()).should.eq(rdat);
      (await staking.signerWalletAddress()).should.eq(backendWallet);
    });

    it("Should update signerWallet if owner", async function () {
      await staking.connect(owner).updateSignerWalletAddress(user2.address).should.be.fulfilled;
      (await staking.signerWalletAddress()).should.eq(user2.address);
    });

    it("Should not update signerWallet if not owner", async function () {
      await staking.connect(backendWallet)
        .updateSignerWalletAddress(user2)
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${backendWallet.address}")`
        );
      (await staking.signerWalletAddress()).should.be.equal(
        backendWallet.address
      );
    });

    it("Should pause if owner", async function () {
      await staking.connect(owner).pause().should.be.fulfilled;
      (await staking.paused()).should.be.equal(true);
    });

    it("Should not pause if not owner", async function () {
      await staking.connect(backendWallet)
        .pause()
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${backendWallet.address}")`
        );
      (await staking.paused()).should.be.equal(false);
    });

    it("Should unpause if owner", async function () {
      await staking.connect(owner).pause();
      await staking.connect(owner).unpause().should.be.fulfilled;
      (await staking.paused()).should.be.equal(false);
    });

    it("Should not unpause if not owner", async function () {
      await staking.connect(owner).pause();
      await staking.connect(backendWallet)
        .unpause()
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${backendWallet.address}")`
        );
      (await staking.paused()).should.be.equal(true);
    });
  });

  describe("Staking - staking", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();
    });

    it("Should stake", async function () {
      const user1StakeAmount1 = parseEther("100");

      await staking.connect(user1)
          .stake(user1StakeAmount1)
          .should.emit(staking, "Staked")
          .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      const staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);
    });

    it("Should stake multiple times", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1StakeAmount2 = parseEther("200");
      const user1StakeAmount = user1StakeAmount1 + user1StakeAmount2;

      await staking.connect(user1)
          .stake(user1StakeAmount1)
          .should.emit(staking, "Staked")
          .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
          .stake(user1StakeAmount2)
          .should.emit(staking, "Staked")
          .withArgs(user1.address, user1StakeAmount2, user1StakeAmount);

      staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount);
    });

    it("Should not stake if paused", async function () {
      await staking.connect(owner).pause();

      const user1StakeAmount1 = parseEther("100");

      await staking.connect(user1)
          .stake(user1StakeAmount1)
          .should.be.rejectedWith('EnforcedPause()');
    });

    it("Should not stake less than minStakeAmount", async function () {
      const user1StakeAmount1 = minStakeAmount - 1n;

      await rdat.connect(user1).approve(staking, user1StakeAmount1);

      await staking.connect(user1)
          .stake(user1StakeAmount1)
          .should.be.rejectedWith('InvalidStakeAmount()');
    });

    it("Should not stake after unstaking", async function () {
        const user1StakeAmount1 = parseEther("100");
        const user1UnstakeAmount1 = parseEther("100");

        await staking.connect(user1)
            .stake(user1StakeAmount1)
            .should.emit(staking, "Staked")
            .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

        await staking.connect(user1)
            .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
            .should.emit(staking, "Unstaked")
            .withArgs(user1.address, user1UnstakeAmount1);

        await staking.connect(user1)
            .stake(user1StakeAmount1)
            .should.be.rejectedWith('AlreadyUnstaked()');
    });
  });

  describe("Staking - unstake", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();
    });

    it("Should unstake same amount", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("100");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.emit(staking, "Unstaked")
        .withArgs(user1.address, user1UnstakeAmount1);

      staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(user1UnstakeAmount1);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1 + user1UnstakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1 - user1UnstakeAmount1);
    });

    xit("Should unstake less amount", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("80");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.emit(staking, "Unstaked")
        .withArgs(user1.address, user1UnstakeAmount1);

      staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(user1UnstakeAmount1);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1 + user1UnstakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1 - user1UnstakeAmount1);
    });

    xit("Should unstake more amount", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("120");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.emit(staking, "Unstaked")
        .withArgs(user1.address, user1UnstakeAmount1);

      staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(user1UnstakeAmount1);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1 + user1UnstakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1 - user1UnstakeAmount1);
    });

    it("Should not unstake twice with same signature", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("100");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.emit(staking, "Unstaked")
        .withArgs(user1.address, user1UnstakeAmount1);

      staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(user1UnstakeAmount1);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1 + user1UnstakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1 - user1UnstakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.be.rejectedWith('AlreadyUnstaked()')
    });

    it("Should not unstake twice with different signature", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("100");
      const user1UnstakeAmount2 = parseEther("140");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.emit(staking, "Unstaked")
        .withArgs(user1.address, user1UnstakeAmount1);

      staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(user1UnstakeAmount1);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1 + user1UnstakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1 - user1UnstakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount2))
        .should.be.rejectedWith('AlreadyUnstaked()')
    });

    xit("Should not unstake with wrong signature", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("120");
      const user1UnstakeAmount2 = parseEther("140");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount2, signParams(backendWallet, user1, user1UnstakeAmount1))
        .should.be.rejectedWith('InvalidSignature()')
    });

    it("Should unstake with wrong signature", async function () {
      const user1StakeAmount1 = parseEther("100");
      const user1UnstakeAmount1 = parseEther("100");

      await staking.connect(user1)
        .stake(user1StakeAmount1)
        .should.emit(staking, "Staked")
        .withArgs(user1.address, user1StakeAmount1, user1StakeAmount1);

      let staker1 = await staking.stakers(user1);

      staker1.amount.should.eq(user1StakeAmount1);
      staker1.unstakedAmount.should.eq(0);

      (await rdat.balanceOf(user1)).should.eq(initialUser1Balance - user1StakeAmount1);
      (await rdat.balanceOf(staking)).should.eq(initialStakingBalance + user1StakeAmount1);

      await staking.connect(user1)
        .unstake(user1, user1UnstakeAmount1, signParams(backendWallet, user1, user1UnstakeAmount1 * 2n))
        .should.emit(staking, "Unstaked")
          .withArgs(user1.address, user1StakeAmount1);
    });
  });
});