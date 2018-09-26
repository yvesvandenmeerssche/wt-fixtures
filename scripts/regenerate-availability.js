const fs = require('fs'),
  path = require('path'),
  Chance = new (require('chance'))(),
  config = require('./config'),
  generators = require('./lib/generators');

function log (msg) {
  console.log(msg);
}

function main () {
  const hotelPath = process.argv[2];
  if (!hotelPath) {
    throw new Error('Usage: node regenerate-availability.js <path-to-hotel-dir>');
  }
  log(`Updating availability definition at ${hotelPath}`);
  const hotelData = require(path.join(hotelPath, 'definition.json'));
  if (!hotelData) {
    throw new Error(`${hotelPath} does contains broken definition.json`);
  }
  hotelData.availability = generators.generateAvailability(hotelData.description);
  fs.writeFileSync(path.join(hotelPath, 'definition.json'),
      JSON.stringify(hotelData, null, '  '));
  log('Done.');
}

main();
