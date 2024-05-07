
//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Hello_v1 {
    address owner;

    event HelloV1(string message);

    constructor() {
        owner = msg.sender;
    }

    function hello() view external returns (string memory) {
        console.log("Hello_v1.hello is called.");
        // emit HelloV1("Hello V1!");
        return "Hello V1!";
    }
}