const fs = require('fs'),
  path = require('path'),
  config = require('./config');

async function main () {
  let dataPath = config.DATA_PATH_CURATED;
  for (let hotelPath of fs.readdirSync(dataPath)) {
    let hotelData = require(path.join(dataPath, hotelPath, 'definition.json'));

    reformatWtip003(hotelData);

    fs.writeFileSync(path.join(dataPath, hotelPath, 'definition.json'), JSON.stringify(hotelData, null, '  ') + '\n');
  }
}

main();

function reformatWtip003(hotelData) {
  let roomTypes = hotelData.description.roomTypes;
  if (Array.isArray(roomTypes)) {
    console.log(`roomTypes already in array`);
  } else {
    console.log(`Turning roomTypes into array...`);
      let res = [];
      for (let roomType in roomTypes) {
        let roomTypeData = roomTypes[roomType];
        roomTypeData.id = roomType;
        res.push(roomTypeData);
      }
      hotelData.description.roomTypes = res;
  }

  let ratePlans = hotelData.ratePlans;
  if (Array.isArray(ratePlans)) {
    console.log(`ratePlans already in array`);
  } else {
    console.log(`Turning ratePlans into array...`);
      let res = [];
      for (let rp in ratePlans) {
        let rpData = ratePlans[rp];
        rpData.id = rp;
        res.push(rpData);
      }
      hotelData.ratePlans = res;
  }

  let availability = hotelData.availability.roomTypes;
  if (Array.isArray(availability)) {
    console.log(`availability.roomTypes already in array`);
  } else {
    console.log(`Turning availability.roomTypes into array...`);
      let res = [];
      for (let ava in availability) {
        for (let avaData of availability[ava]) {
          avaData.roomTypeId = ava;
          res.push(avaData);
        }
      }
      hotelData.availability.roomTypes = res;
  }
}