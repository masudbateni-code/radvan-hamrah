# RADVAN HAMRAH – Development Package (Milestone 1)

## Contents
- `index.html` – local launch page.
- `customer.html` – customer-facing prototype (visual prototype; not yet connected to identity APIs).
- `employee.html` – employee interface; customer search now reads the shared RADVAN HAMRAHCore store by phone or membership ID.
- `admin.html` – administration dashboard prototype.
- `rules.html` – loyalty rules editor prototype.
- `customer-identity.html` – functional Level 1 customer registration, lookup and activation/deactivation screen.
- `hamrah-core.js` – legacy browser data layer, retained for existing prototypes and regression tests.
- `server/` – Node.js REST API and SQLite database schema; the customer identity page uses this API.
- `test-hamrah-core.mjs` – original integration regression suite (42 tests).
- `test-customer-identity.mjs` – Level 1 identity tests (15 tests).

## Run locally
Requires Node.js 22 or 24 LTS. `better-sqlite3` is pinned to the 12.x line for Node.js 24 prebuilt-binary support.
```bash
npm install
npm run dev
```
Open `http://localhost:3000/`. SQLite is initialized at `server/data/hamrah.sqlite` on first run (or set `HAMRAH_DB_PATH` to choose another path).

## Share a live preview with teammates
For a temporary internal preview, deploy this Node.js app as one web service on Railway:
1. Push this project to a private GitHub repository.
2. In Railway, create a project and deploy the repository as a service.
3. Set the build command to `npm install` and the start command to `npm start`.
4. Add a persistent volume mounted at `/data`.
5. Set the service variable `HAMRAH_DB_PATH=/data/hamrah.sqlite`.
6. Generate a public domain in Railway's Networking settings and share its HTTPS URL with teammates.

The volume is essential: without persistent storage, SQLite data can be lost on redeploy/restart. Railway volumes persist data across deployments. Keep this preview limited to trusted teammates and demo data: the current application does not yet have login, role-based access, or production security controls. Do not enter real customer personal information until authentication, access controls, backups, and a privacy/security review are implemented.

## Level 1 customer identity features (SQLite API)
- Customer lookup by internal ID, membership number, Iranian mobile number, or QR token through `GET /api/customers?q=...`.
- Persian, Arabic and Latin digit normalization for phone lookups.
- New customer registration with Iranian mobile validation through `POST /api/customers`.
- Duplicate mobile prevention.
- Automatic membership IDs (`HM-xxxxx`) and unique QR lookup tokens.
- Initialize a separate zero balance and Bronze league for each registered business.
- Update customer name/mobile with duplicate checks through `PATCH /api/customers/:id`.
- Activate/deactivate customer accounts through `PATCH /api/customers/:id`.
- Existing V1 data migration and transaction/balance regression behavior retained.

## Important architecture boundary
The Level 1 identity screen is backed by a local SQLite database and Node.js REST API. This is a single-server development foundation, not yet production-ready. Authentication/roles, rate limiting, audit trails, backup/restore automation, deployment hardening and privacy/security review remain required before real customer data is used. Legacy employee, customer, admin and rules prototypes are not yet fully migrated to the API.

## Current integration status
- Employee customer search uses the shared store.
- The dedicated identity page uses the shared store for create/read/update/status.
- Customer, admin and rules pages remain front-end prototypes; their data flows are not yet connected to the shared core.
- Employee purchase/redemption forms remain a UI prototype and are not yet committed through `RADVAN HAMRAHCore.applyTransaction`. The core transaction function itself is covered by the supplied regression tests.

## Tests
Run the browser-core regression tests with:
```bash
npm test
```
The SQLite API should additionally be smoke-tested after installation and startup.
Expected: 46 core regression tests + 15 customer identity tests pass.


## Official holding and business directory
Holding / platform brand: RADVAN (رادوان) – RADVAN HAMRAH (رادوان همراه)

Canonical business IDs (kept stable for compatibility):
- biz_1 – Bakeresso Coffee Bakery (کافه بیکری بیکرسو)
- biz_2 – Soren Restaurant (رستوران سورن)
- biz_3 – Dinur Jewelry (طلافروشی دینور)
- biz_4 – Arax Foreign Exchange (صرافی آراکس)
- biz_5 – Roya Greenhouse (گلخانه رویا)
- biz_6 – Tika Fast Food (فست‌فود تیکا)
- biz_7 – Nushka Baklava Café (کافه باقلوا نوشکا)

Existing browser stores synchronize their business directory on next load while retaining customer balances and transactions. Existing SQLite business rows are updated by ID at server startup; the two new businesses are inserted. Existing SQLite customer records are not overwritten.


Demo data note: the example customer name is **آرمان فرهمند** (not آرمان رضایی).
