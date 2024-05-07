
//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Hello_v2 {
    address owner;

    constructor() {
        owner = msg.sender;
    }

    function hello() pure external returns (string memory){
        return "Hello V2!";
    }
}