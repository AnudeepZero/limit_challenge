# Fleet Maintenance API — Solution

## Approach

Backend first, then frontend — the frontend can't call endpoints that don't exist yet, and the
backend is 50% of the grade versus the frontend's 25%. Within the backend, CRUD scaffolding
(models → admin → migration → serializers → ViewSets/router) came first since every later
endpoint builds on it, then the 8 custom README endpoints one at a time, then the seed command,
error handling, and tests last, once there was real behavior worth testing.

- **Part 1 — Backend: implemented, see step-by-step below.**
- **Part 2 — Frontend: planned, not yet implemented** (kept here as the working plan for what's next).

## How to run the backend

    cd backend
    python -m venv .venv && source .venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py createsuperuser   # optional, for /admin/
    python manage.py seed_data          # optional, populates dummy data
    python manage.py runserver 0.0.0.0:8000

API root: http://localhost:8000/api/
Browsable API / admin: http://localhost:8000/admin/

Seed command options:

    python manage.py seed_data --clear --offices 5 --vehicles 300 --mechanics 20 --records 1200

## How to run tests

    cd backend
    python manage.py test fleet

## API endpoints

- Offices: `GET/POST /api/offices/`, `GET/PUT/PATCH/DELETE /api/offices/{id}/`
  - `GET /api/offices/summary/` — active vehicle count, last-12-months maintenance cost, most
    recent maintenance date, per office
- Vehicles: `GET/POST /api/vehicles/`, `GET/PUT/PATCH/DELETE /api/vehicles/{id}/`
  - List supports filters: `office`, `active`, `make`, `model`, `maintenance_from`,
    `maintenance_to`, `mechanic_certification_number` (all optional, combinable)
  - Detail response nests office info and full maintenance history (with mechanic per record),
    optimized via `select_related`/`prefetch_related` to stay at a constant number of queries
    regardless of maintenance record count
  - `GET /api/vehicles/{id}/maintenance-history/` — paginated maintenance history, newest first
  - `POST /api/vehicles/{id}/assign/` — moves a vehicle to a new office (`{"office": <id>}`)
  - `GET /api/vehicles/needing-maintenance/` — active vehicles never maintained or overdue by
    > 365 days, oldest first
  - `GET /api/vehicles/duplicate-check/?vin=&license_plate=&exclude_vehicle_id=` — conflict check
- Mechanics: `GET/POST /api/mechanics/`, `GET/PUT/PATCH/DELETE /api/mechanics/{id}/`
  - `GET /api/mechanics/workload/` — record count + total cost for the current calendar year,
    busiest first
- Maintenance Records: `GET/POST /api/maintenance-records/`,
  `GET/PUT/PATCH/DELETE /api/maintenance-records/{id}/`

---

## Part 1 — Backend (50% weight) — implemented

### 1. Models

Defined `Office`, `Vehicle`, `Mechanic`, `MaintenanceRecord` and their relations — the foundation
everything else (serializers, views, aggregations) reads off. Notable choices: `Vehicle.vin` is
globally unique; `license_plate` uniqueness is a **partial** DB constraint (`UniqueConstraint`
with `condition=Q(active=True)`) since two active vehicles can't share a plate but two inactive
ones can; `Vehicle.office` and `MaintenanceRecord.mechanic` use `on_delete=PROTECT` since offices
and mechanics are deactivated via an `active` flag rather than deleted; `MaintenanceRecord.vehicle`
uses `on_delete=CASCADE`.
**Where:** `backend/fleet/models.py`

### 2. Django admin registration

Registered all 4 models in Django's built-in admin for a free CRUD UI at `/admin/`, useful for
eyeballing data while building the API before any frontend exists.
**Where:** `backend/fleet/admin.py`

### 3. Initial migration + `migrate` sanity check

Generated and applied the first migration — also served as validation that the models were
actually correct (typos/invalid fields would surface here).
**Where:** `backend/fleet/migrations/0001_initial.py`, run via `python manage.py migrate`

### 4. Serializers

DRF's translation layer between model instances and JSON, and where field-level validation lives.
`VehicleSerializer` replicates the partial license-plate uniqueness rule in `validate()`, because
DRF's automatic `UniqueConstraint` validation only covers _unconditional_ constraints, not ours.
**Where:** `backend/fleet/serializers.py`

### 5. Basic CRUD — ViewSets + router

Wired serializers to actual HTTP endpoints via `ModelViewSet` + `DefaultRouter`, mounted under
`/api/`. Also fixed two scaffold issues discovered here: `server/urls.py` started with an empty
`urlpatterns = []` (admin wasn't even wired up), and `DEFAULT_RENDERER_CLASSES` in settings only
listed `BrowsableAPIRenderer` with no `JSONRenderer`, meaning no non-browser client (axios, curl)
could ever get JSON back — a real blocker before it was found.
**Where:** `backend/fleet/views.py`, `backend/server/urls.py`, `backend/server/settings.py`

### 6. Vehicle detail endpoint (optimized)

`GET /api/vehicles/{id}/` nests office info and full maintenance history with mechanic per
record. The performance requirement ("hundreds of maintenance records") is solved with
`select_related("office")` (single JOIN) and `prefetch_related("maintenance_records__mechanic")`
(2 extra queries total, not one per record) — avoids the classic N+1 query trap. A dedicated
`VehicleDetailSerializer`/`MaintenanceRecordDetailSerializer` pair handles the nested read shape,
separate from the plain-PK `VehicleSerializer` used for list/create/update.
**Where:** `backend/fleet/views.py` (`VehicleViewSet.get_queryset`/`get_serializer_class`),
`backend/fleet/serializers.py`

### 7. Vehicle search/filter endpoint

Combinable filters (`office`, `active`, `make`, `model`, `maintenance_from`/`maintenance_to`,
`mechanic_certification_number`) via `django-filter`, added since the scaffold's
`DEFAULT_FILTER_BACKENDS` was a deliberate empty placeholder. Filters that traverse the reverse
`maintenance_records` relation (date range, mechanic cert) require `.distinct()` on the list
queryset to avoid duplicate vehicle rows from the JOIN.
**Where:** `backend/fleet/filters.py` (`VehicleFilter`), `backend/fleet/views.py`,
`backend/server/settings.py` (`INSTALLED_APPS`, `DEFAULT_FILTER_BACKENDS`),
`backend/requirements.txt`

### 8. Vehicle maintenance history endpoint

`GET /api/vehicles/{id}/maintenance-history/`, newest-first, paginated. A separate route from
item 6's nested detail per the README's explicit item 5 — useful for a frontend that wants to
page through history independently of the full vehicle payload. Implemented as a DRF `@action`,
auto-wired into the router with no `urls.py` changes needed.
**Where:** `backend/fleet/views.py` (`VehicleViewSet.maintenance_history`)

### 9. Assign-vehicle endpoint

`POST /api/vehicles/{id}/assign/` moves a vehicle to a new office, overwriting `Vehicle.office`
directly — no assignment-history table, per the README's "record only the new office assignment."
A small dedicated `VehicleAssignSerializer` (just `office`) keeps this action from accepting
unrelated vehicle fields.
**Where:** `backend/fleet/serializers.py` (`VehicleAssignSerializer`),
`backend/fleet/views.py` (`VehicleViewSet.assign`)

### 10. Office summary endpoint (aggregation)

`GET /api/offices/summary/` — active vehicle count, last-12-months maintenance cost, most recent
maintenance date, per office. The trickiest query in the project: combining `Count`/`Sum`/`Max`
over the same `Office → vehicles → maintenance_records` join chain safely required `distinct=True`
on `Count` and per-aggregate `filter=Q(...)` (not `.filter()` on the queryset) so different metrics
can have independent conditions without inflating each other via row fan-out. `Coalesce` keeps
"no data" offices returning `0.00`/`null` instead of erroring.
**Where:** `backend/fleet/serializers.py` (`OfficeSummarySerializer`),
`backend/fleet/views.py` (`OfficeViewSet.summary`)

### 11. Mechanic workload endpoint

`GET /api/mechanics/workload/` — record count and total cost for the **current calendar year**
(deliberately different date semantics than item 10's rolling 365-day window — the spec's own
wording distinguishes "current year" from "last 12 months"), ordered busiest first. Mechanics with
zero records this year still appear (via `filter=` on the aggregate, not `.filter()` on the
queryset) so the ranking is complete.
**Where:** `backend/fleet/serializers.py` (`MechanicWorkloadSerializer`),
`backend/fleet/views.py` (`MechanicViewSet.workload`)

### 12. Vehicles-needing-maintenance endpoint

`GET /api/vehicles/needing-maintenance/` — active vehicles never maintained or overdue by >365
days, oldest first, with never-maintained vehicles sorted as most urgent (`nulls_first=True` via
`F()` expressions). Unlike items 10/11, this uses plain `.annotate().filter()` since we actually
want non-matching vehicles excluded from the result, not shown with a zero.
**Where:** `backend/fleet/serializers.py` (`VehicleNeedingMaintenanceSerializer`),
`backend/fleet/views.py` (`VehicleViewSet.needing_maintenance`)

### 13. Duplicate VIN/plate check endpoint

`GET /api/vehicles/duplicate-check/?vin=&license_plate=` → `{"conflicts": ["vin", "license_plate"]}`
matching the README's example shape. VIN conflicts against any vehicle; license plate only against
active ones, mirroring the model constraints from step 1. Added an optional `exclude_vehicle_id`
param (beyond the literal spec) so this can be reused for an edit-vehicle form without
self-conflicting.
**Where:** `backend/fleet/serializers.py` (`DuplicateVehicleCheckSerializer`),
`backend/fleet/views.py` (`VehicleViewSet.duplicate_check`)

### 14. Management command — Faker seed data

`python manage.py seed_data` populates offices, mechanics, vehicles, and maintenance records via
`bulk_create` (batched inserts instead of per-row `.save()`). In-memory uniqueness tracking avoids
VIN/plate collisions without relying on catching `IntegrityError`. ~10% of vehicles are
deliberately excluded from ever getting a maintenance record, and dates are spread across 3 years,
so every date-sensitive endpoint (summary, workload, needing-maintenance) has real data to exercise
rather than hoping randomness produces it.
**Where:** `backend/fleet/management/commands/seed_data.py`

### 15. Error handling pass

DRF gives most of "appropriate status codes" for free (validation → 400, missing object → 404,
wrong verb → 405). The gap found here: `on_delete=PROTECT` (step 1) raises Django's
`ProtectedError`, which isn't a DRF exception type, so it fell through to an unhandled 500 instead
of a clean error. A custom `EXCEPTION_HANDLER` now converts `ProtectedError` → 409 Conflict and
generic `IntegrityError` → 400 (a safety net under step 4's manual uniqueness check, in case of a
race condition slipping past it).
**Where:** `backend/fleet/exceptions.py`, `backend/server/settings.py` (`EXCEPTION_HANDLER`)

### 16. Tests

18 tests covering the logic actually worth testing (not re-testing that DRF's generic CRUD works):
the partial license-plate constraint, office summary aggregation correctness (including the
zero-data case), the calendar-year vs rolling-window distinction, all branches of the
needing-maintenance OR condition, assign/duplicate-check happy and error paths, the 409 delete
protection from step 15, and — most importantly — `assertNumQueries(3)` on the vehicle detail
endpoint, which locks in the step 6 N+1 fix so a future change can't silently reintroduce it
without a test failure.
**Where:** `backend/fleet/tests.py` — run via `python manage.py test fleet`

### 17. This document

---

## Part 2 — Frontend (25% weight) — planned, not yet implemented

18. Review the pre-wired scaffold — `api-client.ts`, `providers.tsx`, `package.json` — understand
    what's already set up (axios instance, react-query provider) before writing anything

19. API layer — typed functions/hooks per endpoint we'll use (list, detail, search, + 1 chosen
    extra endpoint)
    - Typed TypeScript types matching our DRF serializers' JSON shape, plus fetch functions and React Query hooks for the two endpoints we know we need for sure (vehicle list with filters, vehicle detail). We'll add the fetcher for the "one more endpoint" in Step 24, once we've picked which one.

20. Vehicle list page — react-query fetch, loading/empty/error states

- Replacing the placeholder frontend/app/page.tsx with a real vehicle list — fetching via the useVehicles

21. Filters UI wired to URL query params (office, active, make, model, date range, mechanic cert)

- Filter controls (office, active, make, model, maintenance date range, mechanic cert) that read their current value from the URL and write changes back to it

22. Pagination wired to URL query params

- Reading the page query param to fetch the right page of results, and rendering pagination controls that write back to the URL

23. Vehicle detail page — office info, maintenance history, mechanic per record

- A dynamic route frontend/app/vehicles/[id]/page.tsx showing full vehicle info, nested office details, and maintenance history with mechanic per record — using the VehicleDetail shape from our Step 6 backend endpoint. Also making the list page's cards clickable to get there.
-

24. Pick + build the "one more endpoint" the README asks for (office summary dashboard, or
    vehicles-needing-maintenance list, or assign-vehicle action — TBD)
    - A new route (/needing-maintenance) surfacing the Step 12 backend endpoint — active vehicles never serviced or overdue by 365+ days, oldest first — with a link from the main list page so it's discoverable.

25. Polish pass — empty/loading/error states, UX details across all screens
26. Record the ≤2 min demo video (deliverable)

---

## Assumptions

- `Mechanic.certification_number` is unique — not stated explicitly in the domain description,
  but two mechanics sharing a cert number didn't make domain sense.
- "Assign vehicle" only overwrites the current office assignment; no reassignment history is
  stored, per the README's explicit instruction to "record only the new office assignment."
- Office summary's "maintenance cost during the last 12 months" is a rolling 365-day window from
  today, not a calendar year.
- Mechanic workload's "current year" is calendar year (Jan 1 → today) — a deliberately different
  window than the office summary's rolling 365 days, matching the different wording in the spec.
- Office summary's cost and last-maintenance figures are computed across _all_ vehicles currently
  assigned to that office (active and inactive); only `active_vehicle_count` itself is scoped to
  active vehicles, matching the README's field-by-field wording.
- "Vehicles needing maintenance": a vehicle that has never been maintained is treated as more
  urgent than one merely overdue, so never-maintained vehicles sort first, ahead of vehicles
  ordered by oldest maintenance date.
- Duplicate-vehicle-check accepts an optional `exclude_vehicle_id` param, not specified in the
  README, added to support an edit-vehicle form checking for conflicts against _other_ vehicles
  without flagging itself.

## Tradeoffs

- Used `django-filter` for vehicle search rather than hand-rolled query-param parsing — less code,
  standard DRF pattern, at the cost of one extra dependency.
- Custom report endpoints (office summary, mechanic workload, needing-maintenance,
  duplicate-check) are implemented as `@action` methods on the existing CRUD `ViewSet`s rather
  than standalone `APIView`s, keeping related logic under the same resource's URL prefix instead
  of a flat list of unrelated top-level routes.
- Office summary and mechanic workload are unpaginated (small, bounded datasets, and match the
  README's own example response shape as a plain array); vehicle list, maintenance history, and
  needing-maintenance are paginated, since those can grow large.
- SQLite for development, per the scaffold defaults — sufficient for this scope; the partial
  unique constraint on `license_plate` and all query patterns used are standard SQL that would
  carry over to Postgres unchanged if this went to production.
- Seed data generates plausible but not checksum-valid VINs (random 17-character codes) —
  sufficient for manual testing, not meant to pass real-world VIN validation.
- Added a custom global exception handler (`fleet/exceptions.py`) to convert
  `ProtectedError`/`IntegrityError` into clean 4xx responses — DRF doesn't handle these by
  default, and without it a delete blocked by a `PROTECT` foreign key would surface as an
  unhandled 500.
- No authentication implemented — per the README, not required; the optional JWT bonus was not
  attempted given time constraints.
