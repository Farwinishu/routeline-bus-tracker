const db = require('../db');
const config = require('../config');
const { positionAt } = require('../utils/geo');

/**
 * Every TRACKING_TICK_MS, advance each active bus a little further along
 * its route and broadcast the new position to anyone subscribed to it.
 * Clients join a room named `bus:<busId>` (see server.js socket handlers).
 */
function startTrackingLoop(io) {
  setInterval(() => {
    const buses = db.buses.all();
    let changed = false;

    buses.forEach((bus) => {
      if (bus.status !== 'active') return;
      const route = db.routes.find(bus.routeId);
      if (!route) return;

      bus.progress += bus.speed;
      if (bus.progress >= 1) bus.progress = 0.02; // loop the simulated trip
      changed = true;

      const pos = positionAt(route.coords, bus.progress);
      io.to(`bus:${bus.id}`).emit('bus:update', {
        busId: bus.id,
        progress: bus.progress,
        lat: pos.lat,
        lon: pos.lon,
        speedKph: Math.round(40 + bus.speed * 4000),
      });
    });

    if (changed) db.buses.replaceAll(buses);
  }, config.TRACKING_TICK_MS);
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('bus:subscribe', (busId) => {
      if (typeof busId === 'string') socket.join(`bus:${busId}`);
    });
    socket.on('bus:unsubscribe', (busId) => {
      if (typeof busId === 'string') socket.leave(`bus:${busId}`);
    });
  });
}

module.exports = { startTrackingLoop, registerSocketHandlers };
