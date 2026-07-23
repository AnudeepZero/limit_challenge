Order:
Run backend and inspect current API.
Add brokerId and companySearch filters in DRF.
Test backend filters.
Optimize backend queryset.
Enable frontend React Query hooks.
Render broker dropdown from API.
Render submissions list.
Add loading/error/empty states.
Add pagination.
Build detail page.
Polish UI.
Update README.
Final end-to-end test.

Order:

- 1. ## Run backend and inspect current API.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_submissions  # optional but recommended
# add --force to rebuild the generated sample data
python manage.py runserver 0.0.0.0:8000
```

## Current state:

- Backend models, serializers, viewsets, routes, and seed command exist.
- Backend only has status filtering right now.
- Missing backend filters: brokerId, companySearch, optional extras.
- Frontend pages are scaffolded but not actually rendering API data yet.
- React Query hooks exist, but queries are disabled with enabled: false.

Present apis

http://localhost:8000/api/submissions/
http://localhost:8000/api/brokers/
http://localhost:8000/api/submissions/26/

http://localhost:8000/api/submissions/

- the current frontend hook expects Broker[], but backend actually returns PaginatedResponse<Broker>. We will fix that later in the frontend step.

- Pagination may yield inconsistent results with an unordered object_list

- 2. ## Add brokerId and companySearch filters in DRF.
     /api/submissions/?brokerId=10
     /api/submissions/?brokerId=10

- 3. ## Enable frontend React Query hooks

  I fixed a type mismatch where the broker hook assumed a bare array but the API returns a paginated envelope — enabling the query without that fix would have been a runtime bug masked by a stale type, so I caught it at compile time instead."

- 4. ## pagination Fixed

- 5. ## Detail Page
