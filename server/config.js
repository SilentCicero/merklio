// SECRET ENV | connect to mongo db.
const mongoUrl = process.env.mongoUrlMerklIO;

// SECRET ENV | private key throw away
const privateKey = process.env.privateKeyMerklIO;

// SECRET ENV | infura and provider details
const infuraID = process.env.infuraIDMerklIO;

// export out
module.exports = {
  mongoUrl,
  privateKey,
  infuraID,
};
