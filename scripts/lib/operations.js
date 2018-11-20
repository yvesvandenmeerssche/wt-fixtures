const fs = require('fs'),
  path = require('path'),
  Chance = new (require('chance'))(),
  utils = require('./utils'),
  generators = require('./generators'),
  swarmClient = require('./swarm-client'),
  writeApiClient = require('./write-api-client'),
  config = require('../config');

/**
 * Download all previously uploaded data.
 *
 * This serves two purposes related to Swarm's occasional
 * flakiness:
 *
 * a) check that the upload was actually successful
 * b) cache the data on the node by requesting it (useful when
 *    using a custom node)
 *
 */
async function verifyUpload (uploadedHotels) {
  utils.log('Veryfing upload');
  const errors = [];
  for (let hotel in uploadedHotels) {
    utils.log(`\t${hotel}`);
    try {
      await writeApiClient.downloadHotelData(uploadedHotels[hotel].address);
    } catch (err) {
      errors.push({ hotel: uploadedHotels[hotel].address, error: err });
    }
    for (let imageHash of uploadedHotels[hotel].images) {
      try {
        await swarmClient.downloadSwarmDocument(imageHash);
      } catch (err) {
        errors.push({ image: imageHash, error: err });
      }
    }
  }
  if (errors.length > 0) {
    utils.log('Done - there were some errors.');
    utils.log(errors);
  } else {
    utils.log('Done - everything is allright.');
  }
}

async function getAccessKey () {
  let accessKey;
  if (!config.WT_WRITE_API_ACCESS_KEY) {
    utils.log('Creating a new account in WT write API...');
    accessKey = await writeApiClient.createAccount();
    utils.log(`Obtained access key: ${accessKey}`);
  } else {
    accessKey = config.WT_WRITE_API_ACCESS_KEY;
  }
  return accessKey;
}

async function generate () {
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

async function regenerateTimeBasedData (hotelPath, what) {
  if (['availability', 'cancellationPolicies', 'ratePlans', 'all'].indexOf(what) < 0) {
    throw new Error(`Uknown piece of data to be regenerated: ${what}`);
  }
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
    case 'all':
      hotelData.availability = generators.generateAvailability(hotelData.description);
      hotelData.description.cancellationPolicies = generators.generateCancellationPolicies();
      hotelData.ratePlans = generators.generateRatePlans(hotelData.description);
      break;
  }
  
  fs.writeFileSync(path.join(hotelPath, 'definition.json'),
      JSON.stringify(hotelData, null, '  '));
}

async function bulkCreate (dataPath) {
  const accessKey = await getAccessKey();
  const uploadedHotels = {};
  const hotels = fs.readdirSync(dataPath).filter((x) =>
    fs.lstatSync(path.join(dataPath, x)).isDirectory());
  for (let hotel of hotels) {
    utils.log(`\n\n=== Processing ${hotel} ===\n`);
    uploadedHotels[hotel] = { images: [], data: null };
    const hotelPath = path.join(dataPath, hotel),
      imagePath = path.join(hotelPath, 'images'),
      images = {};
    for (let image of fs.readdirSync(imagePath)) {
      utils.log(`Uploading ${image}`);
      images[image] = await swarmClient.uploadImage(path.join(imagePath, image));
      uploadedHotels[hotel].images.push(images[image]);
    }
    utils.log('Uploading hotel data');
    const hotelData = require(path.join(hotelPath, 'definition.json')),
      hotelAddress = await writeApiClient.createHotel(hotelData, images, accessKey);
    uploadedHotels[hotel].address = hotelAddress;
    utils.log(`\t${hotelAddress}`);
  }

  if (config.VERIFY_UPLOAD) {
    await verifyUpload(uploadedHotels);
  }
}

async function update (hotelPath, address) {
  const accessKey = await getAccessKey();
  const uploadedHotels = {};
  const imagePath = path.join(hotelPath, 'images'),
    images = {};
  uploadedHotels[hotelPath] = { images: [], data: null };
  for (let image of fs.readdirSync(imagePath)) {
    utils.log(`Uploading ${image}`);
    images[image] = await swarmClient.uploadImage(path.join(imagePath, image));
    uploadedHotels[hotelPath].images.push(images[image]);
  }
  utils.log('Uploading hotel data');
  const hotelData = require(path.join(hotelPath, 'definition.json'));
  await writeApiClient.updateHotel(address, hotelData, images, accessKey);
  uploadedHotels[hotelPath].address = address;
  utils.log(`\t${address}`);

  if (config.VERIFY_UPLOAD) {
    await verifyUpload(uploadedHotels);
  }
}


module.exports = {
  generate,
  regenerateTimeBasedData,
  bulkCreate,
  update,
}