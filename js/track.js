document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('bus');
  const busSelect = document.getElementById('busSelect');

  let buses, routes;
  try {
    [buses, routes] = await Promise.all([RL.getBuses(), RL.getRoutes()]);
  } catch (err) {
    showApiError(err);
    return;
  }

  buses.forEach(b => {
    const r = routes.find(rt => rt.id === b.routeId);
    busSelect.insertAdjacentHTML('beforeend',
      `<option value="${b.id}">${b.id} · ${r.from} → ${r.to} (${b.plate})</option>`);
  });
  if (preselect) busSelect.value = preselect;

  // ---- map setup ----
  const map = L.map('map', { zoomControl: true }).setView([7.4, 80.6], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  let routeLine = null;
  let busMarker = null;
  let stopMarkers = [];
  let currentRoute = null;

  const busIcon = L.divIcon({
    className: '',
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#C1432E;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:13px;">🚌</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13]
  });
  const stopIconPassed = L.divIcon({ className: '', html: `<div style="width:12px;height:12px;border-radius:50%;background:#0E5C56;border:2px solid #fff;"></div>`, iconSize: [12,12], iconAnchor: [6,6] });
  const stopIconAhead = L.divIcon({ className: '', html: `<div style="width:10px;height:10px;border-radius:50%;background:#D8CFB8;border:2px solid #fff;"></div>`, iconSize: [10,10], iconAnchor: [5,5] });

  // ---- socket.io: live position stream ----
  const socket = io(SOCKET_BASE, { transports: ['websocket', 'polling'] });
  let subscribedBusId = null;

  socket.on('connect_error', () => showApiError(new Error(`Live tracking socket couldn't reach ${SOCKET_BASE}. Is the backend running?`)));

  socket.on('bus:update', (payload) => {
    if (payload.busId !== subscribedBusId || !currentRoute) return;
    if (busMarker) busMarker.setLatLng([payload.lat, payload.lon]);
    renderStopList(currentRoute, payload.progress);
    updateEta(currentRoute, payload.progress);
    document.getElementById('infoSpeed').textContent = payload.speedKph + ' km/h';
  });

  function subscribeToBus(busId) {
    if (subscribedBusId) socket.emit('bus:unsubscribe', subscribedBusId);
    subscribedBusId = busId;
    socket.emit('bus:subscribe', busId);
  }

  function totalMinutesForRoute(route) {
    const parts = route.duration.match(/(\d+)h\s*(\d+)?/);
    const h = parts ? parseInt(parts[1]) : 3;
    const m = parts && parts[2] ? parseInt(parts[2]) : 0;
    return h * 60 + m;
  }
  function estimateMinutes(route, fracRemaining) {
    return Math.max(0, Math.round(totalMinutesForRoute(route) * fracRemaining));
  }
  function updateEta(route, progress) {
    const remaining = estimateMinutes(route, 1 - progress);
    const hrs = Math.floor(remaining / 60), mins = remaining % 60;
    document.getElementById('etaVal').textContent = remaining <= 0 ? 'Arrived' : (hrs > 0 ? `${hrs}h ${mins}m` : `${mins} min`);
    const n = route.stops.length;
    let nextIdx = route.stops.findIndex((s, i) => i / (n - 1) > progress);
    if (nextIdx === -1) nextIdx = n - 1;
    document.getElementById('nextStopVal').textContent = route.stops[nextIdx];
  }
  function renderStopList(route, progress) {
    const list = document.getElementById('stopList');
    const n = route.stops.length;
    list.innerHTML = route.stops.map((name, i) => {
      const frac = i / (n - 1);
      let cls = '';
      if (frac < progress - 0.02) cls = 'passed';
      else if (Math.abs(frac - progress) < 0.06) cls = 'current';
      const eta = frac >= progress ? estimateMinutes(route, frac - progress) : null;
      return `<li class="${cls}">
        <div class="stop-name">${name}</div>
        <div class="stop-time">${cls === 'passed' ? 'Departed' : cls === 'current' ? 'Approaching now' : eta !== null ? 'ETA ~' + eta + ' min' : ''}</div>
      </li>`;
    }).join('');
  }

  async function loadBus(busId) {
    let bus, location;
    try {
      [bus, location] = await Promise.all([RL.getBus(busId), RL.getBusLocation(busId)]);
    } catch (err) {
      showApiError(err);
      return;
    }
    const route = routes.find(r => r.id === bus.routeId);
    currentRoute = route;

    document.getElementById('infoPlate').textContent = bus.plate;
    document.getElementById('infoOperator').textContent = bus.name;
    document.getElementById('infoClass').textContent = bus.type;
    document.getElementById('infoSpeed').textContent = location.speedKph + ' km/h';
    document.getElementById('bookThisBus').href = `seats.html?bus=${bus.id}&fare=${route.baseFare}`;

    if (routeLine) map.removeLayer(routeLine);
    stopMarkers.forEach(m => map.removeLayer(m));
    stopMarkers = [];

    const coords = route.coords;
    routeLine = L.polyline(coords, { color: '#0E5C56', weight: 4, opacity: 0.55, dashArray: '2 10' }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

    route.stops.forEach((name, i) => {
      const icon = i / (route.stops.length - 1) <= location.progress ? stopIconPassed : stopIconAhead;
      const m = L.marker(coords[i], { icon }).bindPopup(`<div class="bus-popup"><strong>${name}</strong></div>`).addTo(map);
      stopMarkers.push(m);
    });

    if (busMarker) map.removeLayer(busMarker);
    busMarker = L.marker([location.lat, location.lon], { icon: busIcon })
      .bindPopup(`<div class="bus-popup"><strong>${bus.name}</strong><br>${bus.plate} · ${bus.type}</div>`)
      .addTo(map);

    renderStopList(route, location.progress);
    updateEta(route, location.progress);
    subscribeToBus(bus.id);
  }

  busSelect.addEventListener('change', () => loadBus(busSelect.value));
  loadBus(busSelect.value || buses[0].id);
});
