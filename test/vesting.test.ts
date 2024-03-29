import chai, { should } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import { BigNumberish, parseEther } from "ethers";
import { log } from "console";
import { Rdat, RDataVesting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

chai.use(chaiAsPromised);
should();

describe("ERC20Swapper", () => {
  let deployer: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let backendWallet: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;

  let rdat: Rdat;
  let vesting: RDataVesting;

  const initialVestingBalance = parseEther('1000000');
  const initialUser1Balance = parseEther('10000');

  const deploy = async () => {
    [deployer, owner, backendWallet, user1, user2, user3, user4] = await ethers.getSigners();

    rdat = await ethers.deployContract("Rdat", [owner.address]);
    await rdat.waitForDeployment();


    const rDataVestingDeploy = await upgrades.deployProxy(
      await ethers.getContractFactory("RDataVesting"),
      [
        rdat.target,
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

    await vesting.connect(deployer).transferOwnership(owner);
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
      (await vesting.owner()).should.eq(owner);
      (await vesting.rdat()).should.eq(rdat);
    });

    it("Should update signerWallet if owner", async function () {
      await vesting.connect(owner).updateSignerWalletAddress(user2.address).should.be.fulfilled;
      (await vesting.signerWalletAddress()).should.eq(user2.address);
    });

    it("Should not update signerWallet if not owner", async function () {
      await vesting.connect(backendWallet)
        .updateSignerWalletAddress(user2)
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${backendWallet.address}")`
        );
      (await vesting.signerWalletAddress()).should.be.equal(
        backendWallet.address
      );
    });

    it("Should pause if owner", async function () {
      await vesting.connect(owner).pause().should.be.fulfilled;
      (await vesting.paused()).should.be.equal(true);
    });

    it("Should not pause if not owner", async function () {
      await vesting.connect(backendWallet)
        .pause()
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${backendWallet.address}")`
        );
      (await vesting.paused()).should.be.equal(false);
    });

    it("Should unpause if owner", async function () {
      await vesting.connect(owner).pause();
      await vesting.connect(owner).unpause().should.be.fulfilled;
      (await vesting.paused()).should.be.equal(false);
    });

    it("Should not unpause if not owner", async function () {
      await vesting.connect(owner).pause();
      await vesting.connect(backendWallet)
        .unpause()
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${backendWallet.address}")`
        );
      (await vesting.paused()).should.be.equal(true);
    });
  });

  describe("Vesting - claim", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();

      await rdat.connect(owner).mint(vesting.target, initialVestingBalance);
    });

    it("Should claim", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1815661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      const user1InitialBalance = await rdat.balanceOf(user1.address);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount, deadline, signedMessage)
        .should.emit(vesting, "Claimed")
        .withArgs(1, user1.address, rewardAmount, rewardAmount);

      (await vesting.userClaimAmounts(1)).should.eq(rewardAmount);

      (await rdat.balanceOf(user1.address)).should.eq(user1InitialBalance + rewardAmount);

      (await rdat.balanceOf(vesting.target)).should.eq(initialVestingBalance - rewardAmount);
    });

    it("Should not claim if paused", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1815661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(owner).pause();

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount, deadline, signedMessage)
        .should.be.rejectedWith("EnforcedPause()");
    });

    it("Should not claim if signature is wrong (userId)", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1815661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(user1)
        .claim(2, user1.address, rewardAmount, deadline, signedMessage)
        .should.be.rejectedWith("InvalidSignature()");
    });

    it("Should not claim if signature is wrong (rewardAmount)", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1815661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(user1)
        .claim(1, user2.address, parseEther('11'), deadline, signedMessage)
        .should.be.rejectedWith("InvalidSignature()");
    });

    it("Should not claim if signature is wrong (receiveAddress)", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1815661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(user1)
        .claim(1, user2.address, rewardAmount, deadline, signedMessage)
        .should.be.rejectedWith("InvalidSignature()");
    });

    it("Should not claim if signature is wrong (deadline)", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1815661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount, deadline + 1, signedMessage)
        .should.be.rejectedWith("InvalidSignature()");
    });

    it("Should not claim if signature expired", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1705661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount, deadline, signedMessage)
        .should.be.rejectedWith("SignatureExpired()");
    });

    it("Should not claim twice with same signature", async function () {
      const rewardAmount = parseEther('10');
      const deadline: BigNumberish = 1805661020;

      const signedMessage = await signParams(backendWallet, 1, user1, rewardAmount, deadline);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount, deadline, signedMessage)
        .should.be.fulfilled;

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount, deadline, signedMessage)
        .should.be.rejectedWith("AlreadyClaimed()");
    });

    it("Should not claim twice same amount", async function () {
      const rewardAmount1 = parseEther('10');
      const deadline1: BigNumberish = 1805661020;

      const signedMessage1 = await signParams(backendWallet, 1, user1, rewardAmount1, deadline1);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount1, deadline1, signedMessage1)
        .should.be.fulfilled;

      const rewardAmount2 = parseEther('10');
      const deadline2: BigNumberish = 1805661021;

      const signedMessage2 = await signParams(backendWallet, 1, user1, rewardAmount2, deadline2);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount2, deadline2, signedMessage2)
        .should.be.rejectedWith("AlreadyClaimed()");
    });

    it("Should claim multiple times", async function () {
      const rewardAmount1 = parseEther('10');
      const deadline1: BigNumberish = 1805661020;

      const signedMessage1 = await signParams(backendWallet, 1, user1, rewardAmount1, deadline1);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount1, deadline1, signedMessage1)
        .should.emit(vesting, "Claimed")
        .withArgs(1, user1.address, rewardAmount1, rewardAmount1);

      (await vesting.userClaimAmounts(1)).should.eq(rewardAmount1); 
      (await rdat.balanceOf(user1)).should.eq(rewardAmount1); 

      const rewardAmount2 = parseEther('15');
      const deadline2: BigNumberish = 1805661021;

      const signedMessage2 = await signParams(backendWallet, 1, user1, rewardAmount2, deadline2);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount2, deadline2, signedMessage2)
        .should.emit(vesting, "Claimed")
        .withArgs(1, user1.address, rewardAmount2 - rewardAmount1, rewardAmount2);

      (await vesting.userClaimAmounts(1)).should.eq(rewardAmount2); 
      (await rdat.balanceOf(user1)).should.eq(rewardAmount2); 
    });

    it("Should multiple user claim", async function () {
      const rewardAmount1 = parseEther('10');
      const deadline1: BigNumberish = 1805661020;

      const signedMessage1 = await signParams(backendWallet, 1, user1, rewardAmount1, deadline1);

      await vesting.connect(user1)
        .claim(1, user1.address, rewardAmount1, deadline1, signedMessage1)
        .should.emit(vesting, "Claimed")
        .withArgs(1, user1.address, rewardAmount1, rewardAmount1);

      (await vesting.userClaimAmounts(1)).should.eq(rewardAmount1); 
      (await rdat.balanceOf(user1)).should.eq(rewardAmount1); 

      const rewardAmount2 = parseEther('15');
      const deadline2: BigNumberish = 1805661021;

      const signedMessage2 = await signParams(backendWallet, 3, user2, rewardAmount2, deadline2);

      await vesting.connect(user2)
        .claim(3, user2.address, rewardAmount2, deadline2, signedMessage2)
        .should.emit(vesting, "Claimed")
        .withArgs(3, user2.address, rewardAmount2, rewardAmount2);

      (await vesting.userClaimAmounts(3)).should.eq(rewardAmount2); 
      (await rdat.balanceOf(user2)).should.eq(rewardAmount2); 
    });

    it("Should call claim for another user", async function () {
      const rewardAmount1 = parseEther('10');
      const deadline1: BigNumberish = 1805661020;

      const signedMessage1 = await signParams(backendWallet, 1, user1, rewardAmount1, deadline1);

      await vesting.connect(user2)
        .claim(1, user1.address, rewardAmount1, deadline1, signedMessage1)
        .should.emit(vesting, "Claimed")
        .withArgs(1, user1.address, rewardAmount1, rewardAmount1);

      (await vesting.userClaimAmounts(1)).should.eq(rewardAmount1); 
      (await rdat.balanceOf(user1)).should.eq(rewardAmount1); 
    });
  });
});