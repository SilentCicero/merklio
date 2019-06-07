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
