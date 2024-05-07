import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { getAddress, parseGwei } from "viem";

describe("ProxyWallet contract", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    const proxyWallet = await hre.ethers.deployContract("ProxyWallet");
    const helloV1 = await hre.ethers.deployContract("Hello_v1");
    const helloV2 = await hre.ethers.deployContract("Hello_v2");

    return { proxyWallet, helloV1, helloV2, owner, addr1, addr2 };
  }

  it("Deployment should be successful", async function () {
    const { proxyWallet, helloV1, helloV2, owner, addr1, addr2 } =
      await loadFixture(deployFixture);

    expect(await proxyWallet.getName()).to.equal("Wallet");
    expect(await proxyWallet.getProxyName()).to.equal("Proxy");
    expect(await helloV1.hello()).to.equal("Hello V1!");
    expect(await helloV2.hello()).to.equal("Hello V2!");
  });

  describe("upgrade", async () => {
    it("should upgrade the contract", async () => {
      const { proxyWallet, helloV1, helloV2, owner, addr1, addr2 } =
        await loadFixture(deployFixture);

      console.log("address", proxyWallet.getAddress());
      await expect(
        proxyWallet.upgrade(helloV1.getAddress(), "I_AM_OWNER")
      ).not.to.throw();

      await expect(proxyWallet.upgrade(helloV1.getAddress(), "I_AM_OWNER"))
        .to.emit(proxyWallet, "Upgraded")
        .withArgs(helloV1.getAddress());
    });
  });
});
