//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Proxy {
    string public name = "Proxy";
    address private implementation;
    address private owner;

    event Delegatecall(address indexed contractAddress, string functionName);
    event UpgradedAtProxy(address indexed contractAddress);

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }


    function getName() public view returns (string memory) {
        return name;
    }

    function upgradeTo(address contractAddress) public onlyOwner returns (bool) {
        console.log("proxy.upgradeTo(contractAddress) is called.");
        console.log("Start changing delegateAddress:%s to address:%s", implementation, contractAddress);
        implementation = contractAddress;
        emit UpgradedAtProxy(contractAddress);
        return true;
    }

    function getImplementation() public view returns (address) {
        return implementation;
    }

    fallback(bytes calldata data) external returns (bytes memory){
        console.log("proxy.fallback() is called.");
        require(implementation != address(0), "Proxy: no implementation address set");
        require(msg.data.length > 0, "Proxy: no function to call");
        require(owner != address(0), "Proxy: owner is not set");
        require(msg.sender == owner, "Proxy: caller is not the owner");

        (bool success, bytes memory result) = address(implementation).call(data);
        require(success, "Proxy:Delegatecall failed.");
        emit Delegatecall(address(implementation), "fallback()");

        return result;
    }
}

contract ProxyWallet {
    string public name = "Wallet";
    address public owner;
    Proxy private proxy;

    event UpgradedAtWallet(address indexed contractAddress, string PQCSignature);
    event Delegatecall(address indexed contractAddress, string functionName);
    event CallResult(string functionName, string result);

    constructor() {
        owner = msg.sender;
        proxy = new Proxy(address(this));
    }

    function getName() public view returns (string memory) {
        return name;
    }

    function getProxyName() public view returns (string memory) {
        return proxy.getName();
    }

    function getProxy() public view returns (Proxy) {
        return proxy;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    function bytes32ToString(bytes32 _bytes32) private pure returns (string memory) {
        bytes memory bytesArray = new bytes(32);
        for (uint256 i; i < 32; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    function verifyOwnerByPQCSignature(string memory data) private view onlyOwner returns (bool) {
        // NOTE: this code is example. For verifying owner, use quantum-resistant signature/data
        bytes32 hash1 = keccak256(abi.encodePacked(data));
        bytes32 hash2 = keccak256(abi.encodePacked('I_AM_OWNER'));

        console.log("hash1: %s, hash2: %s", bytes32ToString(hash1), bytes32ToString(hash2));
        return hash1 == hash2;
    }

    function upgrade(address contractAddress, string memory PQCsignature) external {
        // check if PQCsig is valid
        console.log("proxy.upgrade(contractAddress, PQCsignature) is called.", contractAddress, PQCsignature);
        require(verifyOwnerByPQCSignature(PQCsignature) == true, "Ownable: caller is not the owner");
        console.log("proxy.upgradeContractAddress(contractAddress) is called.");
        proxy.upgradeTo(contractAddress);
        console.log("proxy.upgradeTo(contractAddress) is called.");
        emit UpgradedAtWallet(contractAddress, PQCsignature);
    }

    function callHello() external returns (string memory) {
        console.log("proxy.callHello() is called.");
        (bool success, bytes memory data) = address(proxy).call(abi.encodeWithSignature("hello()"));
        require(success, "callHello():Delegatecall failed.");
        emit Delegatecall(address(proxy), "callHello()");

        string memory returnValue = "";
        if (success) {
            (returnValue) = abi.decode(data, (string));
        }
        emit CallResult("callHello()", returnValue);
        return returnValue;
    }

    function delegatecall() external returns (int){
        console.log("proxy.delegatecall() is called.");
        (bool success, bytes memory data) = address(proxy).delegatecall(abi.encodeWithSignature("hello()"));
        require(success, "delegateCall():Delegatecall failed.");
        emit Delegatecall(address(proxy), "delegatecall()");
        int returnValue = 0;
        if (success) {
            (returnValue) = abi.decode(data, (int));
        }
        return returnValue;
    }
}

