const path = require('path'),
  config = require('./config'),
  utils = require('./lib/utils'),
  operations = require('./lib/operations');


async function main () {
  const hotelPath = process.argv[2];
  const address = process.argv[3];
  if (! hotelPath && ! address) {
    throw new Error('Usage: node update.js <path-to-hotel-dir> <address>');
  }
  utils.log(`\n\n=== Processing ${hotelPath} for ${address} ===\n`);
  operations.update(path.resolve(hotelPath), address);
}

main();
