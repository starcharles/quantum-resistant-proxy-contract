//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Proxy {
    address private implementation;

    event Upgraded(address indexed contractAddress);

    function upgradeTo(address contractAddress) public {
        console.log("proxy.upgradeTo(contractAddress) is called.");
        console.log("Start changing delegateAddress:%s to address:%s", implementation, contractAddress);
        implementation = contractAddress;
        emit Upgraded(contractAddress);
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

    constructor() {
        owner = msg.sender;
        proxy = new Proxy();
    }

    function getName() public view returns (string memory) {
        return name;
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
        require(verifyOwnerByPQCSignature(PQCsignature));
        console.log("proxy.upgradeContractAddress(contractId, contractAddress) is called.");
        proxy.upgradeTo(contractAddress);
        console.log("proxy.upgradeContractAddress(contractId, contractAddress) is ended.");
    }

}