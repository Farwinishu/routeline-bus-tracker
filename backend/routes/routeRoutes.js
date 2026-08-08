const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/routes  — public
router.get('/', (req, res) => {
  res.json(db.routes.all());
});

// GET /api/routes/:id — public
router.get('/:id', (req, res) => {
  const route = db.routes.find(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found.' });
  res.json(route);
});

// POST /api/routes — admin only
router.post('/', requireAdmin, (req, res) => {
  const { from, to, distance, duration, baseFare, stops, coords } = req.body || {};
  if (!from || !to || !distance || !duration || !baseFare || !Array.isArray(stops) || !stops.length) {
    return res.status(400).json({ error: 'from, to, distance, duration, baseFare and stops are required.' });
  }
  const route = {
    id: db.uid('RT'),
    from, to, distance, duration,
    baseFare: Number(baseFare),
    stops,
    // fall back to a straight-line path so the map still renders if no coords were supplied
    coords: Array.isArray(coords) && coords.length === stops.length ? coords : stops.map((_, i) => [7 + i * 0.15, 80 + i * 0.15]),
  };
  db.routes.insert(route);
  res.status(201).json(route);
});

// PUT /api/routes/:id — admin only
router.put('/:id', requireAdmin, (req, res) => {
  const existing = db.routes.find(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Route not found.' });
  const { from, to, distance, duration, baseFare, stops, coords } = req.body || {};
  const patch = {};
  if (from) patch.from = from;
  if (to) patch.to = to;
  if (distance) patch.distance = distance;
  if (duration) patch.duration = duration;
  if (baseFare) patch.baseFare = Number(baseFare);
  if (Array.isArray(stops) && stops.length) patch.stops = stops;
  if (Array.isArray(coords) && coords.length) patch.coords = coords;
  const updated = db.routes.update(req.params.id, patch);
  res.json(updated);
});

// DELETE /api/routes/:id — admin only, blocked if buses are still assigned
router.delete('/:id', requireAdmin, (req, res) => {
  const assignedBuses = db.buses.all().filter(b => b.routeId === req.params.id);
  if (assignedBuses.length > 0) {
    return res.status(409).json({ error: `${assignedBuses.length} bus(es) are still assigned to this route. Reassign or remove them first.` });
  }
  const removed = db.routes.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Route not found.' });
  res.json({ ok: true });
});

module.exports = router;
