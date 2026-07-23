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
