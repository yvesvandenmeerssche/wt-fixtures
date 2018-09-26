const fs = require('fs'),
  path = require('path'),
  Chance = new (require('chance'))(),
  config = require('./config'),
  generators = require('./lib/generators');

function log (msg) {
  console.log(msg);
}

function main () {
  const cnt = new Number(process.argv[2]);
  if (isNaN(cnt)) {
    throw new Error('Usage: node generate.js <cnt>');
  }
  if (!fs.existsSync(config.DATA_PATH_GENERATED)) {
    fs.mkdirSync(config.DATA_PATH_GENERATED);
  }
  log(`Generating ${cnt} hotels in ${config.DATA_PATH_GENERATED}...`);
  for (let i = 0; i < cnt; i++) {
    // 1. Generate a hotel definition and collect all images to a single array.
    const name = Chance.word({ length: Chance.natural({ min: 5, max: 12 }) }),
      definition = generators.generateHotelDefinition();
    let images = definition.description.images.slice();
    for (let roomTypeId in definition.description.roomTypes) {
      images = [...images, ...definition.description.roomTypes[roomTypeId].images];
    }

    // 2. Write the generated data to disk.
    const hotelPath = path.join(config.DATA_PATH_GENERATED, name);
    fs.mkdirSync(hotelPath);
    fs.writeFileSync(path.join(hotelPath, 'definition.json'),
      JSON.stringify(definition, null, '  '));
    fs.mkdirSync(path.join(hotelPath, 'images'));
    for (let imageId of new Set(images)) {
      fs.symlinkSync(generators.IMAGES[imageId], path.join(hotelPath, 'images', imageId));
    }
  }
  log('Done.');
}

main();
