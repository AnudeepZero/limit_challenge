# Solution Notes — Submission Tracker

Personal working notes: approach, tradeoffs, how to run, and a step-by-step account of how I
worked through the challenge. Written for my own review and interview prep, not a replacement
for the README.

## Approach

The backend (Django + DRF) already had models, serializers, viewsets, and seed data in place —
only `status` filtering worked, querysets weren't optimized, and the response shape for brokers
was paginated in a way the frontend types didn't expect. The frontend (Next.js 16 + React 19 +
MUI + React Query) had the page shells and hooks scaffolded, but every query was `enabled: false`
and the pages just rendered placeholder JSON.

My approach was to work backend-first, then frontend, verifying each layer before building on top
of it:

1. Confirm the existing API actually works and understand its real response shape (don't assume —
   check).
2. Extend backend filtering (`brokerId`, `companySearch`) so the API supports what the frontend
   needs.
3. Fix N+1 queries and pagination ordering before building UI on top of the queryset.
4. Enable the frontend data layer, fixing a real type bug I found along the way.
5. Build the list UI (table, loading/error/empty states, pagination) and the detail UI (company,
   broker, owner, contacts, documents, notes).
6. Polish: sync filters to the URL so the view is shareable and refresh-safe.
7. Run a full end-to-end pass, including a real production build — not just the dev server — to
   catch anything the dev server hides.

## How to Run

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_submissions --force
python manage.py runserver 0.0.0.0:8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000/submissions`.

## Implemented Features

- `status`, `brokerId`, `companySearch` filters on `GET /api/submissions/`, combinable.
- `select_related` on `company`/`broker`/`owner` (list and detail) and `prefetch_related` on
  `contacts`/`documents`/`notes` (detail only) — verified query counts directly rather than
  assuming the fix worked.
- Explicit `.order_by("-created_at")` on the annotated list queryset, fixing Django's
  `UnorderedObjectListWarning` under pagination.
- Frontend list page: real table (company, broker, owner, status/priority chips, created date,
  document/note counts), with distinct loading / error / empty states.
- Pagination wired to DRF's `page` param, with the page resetting to 1 whenever a filter changes
  (otherwise a narrowed filter can point at a page that no longer exists).
- Detail page: header with status/priority, summary, company/broker/owner cards, contacts,
  documents (external links), and a notes timeline.
- Filters and page number synced to the URL (`?status=new&brokerId=3&companySearch=acme&page=2`),
  so the view is shareable and survives a refresh.

## Stretch Goals Implemented

- **Filter state synced to the URL** via `router.replace` + `useSearchParams` — not required, but
  called out explicitly by the rubric ("filter UX tied to query params"), and makes the list view
  shareable/bookmarkable.
- **Query-count verification** on the backend optimization step — I didn't just add
  `select_related`/`prefetch_related` and assume it worked; I used `CaptureQueriesContext` to
  confirm the query count actually dropped (from ~31 to 2 for 10 rows touching 3 relations).

## Tradeoffs & Decisions

- **Didn't add `createdFrom`/`createdTo`/`hasDocuments`/`hasNotes` filters.** The README lists
  these as optional extras; I prioritized `brokerId`/`companySearch` (explicitly required) plus
  frontend polish, since the rubric weights frontend UX higher (45%) than backend filter breadth.
- **`STATUS_COLOR`/`PRIORITY_COLOR`/date-formatting helpers are duplicated** between the list and
  detail pages rather than extracted into a shared module. Small enough (a handful of lines) that
  extracting it felt premature; I'd pull it into `lib/` if the two pages grew more UI in common.
- **URL sync is one-directional in practice** — filters write to the URL, and the URL seeds initial
  state on load, but I didn't wire up listening for back/forward navigation after the initial
  mount. Full two-way binding felt like scope beyond what the challenge needed.
- **No automated tests.** README marks these optional; given the time budget I prioritized manual,
  but rigorous, verification instead (see below) — actual query counts, actual HTTP calls against
  a running server, `tsc`/`eslint`/`next build` on every change, not just visual inspection.

## Step-by-Step: What I Did and Why

### 1. Ran the existing backend and inspected the real API before touching anything

Before changing any code, I ran migrations, seeded data, and hit the endpoints directly:
`GET /api/submissions/`, `GET /api/submissions/<id>/`, `GET /api/brokers/`. This surfaced two
things that mattered later: `/api/brokers/` is paginated (`{count, next, previous, results}`), not
a bare array like the frontend hook assumed — and Django was already warning about
`UnorderedObjectListWarning` on the list endpoint. Both became concrete bugs I fixed in later
steps. Understanding the actual shape of the API before writing frontend code against it avoided
building on a wrong assumption.

### 2. Added `brokerId` and `companySearch` filters (`backend/submissions/filters/submission.py`)

```python
class SubmissionFilterSet(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="iexact")
    brokerId = django_filters.NumberFilter(field_name="broker_id")
    companySearch = django_filters.CharFilter(
        field_name="company__legal_name", lookup_expr="icontains"
    )

    class Meta:
        model = models.Submission
        fields = ["status", "brokerId", "companySearch"]
```

Key thing I understood here: `django-filter` reads raw query-string params, not the camelCase
JSON that `djangorestframework-camel-case` produces for response bodies. So the filter field names
have to be `brokerId`/`companySearch` verbatim (matching what the frontend actually sends), not
`broker_id`/`company_search`. `brokerId` filters on the FK column directly; `companySearch` does a
case-insensitive partial match across the related company's `legal_name` via `icontains`. Verified
by hitting each filter and each combination directly against the running server and checking the
returned `count`.

### 3. Optimized the queryset (`backend/submissions/views.py`)

```python
class SubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Submission.objects.select_related("company", "broker", "owner")
    ...
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action == "list":
            ...
            queryset = queryset.annotate(...).order_by("-created_at")
        else:
            queryset = queryset.prefetch_related("contacts", "documents", "notes")
        return queryset
