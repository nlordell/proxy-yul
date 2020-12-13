# Proxy.yul

A tiny and gas-efficient proxy contract written in pure Yul. This proxy contract
is intended to be a minimal Yul implementation and **is not upgradable**.

## Gas Overhead

Discounting the "inevitable" gas costs of proxing (the `DELEGATECALL`,
`CALLDATACOPY` and `RETURNDATACOPY` and associated memory costs) this proxy
implementation adds a mere 51 gas overhead on calls.
