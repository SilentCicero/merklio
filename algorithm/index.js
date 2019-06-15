const { utils } = require('ethers');

const hashes = (new Array(100000)).fill(0).map(() => utils.hexlify(utils.randomBytes(32)));
const baseTarget = 20;

function hashIt(hashes) {
  const masterHash = utils
    .keccak256(`0x${hashes.sort((a, b) => utils.bigNumberify(a).gt(utils.bigNumberify(b))).map(v => v.slice(2)).join('')}`);

  return masterHash;
}

function chunk(arr, chunkSize) {
  var R = [];

  for (var i=0,len=arr.length; i<len; i+=chunkSize) {
    R.push(arr.slice(i,i+chunkSize));
  }

  return R;
}

function hashesToTree(hashes, baseTarget) {
  const chunks = chunk(hashes, baseTarget || 100);
  const depth1 = {};
  chunks.map(chnk => (depth1[hashIt(chnk)] = chnk));

  const depth2 = {};
  chunk(Object.keys(depth1), baseTarget || 100)
    .map(chunkGroup => (depth2[hashIt(chunkGroup)] = chunkGroup
      .reduce((acc, v) => Object.assign(acc, { [v]: depth1[v] }), {})));

  return { [hashIt(Object.keys(depth2))]: depth2 };
}

console.log(hashesToTree(hashes, 100));


/*

{
  "0xf23d827602a43bbc3f49d4ae58aa68ac6c225ffbc5ced4ca0e5d32be5def0819": {
    "0x5eeec7bbf208105e1ee603d23fc6dc4f820cfb8edcb7c466901978a146b580c9": {
      "0xa4c006a07935466210c28b5d4ac0b8217044df8ff65e2bfc9f5b4c7e483eff62": [
        "0x4ecbe77206d9e8c13f9dffb77c4232862d72ab38f19b533ce69ab31d06ddcc11",
        "0xe68a49f302a0c9a7f3aa74a241cefc242e48a60df85ba1abe7fca7b6ac6f69bf"
      ]
    }
  }
}

[
  "0x4ecbe77206d9e8c13f9dffb77c4232862d72ab38f19b533ce69ab31d06ddcc11",
  "0xe68a49f302a0c9a7f3aa74a241cefc242e48a60df85ba1abe7fca7b6ac6f69bf"
]

[ '0xa4c006a07935466210c28b5d4ac0b8217044df8ff65e2bfc9f5b4c7e483eff62' ]

[ '0x5eeec7bbf208105e1ee603d23fc6dc4f820cfb8edcb7c466901978a146b580c9' ]

[ '0xf23d827602a43bbc3f49d4ae58aa68ac6c225ffbc5ced4ca0e5d32be5def0819' ]

*/
