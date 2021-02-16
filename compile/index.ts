import { compileAll } from "./solc-wrapper";

async function main() {
  await compileAll([
    {
      language: "Yul",
      file: "src/Proxy.yul",
      outputSelection: ["evm.bytecode.object", "evm.deployedBytecode.object"],
      outputOverrides: {
        abi: [
          {
            inputs: [
              {
                internalType: "address",
                name: "bar",
                type: "address",
              },
            ],
            stateMutability: "payable",
            type: "constructor",
          },
        ],
      },
    },
    {
      language: "Solidity",
      file: "src/ProxyFactory.sol",
      outputSelection: [
        "abi",
        "evm.bytecode.object",
        "evm.deployedBytecode.object",
      ],
    },
    {
      language: "Solidity",
      file: "test/contracts/Test.sol",
      outputSelection: ["abi", "evm.bytecode.object"],
    },
  ]);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
