- ## Part 1 — Backend (unchanged, 50% weight)

  Models — Office, Vehicle, Mechanic, MaintenanceRecord with relations & constraints
  Django admin registration
  Initial migration + migrate sanity check
  Serializers
  Basic CRUD — ViewSets + router, all 4 models
  Vehicle detail endpoint — optimized for hundreds of maintenance records
  Vehicle search/filter endpoint — combinable filters
  Vehicle maintenance history endpoint
  Assign-vehicle endpoint
  Office summary endpoint (aggregation)
  Mechanic workload endpoint
  Vehicles-needing-maintenance endpoint
  Duplicate VIN/plate check endpoint
  Management command — Faker seed data
  Error handling pass
  Tests
  SOLUTION.md write-up (backend half)

- ## Part 2 — Frontend (25% weight)

  Review the pre-wired scaffold — api-client.ts, providers.tsx, package.json — understand what's already set up (axios instance, react-query provider) before writing anything
  API layer — typed functions/hooks per endpoint we'll use (list, detail, search, + 1 chosen extra endpoint)
  Vehicle list page — react-query fetch, loading/empty/error states
  Filters UI wired to URL query params (office, active, make, model, date range, mechanic cert)
  Pagination wired to URL query params
  Vehicle detail page — office info, maintenance history, mechanic per record
  Pick + build the "one more endpoint" the README asks for (we should choose together — e.g. office summary dashboard, or vehicles-needing-maintenance list, or assign-vehicle action)
  Polish pass — empty/loading/error states, UX details across all screens
  Record the ≤2 min demo video (deliverable)

- ## Part 1 — Backend (unchanged, 50% weight)

  # Models — Office, Vehicle, Mechanic, MaintenanceRecord with relations & constraints
  - Defining the 4 core tables and their relationships in backend/fleet/models.py. This is the foundation everything else builds on — serializers, views, and the aggregation endpoints all read off these fields, so getting field types and constraints right now saves rework later.

  # Django admin registration
  - Registering the 4 models in Django's built-in admin so you get a free CRUD UI at /admin/ — useful for eyeballing data while we build the API, without writing any frontend yet.

  # Initial migration + migrate sanity check
  - Django doesn't touch the database until you generate a migration file (a Python file describing the schema change) and apply it. makemigrations reads your models and writes that file; migrate executes it against db.sqlite3.

  python manage.py createsuperuser - change if it is in production stage
  -admin, admin@admin.com, password

  # Serializers
  - Creating backend/fleet/serializers.py — DRF's translation layer between model instances and JSON, plus where field-level validation lives.

  # Basic CRUD — ViewSets + router, all 4 models
  - Wiring the serializers to actual HTTP endpoints. DRF's ModelViewSet + DefaultRouter combo gives you list/create/retrieve/update/delete for a model from ~2 lines each — this is the payoff for setting up serializers properly in Step 4.

  # Vehicle detail endpoint — optimized for hundreds of maintenance records
  - GET /api/vehicles/{id}/ should return the vehicle plus nested office info plus the full maintenance history plus the mechanic for each record
  - Fix — update DEFAULT_RENDERER_CLASSES in backend/server/settings.py

  # Vehicle search/filter endpoint — combinable filters
  - GET /api/vehicles/?office=1&active=true&make=Toyota&maintenance_from=2025-01-01&maintenance_to=2025-12-31&mechanic_certification_number=ABC123 — all filters optional, combinable.
  - pip install django-filter

  # Vehicle maintenance history endpoint
  - GET /api/vehicles/{id}/maintenance-history/ returning just that vehicle's maintenance records, newest-to-oldest.
  - DRF's @action decorator lets you attach a custom method to a ViewSet that the router auto-wires into a URL — no changes needed to urls.py, the router picks it up because it's registered against VehicleViewSet.

  # Assign-vehicle endpoint
  - POST /api/vehicles/{id}/assign/

  # Office summary endpoint (aggregation)
  - http://localhost:8000/api/offices/summary/
  - one endpoint returning every office with 3 computed metrics: active vehicle count, maintenance cost over the last 12 months, and the most recent maintenance date. This is the meatiest aggregation endpoint in the challenge

  # Mechanic workload endpoint
  - README item 7 — mechanic name, count of maintenance records completed this calendar year, and total cost of that work, ordered busiest-first.

  # Vehicles-needing-maintenance endpoint
  - README item 7 — mechanic name, count of maintenance records completed this calendar year, and total cost of that work, ordered busiest-first.

  - README item 8 — active vehicles that either never had maintenance, or whose last maintenance was more than 365 days ago, oldest-first.

  # Duplicate VIN/plate check endpoint
  - README item 9 — given a VIN and license plate, report which (if any) already conflict with an existing vehicle, matching the exact response shape from the README's example: {"conflicts": ["vin", "license_plate"]}.

  # Management command — Faker seed data
  - README deliverables list requires "a Django management command that fills the database with dummy data" — this is backend/fleet/management/commands/seed_data.py

  # Error handling pass
  - README explicitly grades "Return appropriate HTTP status codes for invalid requests. Validation errors should include meaningful messages." Most of this we already get for free from DRF — invalid serializer data → automatic 400 with field-level messages, nonexistent object → automatic 404, wrong HTTP verb → automatic 405.

  - ProtectedError → 409 Conflict (the correct HTTP semantics for "this action conflicts with the current state of the server" — a delete blocked by dependent records is exactly that). IntegrityError (generic) → 400 Bad Request — this is a safety net under the manual uniqueness check we wrote in VehicleSerializer.validate()

  # Tests

  # SOLUTION.md write-up (backend half)

- ## Part 2 — Frontend (25% weight)

  Review the pre-wired scaffold — api-client.ts, providers.tsx, package.json — understand what's already set up (axios instance, react-query provider) before writing anything
  API layer — typed functions/hooks per endpoint we'll use (list, detail, search, + 1 chosen extra endpoint)
  Vehicle list page — react-query fetch, loading/empty/error states
  Filters UI wired to URL query params (office, active, make, model, date range, mechanic cert)
  Pagination wired to URL query params
  Vehicle detail page — office info, maintenance history, mechanic per record
  Pick + build the "one more endpoint" the README asks for (we should choose together — e.g. office summary dashboard, or vehicles-needing-maintenance list, or assign-vehicle action)
  Polish pass — empty/loading/error states, UX details across all screens
  Record the ≤2 min demo video (deliverable)
