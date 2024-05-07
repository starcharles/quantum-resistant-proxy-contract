//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Hello_v1.sol";
import "hardhat/console.sol";

contract Proxy {
    mapping(uint => address) private contracts;

    function upgradeContractAddress(uint contractId, address contractAddress) private returns (bool) {

        console.log("Changing contracts of contractId:%s to address:%s", contractId, contractAddress);

        contracts[contractId] = contractAddress;

        require(contractAddress == contracts[contractId]);

        console.log("finish changing contracts of contractId:%s to address:%s", contractId, contracts[contractId]);

        return true;
    }


    fallback() external {
        // TODO: contractsからaddressを取り出してメソッドを呼び出す
        //   address contractAddress = contracts[contractId];

    }
}

contract Wallet {
    address public owner;
    Proxy internal proxy;

    constructor() {
        owner = msg.sender;
        proxy = new Proxy();
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    function verifyOwnerByPQCSignature(string memory data) public isOwner {
        // NOTE: this code is example. For verifying owner using quantum-resistant signature/data
        return data == 'I_AM_OWNER';
    }

    function upgrade(uint contractId, address contractAddress, string memory PQCsignature) public verifyOwnerByPQCSignature() {
        // check if PQCsig is valid
        require(verifyOwnerByPQCSignature(PQCsignature));
        console.log("proxy.upgradeContractAddress(contractId, contractAddress) is called.");
        proxy.upgradeContractAddress(contractId, contractAddress);
    }

}