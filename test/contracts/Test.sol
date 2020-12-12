// SPDX-License-Identifier: GPL-3.0-or-newer
pragma solidity ^0.7.0;

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
}
