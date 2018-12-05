const fs = require('fs'),
  path = require('path'),
  Chance = new (require('chance'))(),
  utils = require('./utils'),
  config = require('../config');

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
  if (config.WT_NOTIFICATION_API) {
    data.notifications = config.WT_NOTIFICATION_API;
  }
  return data;
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
  return utils.sendRequest(protocol, method, hostname, port, path);
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
    data = await utils.sendRequest(protocol, method, hostname, port, path, headers, hotelData);

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
    return utils.sendRequest(protocol, method, hostname, port, path, headers, hotelData);
}

/**
 * Create a new account in the configured WT Write API.
 */
async function createAccount () {
  const accountData = {"wallet": JSON.parse(config.WT_WRITE_API_WALLET), "uploaders": config.UPLOADERS},
    protocol = config.WT_WRITE_API.method,
    method = 'POST',
    hostname = config.WT_WRITE_API.host,
    port = config.WT_WRITE_API.port,
    path = '/accounts/',
    headers = {
      'Content-Type': 'application/json',
    },
    data = await utils.sendRequest(protocol, method, hostname, port, path, headers, JSON.stringify(accountData));
  return JSON.parse(String(data)).accessKey;
}

module.exports = {
  // preprocessHotel,
  downloadHotelData,
  createHotel,
  updateHotel,
  createAccount,
}