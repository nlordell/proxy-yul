// SPDX-License-Identifier: LGPL-3.0-or-newer

object "Proxy" {
    code {
        datacopy(0, dataoffset("runtime"), add(datasize("runtime"), 32))

        let implementationSlot := 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
        sstore(implementationSlot, mload(datasize("runtime")))

        setimmutable(0, "implementationSlot", implementationSlot)
        setimmutable(0, "creator", caller())

        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            if eq(caller(), loadimmutable("creator")) {
                switch shr(224, calldataload(returndatasize()))
                    // function implementation() returns (address)
                    case 0x5c60da1b {
                        mstore(
                            returndatasize(),
                            sload(loadimmutable("implementationSlot"))
                        )
                        return(returndatasize(), 32)
                    }
                    // function beacon() returns (address)
                    case 0x59659e90 {
                        mstore(
                            returndatasize(),
                            sload(
                                0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50
                            )
                        )
                        return(returndatasize(), 32)
                    }
                    // function admin() returns (address)
                    case 0xf851a440 {
                        mstore(
                            returndatasize(),
                            sload(
                                0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103
                            )
                        )
                        return(returndatasize(), 32)
                    }
                    default {
                        revert(returndatasize(), returndatasize())
                    }
            }

            calldatacopy(
                returndatasize(),
                returndatasize(),
                calldatasize()
            )
            let success := delegatecall(
                gas(),
                sload(loadimmutable("implementationSlot")),
                returndatasize(),
                calldatasize(),
                returndatasize(),
                returndatasize()
            )

            returndatacopy(0, 0, returndatasize())

            if success {
                return(0, returndatasize())
            }
            revert(0, returndatasize())
        }
    }
}
