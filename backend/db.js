/* ============================================================
   Tiny JSON-file "database".
   No native modules required (works out of the box on any OS).
   Swap this out for Postgres/Mongo/etc. later without touching
   the route handlers — they only call the functions below.
   ============================================================ */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('./config');

const DATA_DIR = path.join(__dirname, 'data');
const FILES = {
  routes: path.join(DATA_DIR, 'routes.json'),
  buses: path.join(DATA_DIR, 'buses.json'),
  bookings: path.join(DATA_DIR, 'bookings.json'),
  admins: path.join(DATA_DIR, 'admins.json'),
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const SEED_ROUTES = [
  { id: 'RT-101', from: 'Colombo', to: 'Kandy', distance: '115 km', duration: '3h 15m', baseFare: 850,
    stops: ['Colombo Fort', 'Kadawatha', 'Nittambuwa', 'Kegalle', 'Mawanella', 'Kandy'],
    coords: [[6.9344,79.8428],[7.0009,79.9496],[7.1058,80.0975],[7.2513,80.3464],[7.2500,80.4500],[7.2906,80.6337]] },
  { id: 'RT-102', from: 'Colombo', to: 'Galle', distance: '119 km', duration: '2h 10m', baseFare: 700,
    stops: ['Colombo Fort', 'Kalutara', 'Ambalangoda', 'Hikkaduwa', 'Galle'],
    coords: [[6.9344,79.8428],[6.5854,79.9607],[6.2360,80.0538],[6.1408,80.1017],[6.0535,80.2210]] },
  { id: 'RT-103', from: 'Colombo', to: 'Jaffna', distance: '396 km', duration: '6h 40m', baseFare: 2200,
    stops: ['Colombo Fort', 'Kurunegala', 'Anuradhapura', 'Vavuniya', 'Jaffna'],
    coords: [[6.9344,79.8428],[7.4863,80.3623],[8.3114,80.4037],[8.7514,80.4971],[9.6615,80.0255]] },
  { id: 'RT-104', from: 'Colombo', to: 'Nuwara Eliya', distance: '180 km', duration: '5h 00m', baseFare: 1100,
    stops: ['Colombo Fort', 'Avissawella', 'Hatton', 'Nuwara Eliya'],
    coords: [[6.9344,79.8428],[6.9548,80.2094],[6.8926,80.5967],[6.9497,80.7891]] },
  { id: 'RT-105', from: 'Kandy', to: 'Batticaloa', distance: '203 km', duration: '5h 30m', baseFare: 1300,
    stops: ['Kandy', 'Mahiyangana', 'Ampara', 'Batticaloa'],
    coords: [[7.2906,80.6337],[7.3308,81.0169],[7.2975,81.6747],[7.7170,81.7000]] },
  { id: 'RT-106', from: 'Colombo', to: 'Trincomalee', distance: '257 km', duration: '5h 45m', baseFare: 1450,
    stops: ['Colombo Fort', 'Kurunegala', 'Habarana', 'Trincomalee'],
    coords: [[6.9344,79.8428],[7.4863,80.3623],[8.0362,80.7455],[8.5874,81.2152]] },
];

const OPERATORS = ['Lanka Ashok Leyland', 'Sisira Express', 'Southern Comfort', 'Hill Country Cruiser', 'Northern Star', 'EastCoast Liner'];

function seedBuses() {
  const types = ['Luxury A/C', 'Semi-Luxury', 'Normal'];
  const buses = [];
  let n = 1;
  SEED_ROUTES.forEach((r, idx) => {
    const count = idx < 2 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      buses.push({
        id: `BUS-${String(n).padStart(3, '0')}`,
        plate: `NB-${1000 + n}`,
        name: OPERATORS[n % OPERATORS.length],
        type: types[n % types.length],
        routeId: r.id,
        capacity: types[n % types.length] === 'Luxury A/C' ? 40 : 52,
        driver: ['K. Perera', 'S. Fernando', 'M. Rasheed', 'N. Jayasuriya', 'A. Kumar'][n % 5],
        status: 'active',
        progress: Math.random() * 0.6,
        speed: 0.004 + Math.random() * 0.006, // fraction of route per second (simulation)
        departure: `${6 + (n % 6) * 2}:${n % 2 === 0 ? '00' : '30'} ${n % 6 < 3 ? 'AM' : 'PM'}`,
      });
      n++;
    }
  });
  return buses;
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    writeJson(file, fallback);
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    writeJson(file, fallback);
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ---- seed on first run ----
readJson(FILES.routes, SEED_ROUTES);
readJson(FILES.buses, seedBuses());
readJson(FILES.bookings, []);
readJson(FILES.admins, [{
  id: 1,
  email: config.ADMIN_EMAIL,
  passwordHash: bcrypt.hashSync(config.ADMIN_PASSWORD, 8),
  name: 'Fleet Admin',
}]);

// ---- generic CRUD helpers over a JSON file ----
function makeStore(file) {
  return {
    all: () => readJson(file, []),
    find: (id) => readJson(file, []).find(x => x.id === id),
    insert: (item) => {
      const all = readJson(file, []);
      all.push(item);
      writeJson(file, all);
      return item;
    },
    update: (id, patch) => {
      const all = readJson(file, []);
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...patch };
      writeJson(file, all);
      return all[idx];
    },
    remove: (id) => {
      const all = readJson(file, []);
      const next = all.filter(x => x.id !== id);
      writeJson(file, next);
      return next.length !== all.length;
    },
    replaceAll: (items) => writeJson(file, items),
  };
}

module.exports = {
  routes: makeStore(FILES.routes),
  buses: makeStore(FILES.buses),
  bookings: makeStore(FILES.bookings),
  admins: { all: () => readJson(FILES.admins, []) },
  uid: (prefix) => prefix + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
};
