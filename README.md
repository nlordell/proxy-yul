# Proxy.yul

A tiny and gas-efficient proxy contract written in pure Yul. This proxy contract is intended to be a minimal Yul implementation and **is not upgradable**.

## Gas Overhead

Discounting the "inevitable" gas costs of proxing (the `DELEGATECALL`, `CALLDATACOPY` and `RETURNDATACOPY` and associated memory costs) this proxy implementation adds a mere 51 gas overhead on non-reverting calls.
This also happens to be the same runtime gas overhead as the [EIP-1167: Minimal Proxy Contract](https://eips.ethereum.org/EIPS/eip-1167), albeit with slightly larger bytecode.
