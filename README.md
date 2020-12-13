# Proxy.yul

A tiny and gas-efficient proxy contract written in pure Yul.

## Gas Overhead

Discounting the "inevitable" gas costs of proxing (the `DELEGATECALL`,
`CALLDATACOPY` and `RETURNDATACOPY` and associated memory costs) this proxy
implementation adds a mere 65 gas overhead on calls.
