const fs = require('fs'),
  config = require('./config'),
  utils = require('./lib/utils'),
  operations = require('./lib/operations');

function main () {
  const cnt = new Number(process.argv[2]);
  if (isNaN(cnt)) {
    throw new Error('Usage: node generate.js <cnt>');
  }
  if (!fs.existsSync(config.DATA_PATH_GENERATED)) {
    fs.mkdirSync(config.DATA_PATH_GENERATED);
  }

  utils.log(`Generating ${cnt} hotels in ${config.DATA_PATH_GENERATED}...`);
  for (let i = 0; i < cnt; i++) {
    operations.generate();
  }
  utils.log('Done.');
}

main();
