# Proxy.yul

A tiny and gas-efficient proxy contract written in pure Yul.

## Gas Overhead

Discounting the "inevitable" gas costs of proxing (the `SLOAD`, `DELEGATECALL`, `CALLDATACOPY` and `RETURNDATACOPY` and associated memory costs) this proxy implementation adds a mere 76 gas overhead on non-reverting calls.

## TODO

- [ ] Add `beacon` support.
- [ ] Refactor `ProxyFactory` to allow usage as a `library`.
- [ ] Add EIP-1167 support to `ProxyFactory`.
