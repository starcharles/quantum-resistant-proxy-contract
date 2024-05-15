import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const ProxyWalletModule = buildModule("ProxyWalletModule", (m) => {
  const value = m.getParameter("value", parseEther("0"));

  const proxyWallet = m.contract("ProxyWallet", [], {
    value,
  });

  return { proxyWallet };
});

export default ProxyWalletModule;
