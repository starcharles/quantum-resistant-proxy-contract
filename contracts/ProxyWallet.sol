//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Proxy {
    string public name = "Proxy";
    address public implementation;

    event UpgradedAtProxy(address indexed contractAddress);

    function getName() public view returns (string memory) {
        return name;
    }

    function upgradeTo(address contractAddress) public returns (bool) {
        console.log("proxy.upgradeTo(contractAddress) is called.");
        console.log("Start changing delegateAddress:%s to address:%s", implementation, contractAddress);
        implementation = contractAddress;
        emit UpgradedAtProxy(contractAddress);
        return true;
    }


    fallback() external {
        address impl = implementation;

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }
}

contract ProxyWallet {
    string public name = "Wallet";
    address public owner;
    Proxy internal proxy;

    event UpgradedAtWallet(address indexed contractAddress, string PQCSignature);

    constructor() {
        owner = msg.sender;
        proxy = new Proxy();
    }

    function getName() public view returns (string memory) {
        return name;
    }

    function getProxyName() public view returns (string memory) {
        return proxy.getName();
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    function verifyOwnerByPQCSignature(string memory data) private view isOwner returns (bool) {
        // NOTE: this code is example. For verifying owner using quantum-resistant signature/data
        return keccak256(abi.encodePacked(data)) == keccak256(abi.encodePacked('I_AM_OWNER'));
    }

    function upgrade(address contractAddress, string memory PQCsignature) external {
        // check if PQCsig is valid
        require(verifyOwnerByPQCSignature(PQCsignature),"Ownable: caller is not the owner");
        console.log("proxy.upgradeContractAddress(contractAddress) is called.");
        proxy.upgradeTo(contractAddress);
        console.log("proxy.upgradeContractAddress(contractAddress) is ended.");
        emit UpgradedAtWallet(contractAddress, PQCsignature);
    }

    function delegatecall(address contractAddress, bytes calldata data) external returns (bool) {
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), contractAddress, 0, calldatasize(), 0, 0)
        }
        return true;
    }
}

