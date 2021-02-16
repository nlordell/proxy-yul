import { expect } from "chai";
import { ethers, Contract, ContractFactory } from "ethers";

import ProxyArtifact from "../build/Proxy.json";
import ProxyFactoryArtifact from "../build/ProxyFactory.json";
import TestArtifact from "../build/Test.json";

import { provider, signer } from "./provider";

function creationCode(
  { bytecode, interface: iface }: ContractFactory,
  ...args: unknown[]
): string {
  return ethers.utils.hexConcat([bytecode, iface.encodeDeploy(args)]);
}

describe("ProxyFactory", () => {
  const ProxyFactory = ContractFactory.fromSolidity(
    ProxyFactoryArtifact,
    signer
  );
  const Proxy = ContractFactory.fromSolidity(ProxyArtifact, signer);

  let proxyFactory: Contract;

  const proxyCodeFromArtifact = async (implementation: string) => {
    const proxy = await Proxy.deploy(implementation);
    const proxyCode = await provider.getCode(proxy.address);

    const canonicalize = (addr: string) => addr.slice(2).toLowerCase();
    return proxyCode.replace(
      canonicalize(await signer.getAddress()),
      canonicalize(proxyFactory.address)
    );
  };

  before(async () => {
    proxyFactory = await ProxyFactory.connect(signer).deploy();
  });

  describe("proxyCode", () => {
    it("should return the creation code for the given implementation address", async () => {
      const implementation = ethers.utils.getAddress(
        `0x${"baadc0de".repeat(5)}`
      );

      expect(await proxyFactory.proxyCode(implementation)).to.equal(
        creationCode(Proxy, implementation)
      );
    });
  });

  describe("createProxy", () => {
    it("should deploy a proxy with expected bytecode", async () => {
      const implementation = ethers.utils.getAddress(`0x${"42".repeat(20)}`);

      const proxy = await proxyFactory.callStatic.createProxy(implementation);
      await proxyFactory.createProxy(implementation);

      expect(await provider.getCode(proxy)).to.equal(
        await proxyCodeFromArtifact(implementation)
      );
    });
  });

  describe("create2Proxy", () => {
    it("should deploy a proxy at the expected address", async () => {
      const implementation = ethers.utils.getAddress(`0x${"1337".repeat(10)}`);
      const salt = `0x${"42".repeat(32)}`;

      const proxy = ethers.utils.getCreate2Address(
        proxyFactory.address,
        salt,
        ethers.utils.keccak256(creationCode(Proxy, implementation))
      );

      expect(
        await proxyFactory.callStatic.create2Proxy(implementation, salt)
      ).to.equal(proxy);
    });

    it("should deploy a proxy with expected bytecode", async () => {
      const implementation = ethers.utils.getAddress(`0x${"fe".repeat(20)}`);
      const salt = `0x${"01".repeat(32)}`;

      const proxy = await proxyFactory.callStatic.create2Proxy(
        implementation,
        salt
      );
      await proxyFactory.create2Proxy(implementation, salt);

      expect(await provider.getCode(proxy)).to.equal(
        await proxyCodeFromArtifact(implementation)
      );
    });
  });

  describe("view", () => {
    const Test = ContractFactory.fromSolidity(TestArtifact, signer);

    let proxy: Contract;
    let test: Contract;
    const beacon = ethers.utils.getAddress(`0x${"be".repeat(20)}`);
    const admin = ethers.utils.getAddress(`0x${"ad".repeat(20)}`);

    before(async () => {
      test = await Test.deploy();
      proxy = test.attach(
        await proxyFactory.callStatic.createProxy(test.address)
      );

      await proxyFactory.createProxy(test.address);
      await proxy.setBeacon(beacon);
      await proxy.setAdmin(admin);
    });

    describe("implementationOf", () => {
      it("should return the implementation contract address", async () => {
        expect(await proxyFactory.implementationOf(proxy.address)).to.equal(
          test.address
        );
      });
    });

    describe("beaconOf", () => {
      it("should return the beacon contract address", async () => {
        expect(await proxyFactory.beaconOf(proxy.address)).to.equal(beacon);
      });
    });

    describe("adminOf", () => {
      it("should return the admin address", async () => {
        expect(await proxyFactory.adminOf(proxy.address)).to.equal(admin);
      });
    });
  });
});
