const config = require('./config'),
  operations = require('./lib/operations');

async function main () {
  const dataset = process.argv[2];
  let dataPath;
  if (dataset === 'curated') {
    dataPath = config.DATA_PATH_CURATED;
  } else if (dataset === 'generated') {
    dataPath = config.DATA_PATH_GENERATED;
  } else {
    throw new Error('Usage: node bulk-create.js [curated|generated]');
  }
  operations.bulkCreate(dataPath);
}

main();