const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("ProxyWallet contract", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const proxyWallet = await ethers.deployContract("ProxyWallet");

    // Fixtures can return anything you consider useful for your tests
    return { proxyWallet, owner, addr1, addr2 };
  }

  async function deployVersioned(owner, version) {
    const deployedVersiond = await ethers.deployContract(`Hello_v${version}`, {
      owner,
    });

    return { deployedVersiond, owner };
  }

  it("Deployment should be successful", async function () {
    const { proxyWallet, owner, addr1, addr2 } = await loadFixture(
      deployFixture
    );

    expect(await proxyWallet.getName()).to.equal("Wallet");
  });

  describe("upgrade", async () => {
    it("should upgrade the contract", async function () {
      const { proxyWallet, owner, addr1, addr2 } = await loadFixture(
        deployFixture
      );
      const { deployedVersiond, owner } = await loadFixture(deployVersioned, 1);

      expect(await proxyWallet.upgrade()).to.equal("Wallet");
    });
  });
});
