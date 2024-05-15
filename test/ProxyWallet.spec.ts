import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import {
  getAddress,
  keccak256,
  Abi,
  parseGwei,
  getContract,
  TransactionExecutionError,
} from "viem";
import { AbiCoder } from "ethers";

describe("ProxyWallet contract", function () {
  async function deployFixture() {
    const [owner, addr1, addr2] = await hre.viem.getWalletClients();

    const publicClient = await hre.viem.getPublicClient();
    const proxyWallet = await hre.viem.deployContract("ProxyWallet", [], {
      client: {
        wallet: owner,
      },
    });
    const helloV1 = await hre.viem.deployContract("Hello_v1");
    const helloV2 = await hre.viem.deployContract("Hello_v2");

    return { publicClient, proxyWallet, helloV1, helloV2, owner, addr1, addr2 };
  }

  describe("deployment", () => {
    it("Deployment should be successful", async function () {
      const { proxyWallet, helloV1, helloV2, owner } = await loadFixture(
        deployFixture
      );

      const proxy = await proxyWallet.read.getProxy();
      expect(proxy.toLowerCase()).not.to.equal(proxyWallet.address);

      expect((await proxyWallet.read.owner()).toLowerCase()).to.equal(
        owner.account.address
      );
      expect(await proxyWallet.read.getName()).to.equal("Wallet");
      expect(await proxyWallet.read.getProxyName()).to.equal("Proxy");
      const res1 = await helloV1.read.hello();
      const res2 = await helloV2.read.hello();
      expect(res1).to.equal("Hello V1!");
      expect(res2).to.equal("Hello V2!");
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

      const hash = await proxyWallet.write.upgrade(
        [helloV1.address, "I_AM_OWNER"],
        {
          account: owner.account.address,
        }
      );
      await publicClient.waitForTransactionReceipt({ hash });

      const event = await proxyWallet.getEvents.UpgradedAtWallet();
      expect(event).to.have.lengthOf(1);
      expect(event[0].args.contractAddress?.toLowerCase()).to.equal(
        helloV1.address
      );
      expect(event[0].args.PQCSignature).to.equal("I_AM_OWNER");

      await expect(proxyWallet.write.upgrade([helloV2.address, "I_AM_OWNER"]))
        .to.be.fulfilled;

      const event2 = await proxyWallet.getEvents.UpgradedAtWallet();
      expect(event2).to.have.lengthOf(1);
      expect(event2[0].args.contractAddress?.toLowerCase()).to.equal(
        helloV2.address
      );
      expect(event2[0].args.PQCSignature).to.equal("I_AM_OWNER");
    });

    it("should fail if the caller is invalid", async () => {
      const { proxyWallet, helloV1, helloV2, owner, addr1, addr2 } =
        await loadFixture(deployFixture);

      // signature is invalid
      await expect(
        proxyWallet.write.upgrade([helloV1.address, "I_AM_NOT_OWNER"], {
          account: owner.account.address,
        })
      ).to.be.rejectedWith("Ownable: caller is not the owner");

      // msg.sender is invalid
      await expect(
        proxyWallet.write.upgrade([helloV1.address, "I_AM_OWNER"], {
          account: addr1.account.address,
        })
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });

    it("should not upgrade the contract address directly", async () => {
      const { proxyWallet, helloV1, helloV2, owner, addr1, addr2 } =
        await loadFixture(deployFixture);

      const proxyContractAddress = await proxyWallet.read.getProxy();
      expect(proxyContractAddress).not.to.equal(proxyWallet.address);
      const proxyContract = await hre.viem.getContractAt(
        "Proxy",
        proxyContractAddress
      );

      // it should not upgrade the contract address directly
      await expect(
        proxyContract.write.upgradeTo([helloV1.address], {
          account: owner.account.address,
        })
      ).to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });

  describe("callHello", async () => {
    it("should delegate hello() to the Proxy contract", async () => {
      const {
        publicClient,
        proxyWallet,
        helloV1,
        helloV2,
        owner,
        addr1,
        addr2,
      } = await loadFixture(deployFixture);

      // upgrade to helloV1
      const hash1 = await proxyWallet.write.upgrade([
        helloV1.address,
        "I_AM_OWNER",
      ]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
      const event1 = await proxyWallet.getEvents.UpgradedAtWallet();
      expect(event1).to.have.lengthOf(1);
      expect(event1[0].args.contractAddress?.toLowerCase()).to.equal(
        helloV1.address
      );
      expect(event1[0].args.PQCSignature).to.equal("I_AM_OWNER");

      // callHello() should be delegated to the new contract(Hello_V1.sol)
      const hash2 = await proxyWallet.write.callHello();

      const { status } = await publicClient.waitForTransactionReceipt({
        hash: hash2,
      });

      expect(status).to.equal("success");

      const event2 = await proxyWallet.getEvents.Delegatecall();
      expect(event2).to.have.lengthOf(1);
      expect(event2[0].args.contractAddress?.toLowerCase()).to.equal(
        (await proxyWallet.read.getProxy()).toLowerCase()
      );

      const resultEvent = await proxyWallet.getEvents.CallResult();
      expect(resultEvent).to.have.lengthOf(1);
      expect(resultEvent[0].args.functionName).to.equal("callHello()");
      expect(resultEvent[0].args.result).to.equal("Hello V1!");

      // upgrade to helloV2
      const hash3 = await proxyWallet.write.upgrade([
        helloV2.address,
        "I_AM_OWNER",
      ]);
      const { status: status2 } = await publicClient.waitForTransactionReceipt({
        hash: hash3,
      });
      expect(status2).to.equal("success");

      const event3 = await proxyWallet.getEvents.UpgradedAtWallet();
      expect(event3).to.have.lengthOf(1);
      expect(event3[0].args.contractAddress?.toLowerCase()).to.equal(
        helloV2.address
      );
      expect(event3[0].args.PQCSignature).to.equal("I_AM_OWNER");

      // callHello() should be delegated to the new contract(Hello_V2.sol)
      const hash4 = await proxyWallet.write.callHello();
      const { status: status3 } = await publicClient.waitForTransactionReceipt({
        hash: hash4,
      });

      expect(status3).to.equal("success");

      const event4 = await proxyWallet.getEvents.Delegatecall();
      const resultEvent2 = await proxyWallet.getEvents.CallResult();
      expect(event4).to.have.lengthOf(1);
      expect(event4[0].args.contractAddress?.toLowerCase()).to.equal(
        (await proxyWallet.read.getProxy()).toLowerCase()
      );

      expect(resultEvent2).to.have.lengthOf(1);
      expect(resultEvent2[0].args.functionName).to.equal("callHello()");
      expect(resultEvent2[0].args.result).to.equal("Hello V2!");
    });
  });
});
