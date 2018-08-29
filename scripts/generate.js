const fs = require('fs'),
  path = require('path'),
  Chance = new require('chance')();
  config = require('./config');

function log (msg) {
  console.log(msg);
}

const HOTEL_AMENITIES = [
    'restaurant',
    'gym',
    'swimming pool',
    'bar',
    'vending machine',
    'laundromat',
    'parking',
    'guards',
    'wifi'
  ],
  ROOM_AMENITIES = [
    'TV',
    'minibar',
    'safe',
    'balcony',
    'wifi',
    'hair-dryer'
  ],
  NON_SMOKING = ['all', 'none', 'some'],
  IMAGES = {};

// Collect paths to all images.
const imagePaths = Array.prototype.concat.apply([], fs.readdirSync(config.DATA_PATH_CURATED)
  .filter((x) => {
    return fs.lstatSync(path.join(config.DATA_PATH_CURATED, x)).isDirectory();
  })
  .map((x) => {
    return {
      prefix: x,
      images: fs.readdirSync(path.join(config.DATA_PATH_CURATED, x, 'images')),
    };
  })
  .map((x) => x.images.map((i) => path.join(config.DATA_PATH_CURATED, x.prefix, i))));

// Add unique IDs for images (basenames are not unique).
for (let imagePath of imagePaths) {
  const id = Chance.string({ pool: 'abcdefghijklmnopqrstvwuxyz', length: 8 });
  IMAGES[id] = imagePath;
}

function generateRoomType () {
  const min = Chance.natural({ min: 1, max: 4 }); 
  return {
    "name": Chance.sentence({ words: Chance.natural({ min: 2, max: 3 }) }),
    "description": Chance.paragraph(),
    "totalQuantity": Chance.natural({ min: 1, max: 20 }),
    "occupancy": {
      "min": min,
      "max": Chance.natural({ min: min, max: min + 6 }),
    },
    "amenities": Chance.pickset(ROOM_AMENITIES, Chance.natural({ max: 4 })),
    "images": Chance.pickset(Object.keys(IMAGES), Chance.natural({ min: 1, max: 6 })),
    "properties": {
      "nonSmoking": Chance.pick(NON_SMOKING)
    }
  }
}

function generateCancellationPolicies () {
  const policies = [],
    currentYear = (new Date()).getYear() + 1900;
  let deadline = 1,
    amount = 0;

  for (let i=0; i<Chance.natural({ max: 4 }); i++) {
    policies.push({
      "from": `${currentYear}-01-01`,
      "to": `${currentYear}-12-31`,
      "deadline": Chance.natural({ min: deadline, max: deadline + 14 }),
      "amount": 100 - Chance.natural({ min: amount, max: Math.min(100, amount + 25) }),
    });
    deadline += 14;
    amount += 25;
  }
  return policies;
}

function generateDescription () {
  const description = {
    "name": Chance.sentence({ words: Chance.natural({ min: 2, max: 3 }) }),
    "description": Chance.paragraph(),
    "location": {
      "latitude": Chance.latitude({ min: 45.5, max: 47.5 }),
      "longitude": Chance.longitude({ min: 22.5, max: 24.5 })
    },
    "contacts": {
      "general": {
        "email": Chance.email(),
        "phone": "0040" + Chance.phone({ formatted: false }),
        "url": Chance.url(),
      }
    },
    "address": {
      "line1": `${Chance.street()} ${Chance.natural({ min: 2, max: 9999 })}`,
      "line2": "",
      "postalCode": Chance.zip(),
      "city": "Dragolm",
      "country": "RO"
    },
    "timezone": "Europe/Bucharest",
    "currency": "RON",
    "amenities": Chance.pickset(HOTEL_AMENITIES, Chance.natural({ max: 6 })),
    "images": Chance.pickset(Object.keys(IMAGES), Chance.natural({ min: 1, max: 6 })),
    "roomTypes": {},
    "cancellationPolicies": generateCancellationPolicies(),
    "defaultCancellationAmount": 0,
  };

  for (let i=0; i<Chance.natural({ min: 1, max: 10 }); i++) {
    description.roomTypes[Chance.string()] = generateRoomType();
  }
  return description;
}

