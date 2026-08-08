const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/bookings — admin only (full list, for the admin payments page)
router.get('/', requireAdmin, (req, res) => {
  res.json(db.bookings.all());
});

// GET /api/bookings/:id — public (needed by the confirmation/e-ticket page)
router.get('/:id', (req, res) => {
  const booking = db.bookings.find(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
});

// POST /api/bookings — public, this is what payment.html calls at checkout
router.post('/', (req, res) => {
  const { busId, date, seats, fare, passenger, phone, email, paymentMethod } = req.body || {};
  if (!busId || !date || !Array.isArray(seats) || !seats.length || !passenger || !phone) {
    return res.status(400).json({ error: 'busId, date, seats, passenger and phone are required.' });
  }

  const bus = db.buses.find(busId);
  if (!bus) return res.status(404).json({ error: 'Bus not found.' });
  const route = db.routes.find(bus.routeId);
  if (!route) return res.status(404).json({ error: 'Route not found for this bus.' });

  // guard against double-booking the same seat on the same bus/date
  const already = db.bookings.all().filter(b => b.busId === busId && b.date === date);
  const takenSeats = new Set(already.flatMap(b => b.seats));
  const clash = seats.filter(s => takenSeats.has(s));
  if (clash.length) {
    return res.status(409).json({ error: `Seat(s) ${clash.join(', ')} were just booked by someone else. Please pick different seats.` });
  }

  const seatFare = Number(fare) || route.baseFare;
  const SERVICE_FEE = 50;
  const total = seatFare * seats.length + SERVICE_FEE;

  const booking = {
    id: db.uid('BK'),
    busId: bus.id,
    plate: bus.plate,
    operator: bus.name,
    route: `${route.from} → ${route.to}`,
    date, seats, fare: seatFare, total,
    passenger, phone, email: email || '',
    paymentMethod: paymentMethod || 'card',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  db.bookings.insert(booking);
  res.status(201).json(booking);
});

module.exports = router;
