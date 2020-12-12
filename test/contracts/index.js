const { ethers, ContractFactory } = require("ethers");
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const source = path.join(__dirname, "Test.sol");
const { errors, contracts } = JSON.parse(
  solc.compile(
    JSON.stringify({
      language: "Solidity",
      sources: {
        "Test.sol": {
          content: fs.readFileSync(source, "utf-8"),
        },
      },
      settings: {
        outputSelection: {
          "Test.sol": {
            Test: ["abi", "evm.bytecode"],
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

const {
  abi,
  evm: { bytecode },
} = contracts["Test.sol"]["Test"];

module.exports = {
  Test: new ContractFactory(abi, bytecode),
};
