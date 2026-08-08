# RouteLine backend

A small REST + WebSocket API for the RouteLine frontend. No database server to
install — data is kept in JSON files under `backend/data/` (created
automatically on first run, seeded with sample routes/buses).

## Run it

```bash
cd backend
npm install
npm start
```

You should see:

```
RouteLine backend running at http://localhost:4000
Admin login: admin@routeline.lk / admin123
```

Leave this running, then open the frontend (`index.html`) in your browser —
it's already pointed at `http://localhost:4000/api` via `js/config.js`.

For auto-restart on file changes during development: `npm run dev` (uses nodemon).

## Configuration

Copy `.env.example` to `.env` to override the defaults:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | Port the API/WebSocket server listens on |
| `JWT_SECRET` | dev secret | Used to sign admin session tokens — **change this before deploying** |
| `ADMIN_EMAIL` | `admin@routeline.lk` | Seeded admin account |
| `ADMIN_PASSWORD` | `admin123` | Seeded admin account — **change this too** |

If you change `PORT`, also update `API_BASE` / `SOCKET_BASE` in `../js/config.js`.

## What's here

- **REST API** — `/api/routes`, `/api/buses`, `/api/bookings`, `/api/auth` (see below)
- **Socket.io** — the server advances each active bus a little further along
  its route once a second and broadcasts `bus:update` events to anyone
  subscribed to `bus:<busId>`. `track.html` uses this for the live map instead
  of simulating movement in the browser.
- **Admin auth** — `POST /api/auth/login` returns a JWT; the admin console
  sends it as `Authorization: Bearer <token>` on every write (add/edit/remove
  buses & routes, viewing the payments list).

## Endpoints

```
GET    /api/health
POST   /api/auth/login          { email, password } -> { token, admin }
GET    /api/auth/me             (auth)

GET    /api/routes
GET    /api/routes/:id
POST   /api/routes              (auth)
PUT    /api/routes/:id          (auth)
DELETE /api/routes/:id          (auth) — blocked if a bus is still assigned

GET    /api/buses               ?routeId= optional filter
GET    /api/buses/:id
GET    /api/buses/:id/location  simulated live GPS (used as a REST fallback; sockets are primary)
GET    /api/buses/:id/seats     ?date= -> { capacity, bookedSeats }
POST   /api/buses               (auth)
PUT    /api/buses/:id           (auth)
DELETE /api/buses/:id           (auth)

GET    /api/bookings            (auth) — full list, for the admin payments page
GET    /api/bookings/:id        public — used by the e-ticket/confirmation page
POST   /api/bookings            public — what payment.html calls at checkout
```

## Swapping in a real database later

Everything reads/writes through `db.js`. Replace the JSON-file store in there
with Postgres/MySQL/Mongo calls and the route handlers won't need to change.

## Before deploying publicly

This is a local-dev setup: `cors()` is wide open and the JWT secret has a
placeholder default. Before putting this anywhere public, at minimum:
- Set a real `JWT_SECRET` and change the seeded admin password
- Restrict CORS to your actual frontend origin
- Put the API behind HTTPS
