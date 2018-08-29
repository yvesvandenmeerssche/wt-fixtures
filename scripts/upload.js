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

function uploadImage (imagePath) {
  const imageBuffer = fs.readFileSync(imagePath),
    httpModule = getHttpModule(config.SWARM_PROVIDER.method);

  return new Promise((resolve, reject) => {
    const options = {
        method: 'POST',
        hostname: config.SWARM_PROVIDER.host,
        port: config.SWARM_PROVIDER.port,
        path: '/bzz-raw:/',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': imageBuffer.length
        }
      },
      data = [],
      request = httpModule.request(options, response => {
        response.on("data", chunk => data.push(chunk));
        response.on("end", () => {
          if (response.statusCode > 299) {
            reject(new Error(`Error ${response.statusCode}`));
          }
          resolve(String(Buffer.concat(data)));
        });
      });
    request.on("error", err => reject(err));
    request.write(imageBuffer);
    request.end();
  });
}

function preprocessHotel (data, images) {
  const swarm = config.SWARM_PROVIDER,
    convert = (x) => `${swarm.method}://${swarm.host}:${swarm.port}/bzz-raw:/${images[x]}`;
  data.description.images = data.description.images.map(convert);
  for (let roomTypeId in data.description.roomTypes) {
    const roomType = data.description.roomTypes[roomTypeId];
    roomType.images = roomType.images.map(convert);
  }
  return data;
}

function uploadHotel (rawData, images, accessKey) {
  const data = preprocessHotel(rawData, images),
    httpModule = getHttpModule(config.WT_WRITE_API.method);

  return new Promise((resolve, reject) => {
    const options = {
        method: 'POST',
        hostname: config.WT_WRITE_API.host,
        port: config.WT_WRITE_API.port,
        path: '/hotels/',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': accessKey,
          'X-Wallet-Password': config.WT_WRITE_API_WALLET_PASSWORD,
        }
      },
      responseData = [],
      request = httpModule.request(options, response => {
        response.on("data", chunk => responseData.push(chunk));
        response.on("end", () => {
          if (response.statusCode > 299) {
            reject(new Error(`Error ${response.statusCode}`));
          }
          resolve(JSON.parse(String(Buffer.concat(responseData))).address);
        });
      });
    request.on("error", err => reject(err));
    request.write(JSON.stringify(data));
    request.end();
  });
}

function createAccount () {
  const data = `{"wallet": ${config.WT_WRITE_API_WALLET}, "uploaders": {"root": {"swarm": {}}}}`,
    httpModule = getHttpModule(config.WT_WRITE_API.method);

  return new Promise((resolve, reject) => {
    const options = {
        method: 'POST',
        hostname: config.WT_WRITE_API.host,
        port: config.WT_WRITE_API.port,
        path: '/account/',
        headers: {
          'Content-Type': 'application/json',
        }
      },
      responseData = [],
      request = httpModule.request(options, response => {
        response.on("data", chunk => responseData.push(chunk));
        response.on("end", () => {
          if (response.statusCode > 299) {
            reject(new Error(`Error ${response.statusCode}`));
          }
          resolve(JSON.parse(String(Buffer.concat(responseData))).accessKey);
        });
      });
    request.on("error", err => reject(err));
    request.write(data);
    request.end();
  });
}

(async () => {
  let accessKey;
  if (! config.WT_WRITE_API_ACCESS_KEY) {
    log(`Creating a new account in WT write API...`);
    accessKey = await createAccount();
    log(`Obtained access key: ${accessKey}`);
  } else {
    accessKey = config.WT_WRITE_API_ACCESS_KEY;
  }
  const hotels = fs.readdirSync(config.DATA_PATH_CURATED).filter((x) => {
    return fs.lstatSync(path.join(config.DATA_PATH_CURATED, x)).isDirectory();
  });
  const images = {};
  for (let hotel of hotels) {
    log(`\n\n=== Processing ${hotel} ===\n`);
    const hotelPath = path.join(config.DATA_PATH_CURATED, hotel),
      imagePath = path.join(hotelPath, 'images'),
      images = {};
    for (let image of fs.readdirSync(imagePath)) {
      log(`Uploading ${image}`);
      images[image] = await uploadImage(path.join(imagePath, image));
    }
    log(`Uploading hotel data`);
    const hotelData = require(path.join(hotelPath, 'definition.json')),
      hotelAddress = await uploadHotel(hotelData, images, accessKey);
    log(`\t${hotelAddress}`);
  }
})();
