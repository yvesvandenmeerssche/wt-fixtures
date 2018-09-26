const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const config = require('./config');

function log (msg) {
  console.log(msg);
}

function getHttpModule (method) {
  if (method === 'http') {
    return http;
  } else if (method === 'https') {
    return https;
  } else {
    throw new Error(`Unknown method: ${config.SWARM_PROVIDER.method}`);
  }
}

function sendRequest (protocol, method, hostname, port, path, headers, sendData) {
  headers = headers || {};
  const httpModule = getHttpModule(protocol),
    data = [];
  return new Promise((resolve, reject) => {
    const opts = { method, hostname, port, path, headers },
      request = httpModule.request(opts, (response) => {
        response.on('data', chunk => data.push(chunk));
        response.on('end', () => {
          if (response.statusCode > 299) {
            log(String(Buffer.concat(data)));
            reject(new Error(`Error ${response.statusCode}`));
          }
          resolve(Buffer.concat(data));
        });
      });
    if (sendData) {
      request.write(sendData);
    }
    request.on('error', err => reject(err));
    request.end();
  });
}

/**
 * Download a document from swarm.
 */
function downloadSwarmDocument (hash) {
  const protocol = config.SWARM_PROVIDER.method,
    method = 'GET',
    hostname = config.SWARM_PROVIDER.host,
    port = config.SWARM_PROVIDER.port,
    path = `/bzz-raw:/${hash}`;
  return sendRequest(protocol, method, hostname, port, path);
}

/**
 * Download hotel data from the write API.
 */
function downloadHotelData (address) {
  const protocol = config.WT_WRITE_API.method,
    method = 'GET',
    hostname = config.WT_WRITE_API.host,
    port = config.WT_WRITE_API.port,
    path = `/hotels/${address}`;
  return sendRequest(protocol, method, hostname, port, path);
}

/**
 * Upload an image to Swarm.
 */
async function uploadImage (imagePath) {
  const imageBuffer = fs.readFileSync(imagePath),
    protocol = config.SWARM_PROVIDER.method,
    method = 'POST',
    hostname = config.SWARM_PROVIDER.host,
    port = config.SWARM_PROVIDER.port,
    path = '/bzz-raw:/',
    headers = {
      'Content-Type': 'application/octet-stream',
      'Content-Length': imageBuffer.length,
    },
    data = await sendRequest(protocol, method, hostname, port, path, headers, imageBuffer);

    return String(data);
}

/**
 * Replace images with their actual URLs.
 */
function preprocessHotel (data, images) {
  const swarm = config.SWARM_PROVIDER,
    convert = (x) => `${swarm.method}://${swarm.host}:${swarm.port}/bzz-raw:/${images[x]}`;
  data.description.images = data.description.images.map(convert);
  for (let roomTypeId in data.description.roomTypes) {
    const roomType = data.description.roomTypes[roomTypeId];
    roomType.images = roomType.images.map(convert);
  }
  if (config.WT_UPDATE_API) {
    data.notifications = config.WT_UPDATE_API;
  }
  return data;
}

/**
 * Upload hotel via the WT Write API.
 */
async function createHotel (rawData, images, accessKey) {
  const hotelData = JSON.stringify(preprocessHotel(rawData, images)),
    writeApi = config.WT_WRITE_API,
    protocol = writeApi.method,
    method = 'POST',
    hostname = writeApi.host,
    port = writeApi.port,
    path = '/hotels/',
    headers = {
      'Content-Type': 'application/json',
      'X-Access-Key': accessKey,
      'X-Wallet-Password': config.WT_WRITE_API_WALLET_PASSWORD,
    },
    data = await sendRequest(protocol, method, hostname, port, path, headers, hotelData);

    return JSON.parse(String(data)).address;
}

/**
 * Update a hotel via WT Write API
 */
async function updateHotel (address, rawData, images, accessKey) {
  const hotelData = JSON.stringify(preprocessHotel(rawData, images)),
    writeApi = config.WT_WRITE_API,
    protocol = writeApi.method,
    method = 'PATCH',
    hostname = writeApi.host,
    port = writeApi.port,
    path = `/hotels/${address}`,
    headers = {
      'Content-Type': 'application/json',
      'X-Access-Key': accessKey,
      'X-Wallet-Password': config.WT_WRITE_API_WALLET_PASSWORD,
    };
    return sendRequest(protocol, method, hostname, port, path, headers, hotelData);
}

/**
 * Create a new account in the configured WT Write API.
 */
