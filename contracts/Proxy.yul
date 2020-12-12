object "Proxy" {
    code {
        datacopy(0, dataoffset("runtime"), add(datasize("runtime"), 32))

        let implementation := mload(datasize("runtime"))
        setimmutable("implementation", implementation)
        sstore(
            0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc,
            implementation
        )

        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            calldatacopy(0, 0, calldatasize())
            let success := delegatecall(
                gas(),
                loadimmutable("implementation"),
                0,
                calldatasize(),
                0,
                0
            )

            returndatacopy(0, 0, returndatasize())

            if iszero(success) {
                revert(0, returndatasize())
            }

            return(0, returndatasize())
        }
    }
}
