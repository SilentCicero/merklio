## Merkl

A free merkle-based notarization and proofing API micro-service for the Etheruem blockchain.

## About

Submit 32 byte hashes for free to an API and have them merklized with the Merkle tree master hash published on the Ethereum public blockchain.

All merkle master hashes are submitted to a recording smart-contract where other contracts can interact with the proofs if need be.

## Motivation

This service can be used to notarize any data, document or action by virtue of deterministic merkle proofing system and the Ethereum blockchain.

## Progress

**Still working on this, none of the API's work just yet**

## Example

```js
const axios = require('axios');

/*
This is the Best-Case example of the service!

Add a new hash to be merklized (GET or POST works here)
*/

axios.get('https://merkl.io/add/', {
  hash: '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
});

// timestamp serer signature

{
  signature: '0x...',
  timestamp: 190234824, // timestamp submitted
}

/*
Get hash status or proof
*/

axios.get('https://merkl.io/status/0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14');

// returns this

{
  status: 'pending',
}

// or

{
  status: 'transacted',
  transactionHash: '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
  masterHash: '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
  proof: {
    '0xfb4918a34258835278c9e4bbc6a653e4635a1727567e71bb5f5bc90cd4182fbf': {
      '0x11105bb2d695e056d31777f0ce726de0335ff66a3f66ece9ab91f7b89a788bc2': [
        '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
        '0x3c8df9b2c11aa3d7fc06ef9f45e9c571e024ab5747121787d1dfdf5e251fcef0',
      ],
    },
  };
}

```

## Hashing and Merkle Algorithm

Hashes are chunked into groups of 100 or less, than the method below is used to sort them, concat them in a string and hash them with keccak256.

From there a second depth of grouping (of 100 of less) and hashing occurs of the master hashes using the same sorting and concating algorithm.

Lastly, a master hash is rendered from the second depth master hashes.

```js
// hash a group of hashes deterministically
function hashIt(hashes) {
  const masterHash = utils
    .keccak256(`0x${hashes.sort((a, b) => utils.bigNumberify(a).gt(utils.bigNumberify(b))).map(v => v.slice(2)).join('')}`);

  return masterHash;
}
```

## Smart Contract (Solidity)

The solidity smart-contract includes logging of block the hash existence mapping to both timestamp and block number.

```js
pragma solidity ^0.5.1;

// Author: SilentCicero @IAmNickDodson
contract MerklIO {
    address public owner = msg.sender;
    mapping(bytes32 => uint256) public hashToTimestamp; // hash => block timestamp
    mapping(bytes32 => uint256) public hashToNumber; // hash => block number

    event Hashed(bytes32 indexed hash); // logit

    function store(bytes32 hash) external { // store hash
         // owner is merklio
        assert(msg.sender == owner);

        // hash has not been set
        assert(hashToTimestamp[hash] <= 0);

        // set hash to timestamp and blocknumber
        hashToTimestamp[hash] = block.timestamp;
        hashToNumber[hash] = block.number;

        // emit log for tracking
        emit Hashed(hash);
    }

    function changeOwner(address ownerNew) external {
        // sender is owner
        assert(msg.sender == owner);

        // set new owner
        owner = ownerNew;
    }
}
```

## License

```
Copyright 2019 Nick Dodson <thenickdodson@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
