// SPDX-License-Identifier: LGPL-3.0-or-newer

object "Proxy" {
    code {
        datacopy(0, dataoffset("runtime"), add(datasize("runtime"), 32))

        let implementation := mload(datasize("runtime"))
        setimmutable(0, "implementation", implementation)

        return(0, datasize("runtime"))
    }

    object "runtime" {
        code {
            // NOTE: Use `RETURNDATASIZE` instead of 0's as it is 1 gas cheaper,
            // generates smaller bytecode, and guaranteed to be 0 before the
            // `DELEGATECALL`.
            calldatacopy(
                returndatasize(),
                returndatasize(),
                calldatasize()
            )
            let success := delegatecall(
                gas(),
                loadimmutable("implementation"),
                returndatasize(),
                calldatasize(),
                returndatasize(),
                returndatasize()
            )

            returndatacopy(0, 0, returndatasize())

            // NOTE: Ideally, we should be able to just `JUMPI` directly on the
            // `success` value, but using `iszero(success)` for the condition
            // is generating `ISZERO ISZERO JUMPI` instead of just `JUMPI`.
            if success {
                return(0, returndatasize())
            }
            revert(0, returndatasize())
        }
    }
}