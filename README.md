# RouteLine — Sri Lanka bus tracking & booking

A full front + back end demo: live bus tracking on a map, seat booking with
favourite seats, checkout, and a separate admin console for managing buses,
routes and payments.

```
bus-tracker/
├── backend/           Node/Express + Socket.io API (see backend/README.md)
├── index.html          Passenger site — home page
├── search-results.html Passenger site — bus search results
├── track.html           Passenger site — live map
├── seats.html            Passenger site — seat selection
├── payment.html            Passenger site — checkout
├── confirmation.html        Passenger site — e-ticket
├── admin/                Admin console (separate, not linked from the passenger site)
├── css/, js/              Shared frontend styles & scripts
```

## Run it (two steps)

**1. Start the backend** — this is what makes tracking, search, seats and
payments actually work.

```bash
cd backend
npm install
npm start
```

Leave that terminal running. You should see:
```
RouteLine backend running at http://localhost:4000
Admin login: admin@routeline.lk / admin123
```

**2. Open the frontend** — just open `index.html` in your browser (double-click
it, or drag it into a browser window). It's already configured to talk to
`http://localhost:4000`.

That's it — search for a route, track a bus live on the map, pick seats, pay,
and the booking will show up in the admin console.

## Using the admin console

Go to `admin/login.html` directly (it's intentionally not linked from the
passenger pages). Sign in with the seeded account printed in the backend's
terminal output: `admin@routeline.lk` / `admin123`. From there you can add,
edit or remove buses and routes, and see every booking/payment made on the
passenger site.

## If something doesn't load

If a page shows a red banner saying it can't reach the server, it means the
backend isn't running — go back to step 1. Every page will keep working once
the backend comes up; just reload.

## Changing where the backend lives

If you deploy the backend somewhere other than your own machine, update the
two constants at the top of `js/config.js`:

```js
const API_BASE = 'http://localhost:4000/api';
const SOCKET_BASE = 'http://localhost:4000';
```

## Notes

- Data is stored in JSON files under `backend/data/` (auto-created on first
  run) rather than a real database — easy to inspect, easy to reset (just
  delete the files and restart the server). See `backend/README.md` for how
  to swap in Postgres/Mongo/etc. later.
- This is a local-dev setup (open CORS, a placeholder JWT secret). See the
  "Before deploying publicly" section in `backend/README.md` before putting
  this anywhere public.
