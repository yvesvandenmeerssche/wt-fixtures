const fs = require('fs'),
  http = require('http'),
  https = require('https'),
  path = require('path');

function log (msg) {
  console.log(msg);
}

function getHttpModule (method) {
  if (method === 'http') {
    return http;
  } else if (method === 'https') {
    return https;
  } else {
    throw new Error(`Unknown method: ${method}`);
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

module.exports = {
  log,
  getHttpModule,
  sendRequest,
}
