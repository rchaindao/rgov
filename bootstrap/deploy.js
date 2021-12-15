#!/usr/local/bin/node

const rchainToolkit = require('rchain-toolkit');
const fs = require('fs');

const ALLNETWORKS = require('./networks');
const network_argument = 'localhost';

let privateKey;
try {
  privateKey = fs.readFileSync('./PrivateKeys/pk.bootstrap', 'utf8');
} catch (err) {
  console.error(err);
}
const publicKey = rchainToolkit.utils.publicKeyFromPrivateKey(privateKey);

const rholang_files = process.argv.slice(2);

const deploy = async (rholang_f) => {
const rholang = fs.readFileSync(rholang_f, 'utf8');
  const validAfterBlockNumber = await rchainToolkit.http.validAfterBlockNumber(
    ALLNETWORKS[network_argument].observerBase,
  );

  const deployOptions = rchainToolkit.utils.getDeployOptions(
    "secp256k1",
    new Date().valueOf(),
    rholang,
    privateKey,
    publicKey,
    1,
    100000,
    validAfterBlockNumber
  );

  let deployResponse;
  try {
    deployResponse = await rchainToolkit.http.deploy(
      ALLNETWORKS[network_argument].observerBase,
      deployOptions
    );
  } catch (err) {
    console.log(err);
  }

  console.log(deployResponse);
};

for (let i = 0; i < rholang_files.length; i++) {
deploy(rholang_files[i]);
}