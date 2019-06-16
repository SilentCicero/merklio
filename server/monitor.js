// require global packages
const { utils, providers } = require('ethers');

// mongo setup method
const { connect } = require('./mongo');

// Notify lambda
module.exports = async () => {
  try {


    // connect mongo
    const { Hash, Group } = await connect();

    const hashes = await Hash.aggregate([
      {"$match" : {"c":{"$gt":new Date(Date.now() - 25*60*60 * 1000)}}},
      {"$sort":{ "createdAt": -1 }},
    ]);

    /*
    // update the hash database.
    await Hash.updateMany({ _id: { $in: hashes.map(data => data._id) }}, {
      $set: { a: false }, // remove data and assign to true
    }, { multi: true, upsert: false });
    */

    console.log('reset!');
  } catch (error) {
    console.log(error);
  }
}

module.exports();
