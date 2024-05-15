import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HelloV2Module = buildModule("HelloV2Module", (m) => {
  const value = m.getParameter("value", parseEther("0"));

  const helloV2 = m.contract("Hello_v2", [], {
    value,
  });

  return { helloV2 };
});

export default HelloV2Module;
