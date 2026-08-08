document.addEventListener('DOMContentLoaded', async () => {
  const fromSel = document.getElementById('from');
  const toSel = document.getElementById('to');
  const popularWrap = document.getElementById('popularRoutes');

  let routes;
  try {
    routes = await RL.getRoutes();
  } catch (err) {
    showApiError(err);
    return;
  }

  const cities = [...new Set(routes.flatMap(r => [r.from, r.to]))].sort();

  if (fromSel && toSel) {
    cities.forEach(c => {
      fromSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
      toSel.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`);
    });
    fromSel.value = 'Colombo';
    toSel.value = routes[0].to;

    const dateInput = document.getElementById('date');
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
      dateInput.min = today;
    }

    document.getElementById('homeSearchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const params = new URLSearchParams({ from: fromSel.value, to: toSel.value, date: dateInput.value });
      window.location.href = 'search-results.html?' + params.toString();
    });
  }

  if (popularWrap) {
    popularWrap.innerHTML = routes.slice(0, 6).map(r => `
      <div class="route-card">
        <div class="route-card-top">
          <h3>${r.from} → ${r.to}</h3>
          <span class="fare">From ${RL.money(r.baseFare)}</span>
        </div>
        <div class="route-meta">
          <span>⏱ ${r.duration}</span>
          <span>↔ ${r.distance}</span>
        </div>
        <a class="btn btn-outline btn-block" href="search-results.html?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}">See buses</a>
      </div>
    `).join('');
  }
});
