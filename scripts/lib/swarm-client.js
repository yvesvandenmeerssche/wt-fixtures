const fs = require('fs'),
  utils = require('./utils'),
  config = require('../config');

/**
 * Download a document from swarm.
 */
function downloadSwarmDocument (hash) {
  const protocol = config.SWARM_PROVIDER.method,
    method = 'GET',
    hostname = config.SWARM_PROVIDER.host,
    port = config.SWARM_PROVIDER.port,
    path = `/bzz-raw:/${hash}`;
  return utils.sendRequest(protocol, method, hostname, port, path);
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
    data = await utils.sendRequest(protocol, method, hostname, port, path, headers, imageBuffer);

    return String(data);
}

module.exports = {
  downloadSwarmDocument,
  uploadImage,
}