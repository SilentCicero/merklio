// require global packages
const { utils, providers } = require('ethers');
const { json, send } = require('micro');
const Joi = require('joi');
const query = require('micro-query');

// mongo setup method
const { connect } = require('./mongo');

// validate notify
const validationSchema = {
  hash: Joi.string().regex(/^0x[0-9a-fA-F]{64}$/).required(),
};

// Notify lambda
module.exports = async (req, res) => {
  try {
    // intercept and parse post body
    const body = req.method === 'GET' ? (await query(req)) : (await json(req));
    const {
      hash,
    } = body;

    // joi validate the body
    const { error } = Joi.validate(body, validationSchema);
    if (error) throw new Error(error);

    // connect mongo
    const { Hash } = await connect();

    // find if Tx has already been processed.
    const findHash = (await Hash.find({ _id: hash }).limit(1).lean().exec()).pop();

    // ensure hash is not already in the database
    if (!((findHash || {})._id)) throw new Error('No hash found');

    // if hash found but not transacted
    if (findHash.a === false) return send(res, 200, { status: 'pending' });

    // if hash is assigned
    let result = {
      hash,
      status: 'pending',
    };

    // group a
    const groupA = (await Group.find({ _id: findHash.m }).limit(1).lean().exec()).pop();
    const groupB = (await Group.find({ _id: groupA.m }).limit(1).lean().exec()).pop();
    const groupC = (await Group.find({ _id: groupB.m }).limit(1).lean().exec()).pop();

    // return proof for now
    result.proof = {
      groupA,
      groupB,
      groupC,
    };

    // return true
    send(res, 200, result);
  } catch (error) {
    send(res, 400, error.message);
  }
}
