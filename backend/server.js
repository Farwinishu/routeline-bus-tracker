const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const busRoutes = require('./routes/busRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { startTrackingLoop, registerSocketHandlers } = require('./sockets/tracking');

const app = express();
app.use(cors()); // wide open for local dev; tighten this before deploying publicly
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'routeline-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
registerSocketHandlers(io);
startTrackingLoop(io);

server.listen(config.PORT, () => {
  console.log(`RouteLine backend running at http://localhost:${config.PORT}`);
  console.log(`Admin login: ${config.ADMIN_EMAIL} / ${config.ADMIN_PASSWORD}`);
});
