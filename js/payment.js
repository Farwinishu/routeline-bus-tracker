document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const busId = params.get('bus');
  const date = params.get('date') || new Date().toISOString().split('T')[0];
  const fare = Number(params.get('fare')) || 850;
  const seats = (params.get('seats') || '').split(',').filter(Boolean);
  const SERVICE_FEE = 50;

  let bus, route;
  try {
    bus = await RL.getBus(busId);
    route = await RL.getRoute(bus.routeId);
  } catch (err) {
    showApiError(err);
    return;
  }

  const total = (fare * seats.length) + SERVICE_FEE;

  document.getElementById('sumRoute').textContent = `${route.from} → ${route.to}`;
  document.getElementById('sumBus').textContent = `${bus.id} · ${bus.plate}`;
  document.getElementById('sumDate').textContent = date;
  document.getElementById('sumSeats').textContent = seats.join(', ') || '—';
  document.getElementById('sumFareCalc').textContent = `${RL.money(fare)} × ${seats.length}`;
  document.getElementById('sumTotal').textContent = RL.money(total);

  // payment method toggle
  const methods = document.querySelectorAll('.pay-method');
  const panels = { card: document.getElementById('cardFields'), wallet: document.getElementById('walletFields'), counter: document.getElementById('counterFields') };
  let activeMethod = 'card';
  methods.forEach(m => m.addEventListener('click', () => {
    methods.forEach(x => x.classList.remove('active'));
    m.classList.add('active');
    activeMethod = m.dataset.m;
    Object.values(panels).forEach(p => p.style.display = 'none');
    panels[activeMethod].style.display = activeMethod === 'card' ? 'grid' : 'block';
  }));

  const payBtn = document.getElementById('payBtn');
  payBtn.addEventListener('click', async () => {
    const name = document.getElementById('pName').value.trim();
    const phone = document.getElementById('pPhone').value.trim();
    const email = document.getElementById('pEmail').value.trim();
    if (!name || !phone) {
      alert('Please fill in your name and mobile number to continue.');
      return;
    }
    payBtn.disabled = true;
    payBtn.textContent = 'Processing payment…';
    try {
      const booking = await RL.createBooking({
        busId: bus.id, date, seats, fare, passenger: name, phone, email, paymentMethod: activeMethod,
      });
      window.location.href = `confirmation.html?bk=${booking.id}`;
    } catch (err) {
      alert(err.message || 'Payment failed. Please try again.');
      payBtn.disabled = false;
      payBtn.textContent = 'Pay & confirm booking';
    }
  });
});
