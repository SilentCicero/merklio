// SECRET ENV | connect to mongo db.
const mongoUrl = process.env.mongoUrlMerklIO;

// SECRET ENV | private key throw away
const privateKey = process.env.privateKeyMerklIO;

// SECRET ENV | infura and provider details
const infuraID = process.env.infuraIDMerklIO;

// Main infura URL
const infuraMainnetURL = `https://mainnet.infura.io/v3/${infuraID}`;

// export out
module.exports = {
  mongoUrl,
  privateKey,
  infuraID,
  infuraMainnetURL,
};
