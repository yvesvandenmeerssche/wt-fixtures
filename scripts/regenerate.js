const path = require('path'),
  config = require('./config'),
  utils = require('./lib/utils'),
  operations = require('./lib/operations');

function main () {
  const hotelPath = process.argv[2];
  const what = process.argv[3];
  if (!hotelPath || !what) {
    throw new Error('Usage: node regenerate.js <path-to-hotel-dir> [availability|cancellationPolicies|ratePlans|all] ');
  }
  utils.log(`Updating ${what} definition at ${hotelPath}`);
  operations.regenerateTimeBasedData(path.resolve(hotelPath), what);
  utils.log('Done.');
}

main();