function generateRatePlan (roomTypeId, occupancy) {
    const currentYear = (new Date()).getYear() + 1900,
      modifierConditions = [
            { "maxAge": Chance.natural({ min: 1, max: 20 }) },
            { "minLengthOfStay": Chance.natural({ min: 3, max: 120 }) },
      ];
    if (occupancy.max > occupancy.min) {
      modifierConditions.push({
        "minOccupants": Chance.natural({ min: occupancy.min + 1, max: occupancy.max }),
      });
    }

    return {
      "name": Chance.sentence({ words: Chance.natural({ min: 1, max: 4 }) }),
      "description": Chance.paragraph(),
      "currency": "RON",
      "price": Chance.natural({ min: 20, max: 400 }),
      "roomTypeIds": [roomTypeId],
      "availableForReservation": {
        "from": `${currentYear}-01-01`,
        "to": `${currentYear}-12-31`
      },
      "availableForTravel": {
        "from": `${currentYear}-01-01`,
        "to": `${currentYear}-12-31`
      },
      "modifiers": [
        {
          "adjustment": Chance.integer({ min: -50, max: 25 }),
          "conditions": Chance.pickone(modifierConditions),
        }
      ],
      "restrictions": Chance.bool() ? {} : Object.assign.apply(undefined, Chance.pickset([
        {
          "bookingCutOff": {
            min: Chance.natural({ min: 1, max: 7 }),
            max: Chance.natural({ min: 7, max: 120 }),
          },
        },
        {
          "lengthOfStay": {
            min: Chance.natural({ min: 1, max: 7 }),
            max: Chance.natural({ min: 7, max: 60 }),
          },
        },
      ], Chance.integer({ min: 1, max: 2 }))),
    };
}

function generateRatePlans (description) {
  const ratePlans = {},
    roomTypeIds = Object.keys(description.roomTypes);
  for (let roomTypeId of roomTypeIds) {
    for (let i=0; i < Chance.natural({ min: 1, max: 4 }); i++) {
      const occupancy = description.roomTypes[roomTypeId].occupancy;
      ratePlans[Chance.string()] = generateRatePlan(roomTypeId, occupancy);
    }
  }
  return ratePlans;
}

function generateHotelDefinition () {
  const description = generateDescription();
  return {
    "description": description,
    "ratePlans": generateRatePlans(description),
  };
}

function main () {
  const cnt = new Number(process.argv[2]);
  if (isNaN(cnt)) {
    throw new Error('Usage: node generate.js <cnt>');
  }
  if (! fs.existsSync(config.DATA_PATH_GENERATED)) {
    fs.mkdirSync(config.DATA_PATH_GENERATED);
  }
  for (let i=0; i<cnt; i++) {
    // 1. Generate a definition and collect all images.
    const name = Chance.word({ length: Chance.natural({ min: 5, max: 12 }) }),
      definition = generateHotelDefinition();
    let images = definition.description.images.slice();
    for (let roomTypeId in definition.description.roomTypes) {
      images = [...images, ...definition.description.roomTypes[roomTypeId].images];
    }

    // 2. Write the generated data to disk.
    const hotelPath = path.join(config.DATA_PATH_GENERATED, name);
    fs.mkdirSync(hotelPath);
    fs.writeFileSync(path.join(hotelPath, 'definition.json'),
      JSON.stringify (definition, null, '  '));
    fs.mkdirSync(path.join(hotelPath, 'images'));
    for (let imageId of new Set(images)) {
      fs.symlinkSync(IMAGES[imageId], path.join(hotelPath, 'images', imageId));
    }
  }
}

main();
