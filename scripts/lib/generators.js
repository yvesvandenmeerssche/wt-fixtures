const fs = require('fs'),
  path = require('path'),
  Chance = new (require('chance'))(),
  config = require('../config');

const HOTEL_AMENITIES = [
    'restaurant',
    'gym',
    'swimming pool',
    'bar',
    'vending machine',
    'laundromat',
    'parking',
    'guards',
    'wifi',
  ],
  ROOM_AMENITIES = [
    'TV',
    'minibar',
    'safe',
    'balcony',
    'wifi',
    'hair-dryer',
  ],
  NON_SMOKING = ['all', 'none', 'some'],
  IMAGES = {};

// Collect paths to all images.
const imagePaths = Array.prototype.concat.apply([], fs.readdirSync(config.DATA_PATH_CURATED)
  .filter((x) =>
    fs.lstatSync(path.join(config.DATA_PATH_CURATED, x)).isDirectory()
  )
  .map((x) => {
    return {
      prefix: x,
      images: fs.readdirSync(path.join(config.DATA_PATH_CURATED, x, 'images')),
    };
  })
  .map((x) => x.images.map((i) => path.join(config.DATA_PATH_CURATED, x.prefix, 'images', i))));

// Generate unique IDs for images (because basenames are not unique).
for (let imagePath of imagePaths) {
  const id = Chance.string({ pool: 'abcdefghijklmnopqrstvwuxyz', length: 8 });
  IMAGES[id] = imagePath;
}

function generateRoomType () {
  const min = Chance.natural({ min: 1, max: 4 });
  return {
    'name': Chance.sentence({ words: Chance.natural({ min: 2, max: 3 }) }),
    'description': Chance.paragraph(),
    'totalQuantity': Chance.natural({ min: 1, max: 20 }),
    'occupancy': {
      'min': min,
      'max': Chance.natural({ min: min, max: min + 6 }),
    },
    'amenities': Chance.pickset(ROOM_AMENITIES, Chance.natural({ max: 4 })),
    'images': Chance.pickset(Object.keys(IMAGES), Chance.natural({ min: 1, max: 6 })),
    'properties': {
      'nonSmoking': Chance.pick(NON_SMOKING),
    },
  };
}

function generateCancellationPolicies () {
  const policies = [],
    startDate = new Date(),
    endDate = new Date();
  let deadline = 1,
    amount = 0;

  startDate.setDate(1);
  endDate.setDate((new Date()).getDate() + Chance.natural({ min: 30, max: 365 }));

  for (let i = 0; i < Chance.natural({ max: 4 }); i++) {
    policies.push({
      'from': `${startDate.getFullYear()}-${('0' + (startDate.getMonth()+1)).slice(-2)}-${('0' + startDate.getDate()).slice(-2)}`,
      'to': `${endDate.getFullYear()}-${('0' + (endDate.getMonth()+1)).slice(-2)}-${('0' + endDate.getDate()).slice(-2)}`,
      'deadline': Chance.natural({ min: deadline, max: deadline + 14 }),
      'amount': 100 - Chance.natural({ min: amount, max: Math.min(100, amount + 25) }),
    });
    deadline += 14;
    amount += 25;
  }
  return policies;
}

function generateDescription () {
  const description = {
    'name': Chance.sentence({ words: Chance.natural({ min: 2, max: 3 }) }),
    'description': Chance.paragraph(),
    'location': {
      'latitude': Chance.latitude({ min: 45.5, max: 47.5 }),
      'longitude': Chance.longitude({ min: 22.5, max: 24.5 }),
    },
    'contacts': {
      'general': {
        'email': Chance.email(),
        'phone': '0040' + Chance.phone({ formatted: false }),
        'url': Chance.url(),
      },
    },
    'address': {
      'line1': `${Chance.street()} ${Chance.natural({ min: 2, max: 9999 })}`,
      'line2': '',
      'postalCode': Chance.zip(),
      'city': 'Dragolm',
      'country': 'RO',
    },
    'timezone': 'Europe/Bucharest',
    'currency': 'RON',
    'amenities': Chance.pickset(HOTEL_AMENITIES, Chance.natural({ max: 6 })),
    'images': Chance.pickset(Object.keys(IMAGES), Chance.natural({ min: 1, max: 6 })),
    'roomTypes': {},
    'cancellationPolicies': generateCancellationPolicies(),
    'defaultCancellationAmount': 0,
  };

  for (let i = 0; i < Chance.natural({ min: 1, max: 10 }); i++) {
    description.roomTypes[Chance.string()] = generateRoomType();
  }
  return description;
}

