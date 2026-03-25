// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SampleContract
 * @dev A simple smart contract for Shardeum testnet demonstration.
 *      Stores a message string and allows reading and updating it.
 */
contract SampleContract {
    string public message;
    address public owner;
    uint256 public deployedAt;
    uint256 public updateCount;

    event MessageUpdated(string oldMessage, string newMessage, address updatedBy);
    event ContractDeployed(address owner, string initialMessage, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    /**
     * @dev Constructor sets the initial message and marks the deployer as owner.
     * @param _initialMessage The first message to store in the contract.
     */
    constructor(string memory _initialMessage) {
        owner = msg.sender;
        message = _initialMessage;
        deployedAt = block.timestamp;
        updateCount = 0;

        emit ContractDeployed(owner, _initialMessage, block.timestamp);
    }

    /**
     * @dev Returns the current message stored in the contract.
     */
    function getMessage() public view returns (string memory) {
        return message;
    }

    /**
     * @dev Updates the stored message. Only the contract owner can do this.
     * @param _newMessage The new message to store.
     */
    function setMessage(string memory _newMessage) public onlyOwner {
        require(bytes(_newMessage).length > 0, "Message cannot be empty");
        string memory oldMessage = message;
        message = _newMessage;
        updateCount++;
        emit MessageUpdated(oldMessage, _newMessage, msg.sender);
    }

    /**
     * @dev Returns summary info about the contract state.
     */
    function getInfo() public view returns (
        string memory currentMessage,
        address contractOwner,
        uint256 timeSinceDeploy,
        uint256 totalUpdates
    ) {
        return (
            message,
            owner,
            block.timestamp - deployedAt,
            updateCount
        );
    }
}
