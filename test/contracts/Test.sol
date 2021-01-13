// SPDX-License-Identifier: LGPL-3.0-or-newer
pragma solidity ^0.8.0;

contract Test {
    uint256 public value;

    function setValue(uint256 newValue) external {
        value = newValue;
    }

    function revertWith(string calldata reason) external pure {
        revert(reason);
    }

    function echo(string memory message)
        external
        pure
        returns (string memory)
    {
        return message;
    }

    function resize(bytes memory data, uint256 length)
        external
        pure
        returns (bytes memory)
    {
        assembly {
            mstore(data, length)
        }
        return data;
    }
}
