import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { getAddress, keccak256, Abi, parseGwei } from "viem";
import { AbiCoder } from "ethers";

describe("ProxyWallet contract", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();

    const publicClient = await hre.viem.getPublicClient();
    const proxyWallet = await hre.viem.deployContract("ProxyWallet");
    const helloV1 = await hre.viem.deployContract("Hello_v1");
    const helloV2 = await hre.viem.deployContract("Hello_v2");

    return { publicClient, proxyWallet, helloV1, helloV2, owner, addr1, addr2 };
  }

  describe("deployment", () => {
    it("Deployment should be successful", async function () {
      const { proxyWallet, helloV1, helloV2, owner } = await loadFixture(
        deployFixture
      );

      expect((await proxyWallet.read.owner()).toLowerCase()).to.equal(
        owner.account.address
      );
      expect(await proxyWallet.read.getName()).to.equal("Wallet");
      expect(await proxyWallet.read.getProxyName()).to.equal("Proxy");
      expect(await helloV1.read.hello()).to.equal("Hello V1!");
      expect(await helloV2.read.hello()).to.equal("Hello V2!");
    });
  });

  describe("upgrade", async () => {
    it("should upgrade the contract", async () => {
      const {
        publicClient,
        proxyWallet,
        helloV1,
        helloV2,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployFixture);

      const hash = await proxyWallet.write.upgrade([
        helloV1.address,
        "I_AM_OWNER",
      ]);
      await publicClient.waitForTransactionReceipt({ hash });
      const event = await proxyWallet.getEvents.UpgradedAtWallet();
      expect(event).to.have.lengthOf(1);
      expect(event[0].args.contractAddress?.toLowerCase()).to.equal(
        helloV1.address
      );
      expect(event[0].args.PQCSignature).to.equal("I_AM_OWNER");

      await expect(proxyWallet.write.upgrade([helloV2.address, "I_AM_OWNER"]))
        .to.be.fulfilled;
    });

    it("fails if the caller is not the owner", async () => {
      const { proxyWallet, helloV1, helloV2, owner, addr1, addr2 } =
        await loadFixture(deployFixture);

      await expect(
        proxyWallet.write.upgrade([helloV1.address, "I_AM_NOT_OWNER"])
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("delegatecall", async () => {
    it("should delegatecall the contract", async () => {
      const { proxyWallet, helloV1, helloV2, owner, addr1, addr2 } =
        await loadFixture(deployFixture);

      const functionSignature = "hello()";
      const encodedFunctionSignature = hre.ethers
        .keccak256(hre.ethers.toUtf8Bytes(functionSignature))
        .slice(0, 10); // 最初の4バイト（0xを含むため10文字）

      expect(
        await proxyWallet.write.delegatecall([
          helloV1.address,
          `0x${encodedFunctionSignature}`,
        ])
      ).to.equal(true);
    });
  });
});
