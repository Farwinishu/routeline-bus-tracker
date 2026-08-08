document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const busId = params.get('bus');
  const date = params.get('date') || new Date().toISOString().split('T')[0];
  const fare = Number(params.get('fare')) || 850;

  let bus, route, seatInfo;
  try {
    bus = busId ? await RL.getBus(busId) : (await RL.getBuses())[0];
    route = await RL.getRoute(bus.routeId);
    seatInfo = await RL.getBookedSeats(bus.id, date);
  } catch (err) {
    showApiError(err);
    return;
  }

  document.getElementById('routeLabel').textContent = `${route.from} → ${route.to} · ${date}`;
  document.getElementById('busLabel').textContent = `${bus.name} — ${bus.plate}`;
  document.getElementById('sumRoute').textContent = `${route.from} → ${route.to}`;
  document.getElementById('sumBus').textContent = `${bus.id} · ${bus.plate}`;
  document.getElementById('sumClass').textContent = bus.type;
  document.getElementById('sumDate').textContent = date;
  document.getElementById('sumFare').textContent = RL.money(fare);

  const capacity = seatInfo.capacity || bus.capacity || 48;
  const rows = Math.ceil(capacity / 4);

  function seatLabel(n) { return 'S' + String(n).padStart(2, '0'); }
  const bookedSeats = new Set(seatInfo.bookedSeats.map(s => {
    const m = /^S?(\d+)$/.exec(s);
    return m ? Number(m[1]) : null;
  }).filter(n => n !== null));

  let favorites = new Set(RL.getFavoriteSeats());
  let selected = new Set();

  const grid = document.getElementById('seatGrid');

  function render() {
    grid.innerHTML = '';
    let seatNum = 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 5; c++) {
        if (c === 4) { // aisle gap column
          grid.appendChild(document.createElement('div'));
          continue;
        }
        if (seatNum > capacity) { grid.appendChild(document.createElement('div')); continue; }
        const n = seatNum++;
        const div = document.createElement('div');
        const isBooked = bookedSeats.has(n);
        const isFav = favorites.has(n);
        const isSel = selected.has(n);
        div.className = 'seat' + (isBooked ? ' booked' : '') + (isFav ? ' favorite' : '') + (isSel ? ' selected' : '');
        div.textContent = seatLabel(n);
        div.title = isBooked ? 'Already booked' : (isFav ? 'Your favourite seat' : 'Available');
        if (!isBooked) {
          div.addEventListener('click', (e) => {
            if (e.target.classList.contains('star-toggle')) return;
            if (selected.has(n)) selected.delete(n); else selected.add(n);
            render();
          });
          const star = document.createElement('div');
          star.className = 'star-toggle';
          star.textContent = isFav ? '★' : '☆';
          star.title = 'Toggle favourite seat';
          star.addEventListener('click', (e) => {
            e.stopPropagation();
            favorites = new Set(RL.toggleFavoriteSeat(n));
            render();
          });
          div.appendChild(star);
        }
        grid.appendChild(div);
      }
    }
    document.getElementById('seatsLeftLabel').textContent = `${capacity - bookedSeats.size} left`;
    updateSummary();
  }

  function updateSummary() {
    const seatLabels = [...selected].sort((a, b) => a - b).map(seatLabel);
    document.getElementById('sumSeats').textContent = seatLabels.length ? seatLabels.join(', ') : 'None selected';
    const total = selected.size * fare;
    document.getElementById('sumTotal').textContent = RL.money(total);
    const btn = document.getElementById('continueBtn');
    if (selected.size === 0) {
      btn.classList.add('btn-outline'); btn.classList.remove('btn-amber');
      btn.href = '#';
    } else {
      btn.classList.remove('btn-outline'); btn.classList.add('btn-amber');
      const p = new URLSearchParams({ bus: bus.id, date, fare, seats: seatLabels.join(','), total });
      btn.href = 'payment.html?' + p.toString();
    }
  }

  render();
});