```

`select_related` covers the forward foreign keys (company/broker/owner) with a SQL join, applied
to both list and detail. `prefetch_related` is scoped to the detail action only, since contacts/
documents/notes are reverse relations the list serializer doesn't expose (it only needs counts,
which come from the `annotate` above it). I didn't just trust that this "should" work — I used
Django's `CaptureQueriesContext` in a shell script to actually count queries before/after, and
confirmed it went from ~31 to 2 for 10 rows touching all three relations. I also added
`.order_by("-created_at")` to fix the pagination warning, and confirmed it was actually gone by
re-running with `warnings.simplefilter('error')` so any remaining warning would raise instead of
being silently logged.

### 4. Enabled the frontend React Query hooks — and found a real bug doing it

Flipping `enabled: false` to `enabled: true` in `useSubmissionsList`/`useBrokerOptions` wasn't
enough on its own. `useBrokerOptions` was typed to return `Broker[]`, but the endpoint actually
returns `PaginatedResponse<Broker>` (confirmed back in step 1). Enabling the query without fixing
the type would have compiled fine in isolation but broken at runtime the moment `page.tsx` tried
to `.map()` over a paginated envelope as if it were an array. Fixed the type, then updated
`page.tsx`'s `brokerQuery.data?.map(...)` to `brokerQuery.data?.results.map(...)`. Understood here:
enabling a disabled query isn't just a boolean flip — it's the point where previously-inert code
paths start actually running, so it's exactly where hidden type/shape mismatches surface.

### 5. Built the list UI with three explicit states, not one

Replaced the JSON placeholder with a real MUI `Table`, driven by `submissionsQuery.isPending` /
`isError` / `isSuccess`. Treated "still loading," "request failed," and "succeeded with zero
results" as three distinct, mutually exclusive UI states rather than collapsing them — an
unhandled combination of these is exactly what makes an app feel broken to a user (a blank table
looks the same whether it's loading or genuinely empty, unless you make the states visually
distinct).

### 6. Added pagination, and hit a subtle React bug along the way

Wired a `page` filter through to DRF's `page` query param. First version reset `page` to `1` on
filter change using a `useEffect` watching `[status, brokerId, companyQuery]`. ESLint's
`react-hooks/set-state-in-effect` rule flagged this — calling `setState` synchronously inside an
effect causes a redundant extra render (render with stale page → effect fires → second render with
corrected page). Fixed it by moving the `setPage(1)` call directly into each filter's own
`onChange` handler instead, since that handler already is the actual point of causation. Understood
here: "reset state when some other state changes" is a common instinct to reach for `useEffect`,
but if you already control the event that caused the change, doing it in that same handler avoids
an unnecessary render — this is literally React's documented guidance
("You Might Not Need an Effect").

### 7. Built the detail page

Sections for the submission header (company, status/priority chips, summary, dates), a
three-column company/broker/owner card row (the three parties on a submission, worth comparing
side by side), and contacts/documents/notes cards, each with their own empty-state message.
Documents link out with `rel="noopener noreferrer"` — opening an external link in a new tab
without it leaves the opened page with `window.opener` access back to the parent tab, a real
(if often overlooked) security gap.

### 8. Synced filters to the URL — and caught an incomplete first pass

Added `useSearchParams`/`useRouter`/`usePathname` to write filters into the URL via
`router.replace` (not `push`, so typing in a filter doesn't spam browser history) on every filter
change. First pass only wrote *to* the URL — state still initialized from a plain `useState('')`
rather than reading `searchParams` first, so a pasted deep link or a page refresh wouldn't actually
restore the filters; `eslint` caught the unused `searchParams` variable, which is what surfaced it.
Fixed by seeding each `useState` from `searchParams.get(...)` on first render. Understood here: a
URL-sync feature that only writes and never reads back isn't actually shareable — it just looks
like it works because you're always the one who set the URL in the first place.

### 9. Ran a real production build, not just the dev server — and it failed

`npm run dev` never triggers Next.js's static prerendering, so it hid a genuine build-breaking
issue: `useSearchParams()` requires a `Suspense` boundary in a component that can be statically
prerendered, since there's no real URL available at build time. Fixed by splitting the page into a
thin default-export wrapper (`<Suspense fallback={...}><SubmissionsPageContent /></Suspense>`) and
an inner component that actually calls the hook. Re-ran `npm run build` to confirm `/submissions`
prerenders as static and the build completes. This is the concrete reason I made a full production
build part of the final check, rather than trusting that "the dev server works" means "it's done."

### 10. Final end-to-end verification

Backend: re-checked every filter and combination, pagination totals across all 3 pages
(10+10+5=25), a 404 on a nonexistent submission ID. Frontend: `tsc --noEmit`, `eslint .`, and
`npm run build`, all clean across the whole project, not just the files I touched in the last
step.

## What I'd Do With More Time

- Extract the shared status/priority color maps and date formatters into `lib/` once there's a
  second consumer beyond the two pages.
- Add the optional date-range and has-documents/has-notes filters.
- Add targeted backend tests for the filter combinations and the query-count optimization (the
  manual `CaptureQueriesContext` check I did by hand would make a good regression test).
- Add a Playwright or React Testing Library smoke test for the loading/error/empty states.
