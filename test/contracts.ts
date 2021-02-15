import { ContractFactory, Signer } from "ethers";

import ProxyArtifact from "../build/Proxy.json";
import TestArtifact from "../build/Test.json";

export const Proxy = ContractFactory.fromSolidity(ProxyArtifact);
export const Test = ContractFactory.fromSolidity(TestArtifact);
