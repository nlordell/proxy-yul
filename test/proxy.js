const { expect } = require("chai");
const { ethers, BigNumber } = require("ethers");

const { abi, bytecode, deployedBytecode } = require("../build/Proxy.json");
const { Test } = require("./contracts");

describe("Proxy", () => {
  const url = process.env.JSON_RPC_URL || "http://localhost:8545";
  const provider = new ethers.providers.JsonRpcProvider(url);
  const signer = provider.getSigner();

  const Proxy = new ethers.ContractFactory(abi, bytecode, signer);

  describe("code", () => {
    it("should deploy an instance of the proxy contract", async () => {
      const proxy = await Proxy.deploy(ethers.constants.AddressZero);
      expect(await provider.getCode(proxy.address)).to.equal(
        `0x${deployedBytecode}`
      );
    });

    it("should write the implementation address as an immutable", async () => {
      const address = ethers.utils.hexlify([...Array(20)].map((_, i) => i));
      const proxy = await Proxy.deploy(address);

      expect(await provider.getCode(proxy.address)).to.contain(
        address.substr(2)
      );
    });

    it("should store the implementation address in the EIP-1967 defined slot", async () => {
      const address = ethers.utils.hexlify([...Array(20)].map(() => 0x42));
      const proxy = await Proxy.deploy(address);

      const EIP1967_SLOT = BigNumber.from(
        ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes("eip1967.proxy.implementation")
        )
      ).sub(1);
      expect(await provider.getStorageAt(proxy.address, EIP1967_SLOT)).to.equal(
        address
      );
    });
  });

  describe("runtime", () => {
    let proxy;

    beforeEach(async () => {
      const test = await Test.connect(signer).deploy();
      const { address: proxyAddress } = await Proxy.deploy(test.address);

      proxy = test.attach(proxyAddress);
    });

    it("should proxy call to implementation", async () => {
      await proxy.setValue(42);
      expect(await proxy.value()).to.deep.equal(BigNumber.from(42));
    });

    it("should propagate reverts", async () => {
      const reason = "a really cool revert message";
      const err = await proxy.revertWith(reason).catch((err) => err);
      expect(err).to.be.an.instanceof(Error);
      expect(err.message).to.contain(reason);
    });

    it("should return proxied result", async () => {
      expect(await proxy.echo("hello")).to.equal("hello");
    });

    it("should ignore leading non-zero bytes in address", async () => {
      const BadProxy = new ethers.ContractFactory(
        ["constructor(bytes32)"],
        bytecode,
        signer
      );
      const { address } = await BadProxy.deploy(
        ethers.utils.hexConcat(["0x1badc0de2badc0de3badc0de", proxy.address])
      );
      const badProxy = proxy.attach(address);

      expect(await badProxy.echo("hello")).to.equal("hello");
    });
  });
});
