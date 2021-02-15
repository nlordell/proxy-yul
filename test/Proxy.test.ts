import { expect } from "chai";
import { ethers, BigNumber, Contract, ContractFactory } from "ethers";

import ProxyArtifact from "../build/Proxy.json";
import TestArtifact from "../build/Test.json";

describe("Proxy", () => {
  const url = process.env.JSON_RPC_URL || "http://localhost:8545";
  const provider = new ethers.providers.JsonRpcProvider(url);
  const signer = provider.getSigner();

  const Proxy = ContractFactory.fromSolidity(ProxyArtifact, signer);
  const Test = ContractFactory.fromSolidity(TestArtifact, signer);

  describe("code", () => {
    it("should deploy an instance of the proxy contract", async () => {
      const proxy = await Proxy.deploy(ethers.constants.AddressZero);
      expect(await provider.getCode(proxy.address)).to.equal(
        `0x${ProxyArtifact.evm.deployedBytecode.object}`
      );
    });

    it("should write the implementation address as an immutable", async () => {
      const address = ethers.utils.hexlify([...Array(20)].map((_, i) => i));
      const proxy = await Proxy.deploy(address);

      expect(await provider.getCode(proxy.address)).to.contain(
        address.substr(2)
      );
    });
  });

  describe("runtime", () => {
    let proxy: Contract;
    let test: Contract;

    beforeEach(async () => {
      test = await Test.connect(signer).deploy();
      const { address: proxyAddress } = await Proxy.deploy(test.address);

      proxy = test.attach(proxyAddress);
    });

    it("should proxy call to implementation", async () => {
      await proxy.setValue(42);
      expect(await proxy.value()).to.deep.equal(BigNumber.from(42));
    });

    it("should propagate reverts", async () => {
      const reason = "a really cool revert message";
      const err = await proxy.revertWith(reason).catch((err: Error) => err);
      expect(err).to.be.an.instanceof(Error);
      expect(err.message).to.contain(reason);
    });

    it("should return proxied result", async () => {
      expect(await proxy.echo("hello")).to.equal("hello");
    });

    it("should ignore leading non-zero bytes in address", async () => {
      const BadProxy = new ethers.ContractFactory(
        ["constructor(bytes32)"],
        ProxyArtifact.evm.bytecode.object,
        signer
      );
      const { address } = await BadProxy.deploy(
        ethers.utils.hexConcat(["0x1badc0de2badc0de3badc0de", test.address])
      );
      const badProxy = test.attach(address);

      expect(await badProxy.echo("hello")).to.equal("hello");
    });

    it("should add a predictable amount of gas overhead", async () => {
      const PROXY_OVERHEAD = 51;

      const gasOverhead = (inLength: number, outLength: number) => {
        const a = Math.ceil(Math.max(inLength, outLength) / 32);
        return BigNumber.from(
          700 /* delegatecall */ +
            (3 + 3 * Math.ceil(inLength / 32)) /* calldatacopy */ +
            (3 + 3 * Math.ceil(outLength / 32)) /* returndatacopy */ +
            (3 * a + Math.floor((a * a) / 512)) /* memory cost */ +
            PROXY_OVERHEAD
        );
      };

      for (const [dataLength, newLength] of [
        [10, 10],
        [1000, 5],
        [0, 5000],
      ]) {
        const data = ethers.utils.randomBytes(dataLength);
        const proxyGas = await proxy.estimateGas.resize(data, newLength);
        const directGas = await test.estimateGas.resize(data, newLength);

        const roundToWord = (n: number) => Math.ceil(n / 32) * 32;
        const inLength =
          4 /* functionSelector */ +
          32 /* dataOffset */ +
          32 /* newLength */ +
          32 /* dataLength */ +
          roundToWord(dataLength);
        const outLength =
          32 /* resultOffset */ +
          32 /* resultLength */ +
          roundToWord(newLength);

        expect(proxyGas.sub(directGas)).to.deep.equal(
          gasOverhead(inLength, outLength)
        );
      }
    });

    it("should add the minimal amount of runtime gas overhead", async () => {
      const testAddress = test.address.replace(/^0x/, "").toLowerCase();

      // NOTE: Deployment code for the minimal proxy contract.
      // <https://eips.ethereum.org/EIPS/eip-1167>
      const MIN_PROXY_BYTECODE = `3d602d80600a3d3981f3363d3d373d3d3d363d73${testAddress}5af43d82803e903d91602b57fd5bf3`;
      const MinProxy = new ContractFactory(
        ProxyArtifact.abi,
        MIN_PROXY_BYTECODE,
        signer
      );
      const { address: proxyAddress } = await MinProxy.deploy(test.address);
      const minProxy = test.attach(proxyAddress);

      const proxyGas = await proxy.estimateGas.echo("hello");
      const minProxyGas = await minProxy.estimateGas.echo("hello");

      expect(proxyGas).to.deep.equal(minProxyGas);
    });
  });
});
