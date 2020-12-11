const fs = require("fs");
const path = require("path");
const solc = require("solc");

const root = path.join(__dirname, "..");

const source = path.join(root, "contracts/Proxy.yul");
const { errors, contracts } = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Yul",
      sources: {
        "Proxy.yul": {
          content: fs.readFileSync(source, "utf-8"),
        },
      },
      settings: {
        optimizer: { enabled: true },
        outputSelection: {
          "Proxy.yul": {
            Proxy: ["evm.bytecode", "evm.deployedBytecode"],
          },
        },
      },
    })
  )
);

if (!contracts) {
  for (const { formattedMessage } of errors) {
    console.log(formattedMessage);
  }
  process.exit(1);
}

const { bytecode, deployedBytecode } = contracts["Proxy.yul"]["Proxy"].evm;
fs.mkdirSync(path.join(root, "build"), { recursive: true });
fs.writeFileSync(
  path.join(root, "build/Proxy.json"),
  JSON.stringify(
    {
      contractName: "Proxy",
      sourceName: "contracts/Proxy.yul",
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
      bytecode: bytecode.object,
      deployedBytecode: deployedBytecode.object,
    },
    undefined,
    "  "
  )
);
