
//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Hello_v2 {
    address owner;

    event HelloV2(string message);

    constructor() {
        owner = msg.sender;
    }

    function hello() view external returns (string memory){
        console.log("Hello_v2.hello is called.");
        // emit HelloV2("Hello V2!");
        return "Hello V2!";
    }
}