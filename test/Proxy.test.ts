import { expect } from "chai";
import { ethers, BigNumber, Contract, ContractFactory } from "ethers";

import ProxyArtifact from "../build/Proxy.json";
import TestArtifact from "../build/Test.json";

import { slot, getProxyStorage } from "./eip1967";
import { provider, signer } from "./provider";

describe("Proxy", () => {
  const Proxy = ContractFactory.fromSolidity(ProxyArtifact);
  const Test = ContractFactory.fromSolidity(TestArtifact, signer);

  describe("code", () => {
    it("should deploy an instance of the proxy contract", async () => {
      const proxy = await Proxy.connect(signer).deploy(
        ethers.constants.AddressZero
      );

      // NOTE: The first immutable that appears in the deployed bytecode is the
      // proxy creator address, which is `signer.address` here. The other
      // immutables are the EIP-1967 implementation slot.
      const creator = await signer.getAddress();
      const deployedBytecode = ProxyArtifact.evm.deployedBytecode.object
        .replace(
          `7f${"00".repeat(32)}`,
          `7f${"00".repeat(12)}${creator.slice(2).toLowerCase()}`
        )
        .replace(
          new RegExp(`7f${"00".repeat(32)}`, "g"),
          `7f${slot("implementation").slice(2)}`
        );

      expect(await provider.getCode(proxy.address)).to.equal(
        `0x${deployedBytecode}`
      );
    });

    it("should set the EIP-1967 implementation slot", async () => {
      const implementation = ethers.utils.getAddress(`0x${"1337".repeat(10)}`);
      const proxy = await Proxy.connect(signer).deploy(implementation);

      expect(await getProxyStorage(proxy.address, "implementation")).to.equal(
        implementation
      );
    });
  });

  describe("runtime", () => {
    const creator = provider.getSigner(1);

    let proxy: Contract;
    let proxyView: Contract;
    let test: Contract;

    beforeEach(async () => {
      test = await Test.deploy();
      const { address: proxyAddress } = await Proxy.connect(creator).deploy(
        test.address
      );

      proxy = test.attach(proxyAddress);
      proxyView = new Contract(
        proxyAddress,
        [
          "function implementation() view returns (address)",
          "function beacon() view returns (address)",
          "function admin() view returns (address)",
        ],
        creator
      );
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
        creator
      );
      const { address } = await BadProxy.deploy(
        ethers.utils.hexConcat(["0x1badc0de2badc0de3badc0de", test.address])
      );
      const badProxy = test.attach(address);

      expect(await badProxy.echo("hello")).to.equal("hello");
    });

    it("should add a predictable amount of gas overhead", async () => {
      const PROXY_OVERHEAD = 76;

      const gasOverhead = (inLength: number, outLength: number) => {
        const a = Math.ceil(Math.max(inLength, outLength) / 32);
        return BigNumber.from(
          700 /* delegatecall */ +
            800 /* sload */ +
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

    describe("view", () => {
      it("should allow reading the implementation address", async () => {
        expect(await proxyView.implementation()).to.equal(test.address);
      });

      it("should allow reading the beacon address", async () => {
        const beacon = ethers.utils.getAddress(`0x${"1337".repeat(10)}`);
        await proxy.setBeacon(beacon);

        expect(await getProxyStorage(proxy.address, "beacon")).to.equal(beacon);
        expect(await proxyView.beacon()).to.equal(beacon);
      });

      it("should allow reading the admin address", async () => {
        const admin = ethers.utils.getAddress(`0x${"42".repeat(20)}`);
        await proxy.setAdmin(admin);

        expect(await getProxyStorage(proxy.address, "admin")).to.equal(admin);
        expect(await proxyView.admin()).to.equal(admin);
      });

      it("ignore additional calldata bytes", async () => {});

      it("revert for unexpected function selectors", async () => {});
    });
  });
});
