const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { positionAt } = require('../utils/geo');

const router = express.Router();

// GET /api/buses — public. Optional ?routeId= filter
router.get('/', (req, res) => {
  const { routeId } = req.query;
  let buses = db.buses.all();
  if (routeId) buses = buses.filter(b => b.routeId === routeId);
  res.json(buses);
});

// GET /api/buses/:id — public
router.get('/:id', (req, res) => {
  const bus = db.buses.find(req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found.' });
  res.json(bus);
});

// GET /api/buses/:id/location — public, current simulated GPS position
router.get('/:id/location', (req, res) => {
  const bus = db.buses.find(req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found.' });
  const route = db.routes.find(bus.routeId);
  if (!route) return res.status(404).json({ error: 'Route for this bus was not found.' });
  const pos = positionAt(route.coords, bus.progress);
  res.json({ busId: bus.id, progress: bus.progress, lat: pos.lat, lon: pos.lon, speedKph: Math.round(40 + bus.speed * 4000) });
});

// GET /api/buses/:id/seats?date=YYYY-MM-DD — public, which seats are already booked
router.get('/:id/seats', (req, res) => {
  const bus = db.buses.find(req.params.id);
  if (!bus) return res.status(404).json({ error: 'Bus not found.' });
  const date = req.query.date;
  const bookings = db.bookings.all().filter(b => b.busId === bus.id && (!date || b.date === date));
  const bookedSeats = [...new Set(bookings.flatMap(b => b.seats))];
  res.json({ busId: bus.id, capacity: bus.capacity, bookedSeats });
});

// POST /api/buses — admin only
router.post('/', requireAdmin, (req, res) => {
  const { plate, name, type, routeId, capacity, driver, status, departure } = req.body || {};
  if (!plate || !name || !type || !routeId || !capacity || !driver) {
    return res.status(400).json({ error: 'plate, name, type, routeId, capacity and driver are required.' });
  }
  if (!db.routes.find(routeId)) return res.status(400).json({ error: 'That route does not exist.' });

  const bus = {
    id: db.uid('BUS'), plate, name, type, routeId,
    capacity: Number(capacity), driver,
    status: status || 'active',
    departure: departure || '6:00 AM',
    progress: 0,
    speed: 0.004 + Math.random() * 0.006,
  };
  db.buses.insert(bus);
  res.status(201).json(bus);
});

// PUT /api/buses/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.buses.find(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Bus not found.' });
  const { plate, name, type, routeId, capacity, driver, status, departure } = req.body || {};
  if (routeId && !db.routes.find(routeId)) return res.status(400).json({ error: 'That route does not exist.' });

  const patch = {};
  if (plate) patch.plate = plate;
  if (name) patch.name = name;
  if (type) patch.type = type;
  if (routeId) patch.routeId = routeId;
  if (capacity) patch.capacity = Number(capacity);
  if (driver) patch.driver = driver;
  if (status) patch.status = status;
  if (departure) patch.departure = departure;

  const updated = db.buses.update(req.params.id, patch);
  res.json(updated);
});

// DELETE /api/buses/:id — admin only
router.delete('/:id', requireAdmin, (req, res) => {
  const removed = db.buses.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Bus not found.' });
  res.json({ ok: true });
});

module.exports = router;
