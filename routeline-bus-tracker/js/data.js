/* ============================================================
   RouteLine — data client
   Talks to the backend (see /backend). Load order matters:
   config.js -> api.js -> data.js -> (socket.io, if used) -> page script
   ============================================================ */

const RL = (() => {
  const FAV_KEY = 'rl_favorite_seats';
  const TOKEN_KEY = 'rl_admin_token';
  const ADMIN_KEY = 'rl_admin_info';

  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveFavs(favs) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {}
  }

  return {
    // ---- ROUTES ----
    getRoutes: () => apiRequest('/routes'),
    getRoute: (id) => apiRequest(`/routes/${id}`),
    createRoute: (route) => apiRequest('/routes', { method: 'POST', body: route, auth: true }),
    updateRoute: (id, patch) => apiRequest(`/routes/${id}`, { method: 'PUT', body: patch, auth: true }),
    deleteRoute: (id) => apiRequest(`/routes/${id}`, { method: 'DELETE', auth: true }),

    // ---- BUSES ----
    getBuses: (routeId) => apiRequest('/buses' + (routeId ? `?routeId=${encodeURIComponent(routeId)}` : '')),
    getBus: (id) => apiRequest(`/buses/${id}`),
    getBusLocation: (id) => apiRequest(`/buses/${id}/location`),
    getBookedSeats: (id, date) => apiRequest(`/buses/${id}/seats?date=${encodeURIComponent(date)}`),
    createBus: (bus) => apiRequest('/buses', { method: 'POST', body: bus, auth: true }),
    updateBus: (id, patch) => apiRequest(`/buses/${id}`, { method: 'PUT', body: patch, auth: true }),
    deleteBus: (id) => apiRequest(`/buses/${id}`, { method: 'DELETE', auth: true }),

    // ---- BOOKINGS ----
    getBookings: () => apiRequest('/bookings', { auth: true }), // admin-only list
    getBooking: (id) => apiRequest(`/bookings/${id}`),          // public, for e-tickets
    createBooking: (booking) => apiRequest('/bookings', { method: 'POST', body: booking }),

    // ---- FAVOURITE SEATS (client-side preference, per browser — no need for a server round trip) ----
    getFavoriteSeats: loadFavs,
    toggleFavoriteSeat: (seat) => {
      let favs = loadFavs();
      favs = favs.includes(seat) ? favs.filter(s => s !== seat) : [...favs, seat];
      saveFavs(favs);
      return favs;
    },

    // ---- ADMIN AUTH ----
    adminLoginRequest: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
    verifyAdminSession: () => apiRequest('/auth/me', { auth: true }),
    isAdminLoggedIn: () => !!sessionStorage.getItem(TOKEN_KEY),
    adminLogin: (token, admin) => {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin || {}));
    },
    adminLogout: () => {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_KEY);
    },
    getAdminInfo: () => {
      try { return JSON.parse(sessionStorage.getItem(ADMIN_KEY)); } catch (e) { return null; }
    },

    // ---- UTIL ----
    money: (n) => 'Rs. ' + Number(n).toLocaleString('en-LK'),
  };
})();
