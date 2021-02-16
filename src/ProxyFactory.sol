// SPDX-License-Identifier: LGPL-3.0-or-newer
pragma solidity ^0.8.0;

/// @title Proxy View Interface.
/// @author Nicholas Rodrigues Lordello
interface IProxyView {
    /// @dev Get the address of the logic contract that this proxy delegates to.
    function implementation() external view returns (address);

    /// @dev Get the address of the beacon contract this proxy relies on.
    function beacon() external view returns (address);

    /// @dev Get the address that is allowed to upgrade the logic contract
    /// address for this proxy.
    function admin() external view returns (address);
}

/// @title Proxy Factory
/// @author Nicholas Rodrigues Lordello
contract ProxyFactory {
    function createProxy(address implementation)
        external
        returns (address proxy)
    {
        proxy = create_(proxyCode(implementation));
    }

    function create2Proxy(address implementation, bytes32 salt)
        external
        returns (address proxy)
    {
        proxy = create2_(proxyCode(implementation), salt);
    }

    function implementationOf(address proxy)
        external
        view
        returns (address implementation)
    {
        implementation = IProxyView(proxy).implementation();
    }

    function beaconOf(address proxy) external view returns (address beacon) {
        beacon = IProxyView(proxy).beacon();
    }

    function adminOf(address proxy) external view returns (address admin) {
        admin = IProxyView(proxy).admin();
    }

    function proxyCode(address implementation)
        public
        pure
        returns (bytes memory code)
    {
        code = abi.encodePacked(
            hex"602061011d0161004f6000397f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc61011d51815580600081816057015260e401523360006001015261011d6000f350fe7f00000000000000000000000000000000000000000000000000000000000000003314156100da573d3560e01c635c60da1b8114610055576359659e9081146100825763f851a44081146100af573d3dfd6100d8565b7f0000000000000000000000000000000000000000000000000000000000000000543d5260203df36100d8565b7fa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50543d5260203df36100d8565b7fb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103543d5260203df35b505b363d3d373d3d363d7f0000000000000000000000000000000000000000000000000000000000000000545af43d600060003e8015610117573d6000f35b3d6000fd50",
            bytes32(uint256(uint160(implementation)))
        );
    }

    /// @dev Internal method used for creating a new contract with the `CREATE`
    /// opcode from the specified bytecode.
    ///
    /// @param bytecode The creation bytecode for the contract.
    /// @return result The address at which the contract is initialized.
    function create_(bytes memory bytecode) private returns (address result) {
        assembly {
            result := create(0, add(bytecode, 0x20), mload(bytecode))
        }
    }

    /// @dev Internal method used for creating a new contract with the `CREATE2`
    /// opcode from the specified bytecode and salt.
    ///
    /// @param bytecode The creation bytecode for the contract.
    /// @param salt The salt used to determine the initialization address.
    /// @return result The address at which the contract is initialized.
    function create2_(bytes memory bytecode, bytes32 salt)
        private
        returns (address result)
    {
        assembly {
            result := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
    }
}
