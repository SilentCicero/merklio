// SECRET ENV | connect to mongo db.
const mongoUrl = process.env.mongourlmerklio;

// SECRET ENV | private key throw away
const privateKey = process.env.privatekeymerklio;

// SECRET ENV | infura and provider details
const infuraID = process.env.infuraidmerklio;

// Main infura URL
const infuraMainnetURL = `https://mainnet.infura.io/v3/${infuraID}`;

// export out
module.exports = {
  mongoUrl,
  privateKey,
  infuraID,
  infuraMainnetURL,
};
