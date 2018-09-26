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
  const what = process.argv[3];
  if (!hotelPath || !what ||
    (what !== 'availability' && what != 'cancellationPolicies' && what !== 'ratePlans')
    ) {
    throw new Error('Usage: node regenerate.js <path-to-hotel-dir> [availability|cancellationPolicies|ratePlans] ');
  }
  log(`Updating ${what} definition at ${hotelPath}`);
  const hotelData = require(path.join(hotelPath, 'definition.json'));
  if (!hotelData) {
    throw new Error(`${hotelPath} contains broken definition.json`);
  }
  switch (what) {
    case 'availability':
      hotelData.availability = generators.generateAvailability(hotelData.description);
      break;
    case 'cancellationPolicies':
      hotelData.description.cancellationPolicies = generators.generateCancellationPolicies();
      break;
    case 'ratePlans':
      hotelData.ratePlans = generators.generateRatePlans(hotelData.description);
      break;
  }
  
  fs.writeFileSync(path.join(hotelPath, 'definition.json'),
      JSON.stringify(hotelData, null, '  '));
  log('Done.');
}

main();
