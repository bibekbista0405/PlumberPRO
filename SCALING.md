# PlumbPro — Capacity & Scaling Notes

Short answer first: **no code change makes an app "handle millions of users" by itself.**
That number is a statement about infrastructure — how many servers, how the
database is set up, whether there's a CDN, a load balancer, a caching layer —
not about the application code. What the code *can* do is (a) not waste the
capacity you do have, and (b) not have anything that actively breaks at
moderate scale. This round of changes was aimed at both.

## What was actually fixed this round

- **`trust proxy` misconfiguration** — this was the crash you hit. It wasn't
  a scale problem, it was `express-rate-limit` refusing to trust an
  `X-Forwarded-For` header it wasn't told to expect. Fixed by explicitly
  trusting exactly one proxy hop (configurable via `TRUST_PROXY` in `.env`).
- **Gzip compression** (`compression` middleware) — cuts response sizes
  significantly, which matters a lot once you have real traffic and users on
  slower connections.
- **Static asset caching headers** — hashed build files (JS/CSS) are now
  cached by the browser for a year; `index.html` is never cached (it's the
  thing that points at the current hashes). Reduces repeat load on your
  server for returning visitors.
- **Two missing indexes** on the two hottest queries in the whole app: the
  notification bell (polled every ~20s per logged-in user) and the rating
  lookup used on every search result and profile view. Without these,
  both queries do a full table scan — fine with 50 rows, genuinely slow with
  50,000.
- **A safety-net `LIMIT`** on the admin list endpoints (users, plumbers,
  bookings, messages, reports), which previously had no limit at all. This
  doesn't give you pagination UI yet — see below — but it stops those
  endpoints from returning an unbounded, ever-growing result set as your
  data grows.
- **PM2 cluster config** (`backend/ecosystem.config.js`) — Node only uses one
  CPU core per process by default. This runs one worker per core with zero
  code changes (the app is already stateless — JWT auth, no server-side
  sessions), which is close to a free multi-core speedup on any server with
  more than one core.
- **Configurable DB connection pool size** via `DB_CONNECTION_LIMIT` in `.env`.

## A realistic picture of where this stands today

Run as a single Node process (even in PM2 cluster mode) against a single
MySQL instance on one server, an app like this typically handles **low
thousands of registered users with moderate concurrent traffic** comfortably
— which is a lot more than most local businesses ever need. It is *not*, as
shipped, going to hold up under a sudden spike of millions of concurrent
users; nothing running on one machine does, regardless of language or
framework.

## What "millions of users" actually requires

None of this is code you write once and forget — it's infrastructure and
operational decisions, roughly in the order you'd actually need them:

1. **Multiple app servers behind a load balancer.** This is the first real
   step past a single machine. The app is already stateless (JWT, no
   sessions), so it's a genuinely easy fit for this — no code changes needed.
2. **A managed, scalable database** (read replicas for search-heavy traffic,
   proper backups, connection pooling at the proxy layer — e.g. ProxySQL or
   RDS Proxy) instead of one MySQL instance.
3. **A shared cache (Redis)** for session-adjacent data, rate-limit counters,
   and hot read paths (search results, public stats). Note: I deliberately
   did *not* add an in-process cache in this pass, because it would silently
   break under PM2 cluster mode — each worker would cache independently,
   giving inconsistent results depending on which worker handles a request.
   Redis is the correct fix once you're past a single server.
4. **A CDN** in front of static assets and uploaded images.
5. **Real pagination** on the admin list views (today they load a capped but
   still bulk set and filter client-side — fine at hundreds of rows, not at
   hundreds of thousands).
6. **Structured logging + monitoring** (e.g. a hosted APM) so you can see
   where load actually concentrates instead of guessing.
7. **A queue for fan-out work** — right now, notifying every admin about a
   new report, or a plumber about a new booking, happens inline in the
   request. Fine at current scale; at high volume this moves to a background
   job queue so a request never waits on notification delivery.

I'd rather tell you accurately what's needed than claim the app is
"millions-of-users-ready" when it isn't yet — that's the kind of claim that
looks fine until the day it matters.
