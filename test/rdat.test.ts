import chai, { should } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { Rdat } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

chai.use(chaiAsPromised);
should();

describe("ERC20Swapper", () => {
  let deployer: HardhatEthersSigner;
  let owner: HardhatEthersSigner;
  let admin: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;

  let rdat: Rdat;

  const deploy = async () => {
    [deployer, owner, admin, user1, user2, user3, user4] = await ethers.getSigners();

    rdat = await ethers.deployContract("Rdat", [owner.address]);
    await rdat.waitForDeployment();

    await rdat.connect(owner).changeAdmin(admin);
  }

  describe("Rdat - basic", () => {
    before(async function () {
    });

    beforeEach(async () => {
      await deploy();
    });

    it("should have correct params after deploy", async function () {
      (await rdat.owner()).should.eq(owner);
      (await rdat.admin()).should.eq(admin);
      (await rdat.name()).should.eq("RData");
      (await rdat.symbol()).should.eq("RDAT");
      (await rdat.mintBlocked()).should.eq(false);
    });

    it("Should transferOwnership in 2 steps", async function () {
      await rdat.connect(owner).transferOwnership(user2.address)
        .should.emit(rdat, "OwnershipTransferStarted")
        .withArgs(owner, user2);
      (await rdat.owner()).should.eq(owner);

      await rdat.connect(owner).transferOwnership(user3.address)
        .should.emit(rdat, "OwnershipTransferStarted")
        .withArgs(owner, user3);
      (await rdat.owner()).should.eq(owner);

      await rdat.connect(user3).acceptOwnership()
        .should.fulfilled;
      (await rdat.owner()).should.eq(user3);
    });

    it("Should not transferOwnership if not owner", async function () {
      await rdat.connect(admin)
        .transferOwnership(user2)
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${admin.address}")`
        );
    });

    it("Should changeAdmin if owner", async function () {
      await rdat.connect(owner).changeAdmin(user2.address)
        .should.emit(rdat, "AdminChanged")
        .withArgs(admin, user2);
      (await rdat.admin()).should.eq(user2);
    });

    it("Should not changeAdmin if not owner", async function () {
      await rdat.connect(admin)
        .changeAdmin(user2)
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${admin.address}")`
        );
    });

    it("Should blockMint if owner", async function () {
      await rdat.connect(owner).blockMint()
        .should.emit(rdat, "MintBlocked");

      (await rdat.mintBlocked()).should.eq(true);
    });

    it("Should not blockMint if not owner", async function () {
      await rdat.connect(admin)
        .blockMint()
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${admin.address}")`
        );
    });

    it("Should mint if owner", async function () {
      const mintAmount = parseEther("100");

      (await rdat.balanceOf(user2)).should.eq(0);

      await rdat.connect(owner)
        .mint(user2, mintAmount)
        .should.be.fulfilled;

      (await rdat.balanceOf(user2)).should.eq(mintAmount);
    });

    it("Should not mint if not owner", async function () {
      await rdat.connect(admin)
        .mint(user1, parseEther("10"))
        .should.be.rejectedWith(
          `OwnableUnauthorizedAccount("${admin.address}")`
        );
    });

    it("Should not mint if mint is blocked", async function () {
      await rdat.connect(owner).blockMint()
        .should.emit(rdat, "MintBlocked");

      await rdat.connect(owner)
        .mint(user1, parseEther("10"))
        .should.be.rejectedWith(`EnforceMintBlocked()`);
    });

    it("Should blockAddress if admin", async function () {
      (await rdat.blockListLength()).should.eq(0);

      await rdat.connect(admin)
        .blockAddress(user2)
        .should.emit(rdat, "AddressBlocked")
        .withArgs(user2);

      (await rdat.blockListLength()).should.eq(1);
      (await rdat.blockListAt(0)).should.eq(user2);
    });

    it("Should not blockAddress if not admin", async function () {
      await rdat.connect(user3)
        .blockAddress(user2)
        .should.be.rejectedWith(`UnauthorizedAdminAction("${user3.address}")`)
    });

    it("Should unblockAddress if admin #1", async function () {
      (await rdat.blockListLength()).should.eq(0);

      await rdat.connect(admin)
        .blockAddress(user2)
        .should.emit(rdat, "AddressBlocked")
        .withArgs(user2);

      (await rdat.blockListLength()).should.eq(1);
      (await rdat.blockListAt(0)).should.eq(user2);

      await rdat.connect(admin)
        .unblockAddress(user2)
        .should.emit(rdat, "AddressUnblocked")
        .withArgs(user2);

      (await rdat.blockListLength()).should.eq(0);
    });

    it("Should not unblockAddress if not admin", async function () {
      await rdat.connect(user3)
        .unblockAddress(user2)
        .should.be.rejectedWith(`UnauthorizedAdminAction("${user3.address}")`)
    });

    it("Should unblockAddress if admin #2", async function () {
      (await rdat.blockListLength()).should.eq(0);

      await rdat.connect(admin)
        .blockAddress(user2)
        .should.emit(rdat, "AddressBlocked")
        .withArgs(user2);

      await rdat.connect(admin)
        .blockAddress(user3)
        .should.emit(rdat, "AddressBlocked")
        .withArgs(user3);

      (await rdat.blockListLength()).should.eq(2);
      (await rdat.blockListAt(0)).should.eq(user2);
      (await rdat.blockListAt(1)).should.eq(user3);

      await rdat.connect(admin)
        .unblockAddress(user2)
        .should.emit(rdat, "AddressUnblocked")
        .withArgs(user2);

      (await rdat.blockListLength()).should.eq(1);
      (await rdat.blockListAt(0)).should.eq(user3);
    });

    it("Should transfer", async function () {
      const mintAmount = parseEther("100");
      const transferAmount = parseEther("20");

      await rdat.connect(owner).mint(user1, mintAmount).should.be.fulfilled;

      (await rdat.balanceOf(user1)).should.eq(mintAmount);
      (await rdat.balanceOf(user2)).should.eq(0);
      (await rdat.totalSupply()).should.eq(mintAmount);

      await rdat.connect(user1)
        .transfer(user2, parseEther("20"))
        .should.emit(rdat, "Transfer")
        .withArgs(user1, user2, parseEther("20"));

      (await rdat.balanceOf(user1)).should.eq(mintAmount - transferAmount);
      (await rdat.balanceOf(user2)).should.eq(transferAmount);
      (await rdat.totalSupply()).should.eq(mintAmount);
    });

    it("Should not transfer when blocked", async function () {
      const mintAmount = parseEther("100");
      const transferAmount = parseEther("20");

      await rdat.connect(admin)
        .blockAddress(user2)
        .should.emit(rdat, "AddressBlocked")
        .withArgs(user2);

      await rdat.connect(owner).mint(user2, mintAmount).should.be.fulfilled;

      (await rdat.balanceOf(user2)).should.eq(mintAmount);
      (await rdat.balanceOf(user3)).should.eq(0);
      (await rdat.totalSupply()).should.eq(mintAmount);

      await rdat.connect(user2)
        .transfer(user2, parseEther("20"))
        .should.rejectedWith(`UnauthorizedUserAction("${user2.address}")`);

      (await rdat.balanceOf(user2)).should.eq(mintAmount);
      (await rdat.balanceOf(user3)).should.eq(0);
      (await rdat.totalSupply()).should.eq(mintAmount);
    });

    it("Should transfer when unblocked", async function () {
      const mintAmount = parseEther("100");
      const transferAmount = parseEther("20");

      await rdat.connect(admin)
        .blockAddress(user2)
        .should.emit(rdat, "AddressBlocked")
        .withArgs(user2);

      await rdat.connect(owner).mint(user2, mintAmount).should.be.fulfilled;

      (await rdat.balanceOf(user2)).should.eq(mintAmount);
      (await rdat.balanceOf(user3)).should.eq(0);
      (await rdat.totalSupply()).should.eq(mintAmount);

      await rdat.connect(user2)
        .transfer(user2, parseEther("20"))
        .should.rejectedWith(`UnauthorizedUserAction("${user2.address}")`);

      (await rdat.balanceOf(user2)).should.eq(mintAmount);
      (await rdat.balanceOf(user3)).should.eq(0);
      (await rdat.totalSupply()).should.eq(mintAmount);

      await rdat.connect(admin)
        .unblockAddress(user2)
        .should.emit(rdat, "AddressUnblocked")
        .withArgs(user2);

      await rdat.connect(user2)
        .transfer(user3, parseEther("20"))
        .should.emit(rdat, "Transfer")
        .withArgs(user2, user3, parseEther("20"));

      (await rdat.balanceOf(user2)).should.eq(mintAmount - transferAmount);
      (await rdat.balanceOf(user3)).should.eq(transferAmount);
      (await rdat.totalSupply()).should.eq(mintAmount);
    });

  });
});