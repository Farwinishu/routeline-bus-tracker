document.addEventListener('DOMContentLoaded', async () => {
  let routes, buses;
  try {
    [routes, buses] = await Promise.all([RL.getRoutes(), RL.getBuses()]);
  } catch (err) {
    showApiError(err);
    return;
  }

  const cities = [...new Set(routes.flatMap(r => [r.from, r.to]))].sort();
  const params = new URLSearchParams(window.location.search);
  const qFrom = params.get('from') || 'Colombo';
  const qTo = params.get('to') || routes[0].to;
  const qDate = params.get('date') || new Date().toISOString().split('T')[0];

  const fromSel = document.getElementById('from');
  const toSel = document.getElementById('to');
  const dateInput = document.getElementById('date');

  cities.forEach(c => {
    fromSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
    toSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
  });
  fromSel.value = qFrom;
  toSel.value = qTo;
  dateInput.value = qDate;
  dateInput.min = new Date().toISOString().split('T')[0];

  document.getElementById('resultsSearchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams({ from: fromSel.value, to: toSel.value, date: dateInput.value });
    window.location.href = 'search-results.html?' + p.toString();
  });

  function render() {
    const route = routes.find(r =>
      (r.from === qFrom && r.to === qTo) || (r.from === qTo && r.to === qFrom)
    );
    const list = document.getElementById('busList');
    const empty = document.getElementById('emptyState');
    document.getElementById('resultTitle').textContent = `${qFrom} → ${qTo}`;

    if (!route) {
      list.innerHTML = '';
      empty.style.display = 'block';
      document.getElementById('resultCount').textContent = 'No matches';
      return;
    }

    const routeBuses = buses.filter(b => b.routeId === route.id && b.status === 'active');
    document.getElementById('resultCount').textContent = `${routeBuses.length} bus${routeBuses.length !== 1 ? 'es' : ''} · ${route.duration} · ${route.distance}`;

    if (routeBuses.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    list.innerHTML = routeBuses.map(b => {
      const fare = route.baseFare + (b.type === 'Luxury A/C' ? 400 : b.type === 'Semi-Luxury' ? 150 : 0);
      return `
        <div class="bus-card">
          <div class="bus-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9" stroke="#0E5C56" stroke-width="1.8" stroke-linecap="round"/><rect x="4" y="12" width="16" height="6" rx="1.2" stroke="#0E5C56" stroke-width="1.8"/><circle cx="8" cy="20" r="1.4" fill="#0E5C56"/><circle cx="16" cy="20" r="1.4" fill="#0E5C56"/></svg>
          </div>
          <div>
            <h4>${b.name} <span class="mono" style="font-size:12px; color:var(--muted); font-weight:500;">${b.plate}</span></h4>
            <div class="bus-sub">
              <span class="bus-tag">${b.type}</span>
              <span>Departs ${b.departure}</span>
              <span>Arrives ~${route.duration} later</span>
            </div>
          </div>
          <div class="bus-price">
            <div class="amt">${RL.money(fare)}</div>
            <div class="seats-left" data-seats-left="${b.id}">Checking seats…</div>
          </div>
          <div class="bus-actions">
            <a class="btn btn-outline btn-sm" href="track.html?bus=${b.id}">Track</a>
            <a class="btn btn-primary btn-sm" href="seats.html?bus=${b.id}&date=${qDate}&fare=${fare}">Select seats</a>
          </div>
        </div>
      `;
    }).join('');

    // fill in live seat availability per bus without blocking the initial render
    routeBuses.forEach(async (b) => {
      try {
        const info = await RL.getBookedSeats(b.id, qDate);
        const el = document.querySelector(`[data-seats-left="${b.id}"]`);
        if (el) el.textContent = `${info.capacity - info.bookedSeats.length} seats left`;
      } catch (e) { /* leave the placeholder text if this one call fails */ }
    });
  }

  render();
});