function generateRatePlan (roomTypeId, occupancy) {
  const startDateRes = new Date(),
    endDateRes = new Date(),
    startDateTrav = new Date(),
    endDateTrav = new Date(),
    modifierConditions = [
      { 'maxAge': Chance.natural({ min: 1, max: 20 }) },
      { 'minLengthOfStay': Chance.natural({ min: 3, max: 120 }) },
    ];
  if (occupancy.max > occupancy.min) {
    modifierConditions.push({
      'minOccupants': Chance.natural({ min: occupancy.min + 1, max: occupancy.max }),
    });
  }

  startDateRes.setDate(1);
  endDateRes.setDate((new Date()).getDate() + Chance.natural({ min: 30, max: 365 }));
  startDateTrav.setDate(1);
  endDateTrav.setDate((new Date()).getDate() + Chance.natural({ min: 30, max: 365 }));

  return {
    'name': Chance.sentence({ words: Chance.natural({ min: 1, max: 4 }) }),
    'description': Chance.paragraph(),
    'currency': 'RON',
    'price': Chance.natural({ min: 20, max: 400 }),
    'roomTypeIds': [roomTypeId],
    'availableForReservation': {
      'from': `${startDateRes.getFullYear()}-${('0' + (startDateRes.getMonth()+1)).slice(-2)}-${('0' + startDateRes.getDate()).slice(-2)}`,
      'to': `${endDateRes.getFullYear()}-${('0' + (endDateRes.getMonth()+1)).slice(-2)}-${('0' + endDateRes.getDate()).slice(-2)}`,
    },
    'availableForTravel': {
      'from': `${startDateTrav.getFullYear()}-${('0' + (startDateTrav.getMonth()+1)).slice(-2)}-${('0' + startDateTrav.getDate()).slice(-2)}`,
      'to': `${endDateTrav.getFullYear()}-${('0' + (endDateTrav.getMonth()+1)).slice(-2)}-${('0' + endDateTrav.getDate()).slice(-2)}`,
    },
    'modifiers': [
      {
        'adjustment': Chance.integer({ min: -50, max: 25 }),
        'conditions': Chance.pickone(modifierConditions),
      },
    ],
    'restrictions': Chance.bool() ? {} : Object.assign.apply(undefined, Chance.pickset([
      {
        'bookingCutOff': {
          min: Chance.natural({ min: 1, max: 7 }),
          max: Chance.natural({ min: 7, max: 120 }),
        },
      },
      {
        'lengthOfStay': {
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
    for (let i = 0; i < Chance.natural({ min: 1, max: 4 }); i++) {
      const occupancy = description.roomTypes[roomTypeId].occupancy;
      ratePlans[Chance.string()] = generateRatePlan(roomTypeId, occupancy);
    }
  }
  return ratePlans;
}

function generateAvailability (description) {
  const availability = {},
    roomTypeIds = Object.keys(description.roomTypes);
  for (let roomTypeId of roomTypeIds) {
    let startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    availability[roomTypeId] = [];
    for (let i = 0; i < Chance.natural({ min: 90, max: 365}); i++) {
      startDate.setDate(startDate.getDate() + 1);
      let dailyAvailability = {
        date: `${startDate.getFullYear()}-${('0' + (startDate.getMonth()+1)).slice(-2)}-${('0' + startDate.getDate()).slice(-2)}`,
        quantity: Chance.natural({ min: 0, max: description.roomTypes[roomTypeId].totalQuantity}),
      };
      if (Chance.bool()) {
        dailyAvailability['restrictions'] = {};
        if (Chance.bool()) {
          dailyAvailability['restrictions'].noArrival = true;
        } else {
          dailyAvailability['restrictions'].noDeparture = true;
        }
      }
      availability[roomTypeId].push(dailyAvailability);
    }
  }
  return {
    roomTypes: availability
  };
}

function generateHotelDefinition () {
  const description = generateDescription();
  return {
    'description': description,
    'ratePlans': generateRatePlans(description),
    'availability': generateAvailability(description),
  };
}

module.exports = {
  generateRoomType,
  generateCancellationPolicies,
  generateDescription,
  generateRatePlan,
  generateRatePlans,
  generateAvailability,
  generateHotelDefinition,
  IMAGES,
}
