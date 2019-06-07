// require global packages
const { utils, providers } = require('ethers');
const { json, send } = require('micro');
const Joi = require('joi');

// mongo setup method
const { connect } = require('./mongo');

// signer key
const privateKey = new utils.SigningKey(process.env.hashthatprivatekey);

// validate notify
const validationSchema = {
  hash: Joi.string().regex(/^0x[0-9a-fA-F]{64}$/).required(),
};

// Notify lambda
module.exports = async (req, res) => {
  try {
    // intercept and parse post body
    const body = await json(req);
    const {
      hash,
    } = body;

    // joi validate the body
    const { error } = Joi.validate(body, validationSchema);
    if (error) throw new Error(error);

    // connect mongo
    const { Hash } = await connect();

    // find if Tx has already been processed.
    const findHash = (await Hash.find({ _id }, '_id').limit(1).lean().exec()).pop();

    // setup date before resolver call
    const date = new Date();
    const timestamp = Math.round(date.getTime() / 1000);

    // buiild payload (minimized for data )
    const payload = {
      hash,
      timestamp,
    };

    // signed digest
    const signature = utils
      .joinSignature(privateKey
          .signDigest(utils.keccak256(utils.toUtf8Bytes(JSON.stringify(payload)))));

    // ensure hash is not already in the database
    if (findHash || (findHash || {})._id) return send(res, 200, { s: signature, t: findHash.c });

    // cache the transaction for pickup..
    const saveHash = new Hash({
      _id: hash
      a: false,
      c: date, // created
    });
    await saveHash.save();

    // return true
    send(res, 200, { s: signature, t: timestamp });
  } catch (error) {
    send(res, 400, error.message);
  }
}
