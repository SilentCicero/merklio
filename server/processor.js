const { utils, providers, Wallet, Contract } = require('ethers');
const { call, Eth, balanceOf, HttpProvider } = require('ethjs-extras');
const axios = require('axios');

// configuration settings
const {
  infuraMainnetURL,
  infruaID,
  privateKey,
} = require('./config');

// wait method with promise
const wait = time => new Promise(resolve => setTimeout(resolve, time));
const unixtime = () => Math.floor((new Date()).getTime() / 1000);
const one = utils.bigNumberify(1);
const halfHour = 3600 / 2;
const fiveMinutes = 60 * 5;

// mongo setup method
const { connect } = require('./mongo');

// Eth object
const eth = Eth({ provider: new HttpProvider(infuraMainnetURL) });

// provider
const provider = new providers.InfuraProvider("homestead", infruaID);

// setup new ethers wallet
const wallet = new Wallet(privateKey, provider);

// We connect to the Contract using a Provider, so we will only
// have read-only access to the Contract
const merkleioContract = new Contract('0x532d85BD4bD0233dfa0eeD5b3fE8BCFBBa0420A4', [
  'function store(bytes32 hash)',
], provider);
const contractInstance = merkleioContract.connect(wallet);

// hash a group of hashes deterministically
function hashIt(hashes) {
  const masterHash = utils
    .keccak256(`0x${hashes.sort((a, b) => utils.bigNumberify(a).gt(utils.bigNumberify(b))).map(v => v.slice(2)).join('')}`);

  return masterHash;
}

// chunk an array into sub chunks
function chunk(arr, chunkSize) {
  var R = [];

  for (var i=0,len=arr.length; i<len; i+=chunkSize) {
    R.push(arr.slice(i,i+chunkSize));
  }

  return R;
}

// base hash grouping target target (1 => 100 => 100)
const baseTarget = 100;

// previous tx hash
let transactionHash = null;
let hashQueue = [];

// gas prices
let gasPrice = utils.bigNumberify('5000000000'); // set to 3 gwei..
let gasPriceLastChecked = unixtime();

// base gas limit
const gasLimit = utils.bigNumberify('4000000');

// run process
async function runProcess() {
  try {
    // wait a few moments to try again
    await wait(100000);

    // connect mongo, should be instant.. get hashes
    const { Hash, Group } = await connect();

    // wait if transaciton doesn't have a receipt
    if (transactionHash && transactionHash !== '') {
      // check for receipt
      const receipt = await eth.raw('eth_getTransactionReceipt', transactionHash);

      // if receipt, reset tx hash
      if (receipt) transactionHash = null;

      // if there is no receipt for this transaction, we need to wait for this tx to process or timeout in 20..
      if (!receipt) return await runProcess();

      // receipt processed
      console.log('Last transaction receipt detected: ', JSON.stringify(receipt, null, 2));
    }

    // check gas prices every five minutes..
    if (gasPrice === null || (unixtime() - gasPriceLastChecked) > fiveMinutes) {
      try {
        const prices = ((await axios.get('https://ethgasstation.info/json/ethgasAPI.json')) || {}).data || {};
        gasPrice = utils.bigNumberify(((parseInt(prices.safeLow, 10) + 10) * 100000000) || '2000000000');
        gasPriceLastChecked = unixtime();
      } catch (error) {
        console.log('Eth gas station error', error); // dont stop if gas doesn't function..
      }
    }

    // get balance of the current wallet account
    const balance = await eth.balanceOf(wallet.address);

    // if balance is low throw
    if (balance.lt(gasPrice.mul(gasLimit))) {
      console.log('Gas too low!! (balance, price, limit)', balance.toString(10), gasPrice.toString(10), gasLimit.toString(10));

      // run process again..
      return await runProcess();
    }

    // get the oldest hashes that have not been assigned to a merkle tree
    const hashes = (await Hash.find({ a: false })
      .lean().exec())
      .map(hashData => hash._id)
      .filter(hash => hashQueue.indexOf(hash) === -1)// pickup not in local pickups..
      .concat(hashQueue);

    // if no hashes restart process
    if (hashes.length <= 0) return await runProcess();

    // break hashes into initial subgroup chunks
    const chunks = chunk(hashes, baseTarget - 1); // minus one for entropy hash entry
    const depth1 = {};

    // database initial chunks
    for (var i = 0; i < chunks.length; i++) {
      const addEntropyHash = utils.hexlify(utils.randomBytes(32)); // ensure hashes can't be poisoned by override
      const chnk = chunks[i].concat([addEntropyHash]); // get chunk
      const groupMasterHash = hashIt(chnk); // create master hash
      depth1[groupMasterHash] = chnk; // set chunk in object

      // update the hash database.
      await Hash.update({ _id: { $in: chnk }}, { // update hashes
        $set: { m: groupMasterHash }, // remove data and assign to true
      }, { multi: false, upsert: false });

      // save the initial hash group
      const hashGroup = new Group({
        _id: groupMasterHash, // group hash
        g: chnk,
      });
      await hashGroup.save();
    }

    // second round of master hashing
    const depth2 = {};
    const secondHashes = chunk(Object.keys(depth1), baseTarget);
    for (var i = 0; i < chunks.length; i++) {
      const chnk = secondHashes[i];
      const groupMasterHash = hashIt(chnk);
      depth2[groupMaster] = chnk;

      // update the hash database.
      await Group.update({ _id: { $in: chnk }}, { // update hashes
        $set: { m: groupMasterHash }, // remove data and assign to true
      }, { multi: false, upsert: false });

      // save the initial hash group
      const hashGroup = new Group({
        _id: groupMasterHash, // group hash
        g: chnk,
      });
      await hashGroup.save();
    }

    // the new master hash for this set of merkle subgroups
    const secondRoundMasterHashes = Object.keys(depth2);
    const masterHash = hashIt(secondRoundMasterHashes);

    // update the hash database.
    await Group.update({ _id: { $in: secondRoundMasterHashes }}, { // update hashes
      $set: { m: masterHash }, // remove data and assign to true
    }, { multi: false, upsert: false });

    // store master hash on the Ethereum blockchain
    const tx = await contractInstance.store(masterHash);

    // set tx hash
    transactionHash = tx.hash;

    // record main group
    const hashGroup = new Group({
      _id: masterHash, // group hash
      tx: tx.hash,
      g: secondRoundMasterHashes,
    });
    await hashGroup.save();

    // update the hash database.
    await Hash.update({ _id: { $in: hashes }}, {
      $set: { a: true }, // remove data and assign to true
    }, { multi: false, upsert: false });

    // reset hash queue
    hashQueue = [];

    // run the process again
    return await runProcess();
  } catch (error) {
    // process error
    console.log('Process error', error);

    // try the process again
    await runProcess();
  }
}

// app for npm
var APP = {
  init: function() {
    // init started
    console.log('Pickup processing started...');

    // start running the process.
    runProcess();
  }
};

// init
(function(){
  APP.init();
})();
