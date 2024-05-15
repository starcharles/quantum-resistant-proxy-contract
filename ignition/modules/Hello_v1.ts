import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HelloV1Module = buildModule("HelloV1Module", (m) => {
  const value = m.getParameter("value", parseEther("0"));

  const helloV1 = m.contract("Hello_v1", [], {
    value,
  });

  return { helloV1 };
});

export default HelloV1Module;
