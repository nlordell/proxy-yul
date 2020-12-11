object "Proxy" {
    code {
        datacopy(0, dataoffset("runtime"), add(datasize("runtime"), 32))
        setimmutable("implementation", mload(datasize("runtime")))
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
            switch success
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }
}