async function createAccount () {
  const accountData = `{"wallet": ${config.WT_WRITE_API_WALLET}, "uploaders": {"root": {"swarm": {}}}}`,
    protocol = config.WT_WRITE_API.method,
    method = 'POST',
    hostname = config.WT_WRITE_API.host,
    port = config.WT_WRITE_API.port,
    path = '/accounts/',
    headers = {
      'Content-Type': 'application/json',
    },
    data = await sendRequest(protocol, method, hostname, port, path, headers, accountData);

    return JSON.parse(String(data)).accessKey;
}

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
  log('Veryfing upload');
  const errors = [];
  for (let hotel in uploadedHotels) {
    log(`\t${hotel}`);
    try {
      await downloadHotelData(uploadedHotels[hotel].address);
    } catch (err) {
      errors.push({ hotel: uploadedHotels[hotel].address, error: err });
    }
    for (let imageHash of uploadedHotels[hotel].images) {
      try {
        await downloadSwarmDocument(imageHash);
      } catch (err) {
        errors.push({ image: imageHash, error: err });
      }
    }
  }
  if (errors.length > 0) {
    log('Done - there were some errors.');
    log(errors);
  } else {
    log('Done - everything is allright.');
  }
}

async function getAccessKey() {
  let accessKey;
  if (!config.WT_WRITE_API_ACCESS_KEY) {
    log('Creating a new account in WT write API...');
    accessKey = await createAccount();
    log(`Obtained access key: ${accessKey}`);
  } else {
    accessKey = config.WT_WRITE_API_ACCESS_KEY;
  }
  return accessKey;
}

async function bulkCreate (dataset) {
  let dataPath;
  if (dataset === 'curated') {
    dataPath = config.DATA_PATH_CURATED;
  } else if (dataset === 'generated') {
    dataPath = config.DATA_PATH_GENERATED;
  } else {
    throw new Error('Usage: node upload.js bulk-create [curated|generated]');
  }

  const accessKey = await getAccessKey();
  const uploadedHotels = {};
  const hotels = fs.readdirSync(dataPath).filter((x) =>
    fs.lstatSync(path.join(dataPath, x)).isDirectory());
  for (let hotel of hotels) {
    log(`\n\n=== Processing ${hotel} ===\n`);
    uploadedHotels[hotel] = { images: [], data: null };
    const hotelPath = path.join(dataPath, hotel),
      imagePath = path.join(hotelPath, 'images'),
      images = {};
    for (let image of fs.readdirSync(imagePath)) {
      log(`Uploading ${image}`);
      images[image] = await uploadImage(path.join(imagePath, image));
      uploadedHotels[hotel].images.push(images[image]);
    }
    log('Uploading hotel data');
    const hotelData = require(path.join(hotelPath, 'definition.json')),
      hotelAddress = await createHotel(hotelData, images, accessKey);
    uploadedHotels[hotel].address = hotelAddress;
    log(`\t${hotelAddress}`);
  }

  if (config.VERIFY_UPLOAD) {
    await verifyUpload(uploadedHotels);
  }
}

async function update (hotelPath, address) {
  if (! hotelPath && ! address) {
    throw new Error('Usage: node upload.js update <path-to-hotel-dir> <address>');
  }
  const accessKey = await getAccessKey();
  const uploadedHotels = {};
  const imagePath = path.join(hotelPath, 'images'),
    images = {};
  log(`\n\n=== Processing ${hotelPath} ===\n`);
  uploadedHotels[hotelPath] = { images: [], data: null };
  for (let image of fs.readdirSync(imagePath)) {
    log(`Uploading ${image}`);
    images[image] = await uploadImage(path.join(imagePath, image));
    uploadedHotels[hotelPath].images.push(images[image]);
  }
  log('Uploading hotel data');
  const hotelData = require(path.join(hotelPath, 'definition.json'));
  await updateHotel(address, hotelData, images, accessKey);
  uploadedHotels[hotelPath].address = address;
  log(`\t${address}`);

  if (config.VERIFY_UPLOAD) {
    await verifyUpload(uploadedHotels);
  }
}

async function main () {
  const mode = process.argv[2];
  if (mode === 'bulk-create') {
    const dataset = process.argv[3];
    bulkCreate(dataset);
  } else if (mode === 'update') {
    const datapath = process.argv[3];
    const address = process.argv[4];
    update(datapath, address);
  } else {
    throw new Error('Usage: node upload.js [bulk-create|update]');
  }
}

main();
