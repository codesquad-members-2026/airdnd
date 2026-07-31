# Room Search Performance Investigation — Full Case Report

**Date:** 2026-06-24
**Area:** `com.airdnd.room` search path (`RoomQueryRepositoryImpl`, `RoomPredicates`, `RoomService`) + map frontend (`RoomResultsMap.tsx`)
**Dataset:** ~1,000,000 rooms, almost all in Korea (lng ≈ +125..+130, lat ≈ 33..38). A handful of overseas test rooms (e.g. one in Los Angeles, lng ≈ −118.24, lat ≈ 34.05).

> **TL;DR** — What looked like "one slow search" was actually **five distinct, stacked problems**. Each fix revealed the next. The headline lessons:
> 1. A leading-wildcard `LIKE '%x%'` (from `containsIgnoreCase`) can never use a B-tree index → full scan.
> 2. A composite B-tree `(lat, lng)` can only range-*seek* on the first column; the second is just a filter (1D index, 2D problem).
> 3. `ORDER BY id ... LIMIT n` tempts MySQL onto a PK walk; lethal when the matching row has a high `id` and matches are sparse.
> 4. MySQL only uses a `SPATIAL` index if the column is **SRID-restricted** (`POINT ... SRID 0`).
> 5. Wrapping a spatial predicate as `MBRContains(...) = 1` hides it from the optimizer → no index. It must be emitted **bare**.
> 6. Bonus gotchas: wrong `Point` import (`spring.data.geo` vs `locationtech.jts`); `ddl-auto: validate` (prod) catches mapping bugs that `none` (local) hides.

---

## 0. The starting symptom

> "Searching for 1 room in a million takes ~7 seconds. Add one US room to a DB of 1M Korean rooms, search for that US room → 7s."

The search path: `RoomController` → `RoomService.getRooms` → `RoomQueryRepositoryImpl.findPage` (+ `countInArea` on the first page). Cursor pagination ordered by `id`, page size `DEFAULT_SIZE = 21` (fetch `size + 1`).

---

## Layer 1 — The region search was a non-sargable full scan

**How we found it:** The actual request was
`/api/rooms?region=Los Angeles&guests=1&adults=1&children=0&infants=0` — **no bounding box at all.** It was a *region* search, not a geo search.

**Root cause:** `RoomPredicates.regionContains` used `room.region.containsIgnoreCase(region)`, which compiles to:

```sql
lower(region) LIKE lower('%Los Angeles%')
```

Two independent reasons this can never use an index:
- **Leading wildcard** `%...%` — a B-tree is ordered by prefix; there's no prefix to seek.
- **`lower(region)`** wraps the column — defeats an index even for a prefix match.

`region` was the only selective filter, and there was **no index on it** (V1 created `region VARCHAR(100)` with none). So every region search scanned all ~1M rows. The single LA match meant `LIMIT` never short-circuited either.

**Fix #1:**
- Migration **`V8__add_rooms_region_index.sql`** → `CREATE INDEX idx_rooms_region ON rooms (region)`.
- `RoomPredicates.regionContains` → **`regionStartsWith`**, using `room.region.startsWith(region)` → `region LIKE 'term%'` (sargable prefix). The table collation `utf8mb4_unicode_ci` is case-insensitive, so dropping `lower()` keeps matching case-insensitive.
- Updated the one call site in `RoomQueryRepositoryImpl.sharedFilters`.

**Behavior change (intentional):** region match is now **prefix**, not substring. `region=Angeles` no longer matches `"Los Angeles"`; `region=Los` does. Fine because the UI sends full place names. True substring search would need `FULLTEXT` or normalized city/country columns.

---

## Layer 2 — The map was geographically locked to Korea

**Symptom:** the map couldn't be panned to other continents.

**Root cause:** `RoomResultsMap.tsx` set
`restriction={{ latLngBounds: KOREA_BOUNDS, strictBounds: false }}` on the `<Map>`.

**Fix #2:** removed the `restriction` prop and the now-unused `KOREA_BOUNDS` constant. Left `minZoom={MAP_MIN_ZOOM}` and the default center/zoom untouched (zoom behavior unchanged; map opens on Korea but can now pan worldwide).

---

## Layer 3 — The bounding-box query: two independent slow causes

Once map panning worked, the geo (bbox) query became the focus. The query reduces to:

```sql
SELECT ... FROM rooms r
WHERE latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?
  AND is_active AND NOT is_deleted ...
ORDER BY r.id ASC
LIMIT 22;
```

Index in place at the time: `idx_rooms_lat_long_price (latitude, longitude, price_per_night)` (from V5).

We isolated **two genuinely independent problems** — proven independent because removing `ORDER BY id` flipped the plan:

### Cause 1 — the `ORDER BY id LIMIT` optimizer trap (plan choice)
With `ORDER BY id ASC LIMIT n`, the optimizer bets: "walk the PRIMARY key in id order, filter each row, stop after n matches." It estimated ~38 rows; it actually scanned **1,000,000** (`Index scan on r using PRIMARY ... rows=1e+6`, ~2.8s). The bet pays off for dense boxes and is catastrophic for sparse ones. **Independent of the index.**

### Cause 2 — 1D B-tree vs a 2D query (index geometry)
`countInArea` (no `ORDER BY`) *did* use `idx_rooms_lat_long_price`, but still scanned ~**483,631** rows. A composite B-tree can only range-*seek* on its leading column (`latitude`); `longitude` becomes a per-row filter (`Using index condition`). For a US box, `latitude 24..52` fully contains Korea's `33..38`, so the latitude seek isn't selective and the discriminating dimension (longitude) can't be seeked.

| Query | Index used | Rows touched | Cause |
|---|---|---|---|
| `findPage` (`ORDER BY id LIMIT`) | PRIMARY | ~1,000,000 | Cause 1 (+ Cause 2 underneath) |
| `countInArea` (`LIMIT 1000`) | lat/lng B-tree | ~483,631 | Cause 2 |

**Decision:** both ultimately need a **2D spatial index**. Chose **Option A**: a DB-generated `POINT` column + `SPATIAL` (R-tree) index, queried with `MBRContains`. DB-generated so no write-path or seed changes.

---

## Layer 4 — Getting the spatial index to actually work (the long slog)

This is where it got deep. Several sub-traps in a row:

### 4a. `Non-boolean expression` (HQL)
First attempt used bare `MBRContains(...)` in a QueryDSL `booleanTemplate`. Hibernate rejected it:
`SemanticException: Non-boolean expression used in predicate context`.
MySQL's `MBRContains` returns an integer (1/0); hibernate-spatial doesn't register it as boolean. **Stopgap:** wrote `MBRContains(...) = 1` (`numberTemplate(...).eq(1)`). ⚠️ This stopgap later turned out to be a problem itself (4d).

### 4b. Schema validation failure on the remote box (not local)
Remote startup crashed:
```
Schema-validation: wrong column type ... column [location] ...
found [geometry (Types#BINARY)], but expecting [varbinary(255) (Types#VARBINARY)]
```
**Root cause:** the entity field used the **wrong `Point` class** —
`import org.springframework.data.geo.Point` instead of `import org.locationtech.jts.geom.Point`.
hibernate-spatial only maps the JTS `Point`; the Spring one mapped to a generic blob (`varbinary(255)`), mismatching the real `geometry` column.
**Why local passed but remote didn't:** local `ddl-auto: none` (no schema check); prod `ddl-auto: validate` (checks every column at startup). The query also only referenced `location` inside a raw template string, so the broken mapping was never exercised locally.
**Fix:** corrected the import to the JTS `Point`.

### 4c. The index existed but was ignored — even when FORCED
After fixing the above, the actual app query (`MBRContains(...) = 1` + `ORDER BY id LIMIT`) still did a full scan. We tested step by step:
- `FORCE INDEX (idx_rooms_location)` → still a **Table scan**. (You can't force an index MySQL considers unusable.)
- **Bare** `MBRContains(...)` (no `= 1`, no `ORDER BY`) → **still a Table scan.**

So the index was genuinely unusable, not just unchosen.

### 4d. Root cause: the column was not SRID-restricted
`SHOW CREATE TABLE rooms` showed:
```sql
`location` point GENERATED ALWAYS AS (st_srid(point(`longitude`,`latitude`),0)) STORED NOT NULL
```
No `SRID` attribute on the column. **MySQL's optimizer only uses a `SPATIAL` index when the column is SRID-restricted** — every value being SRID 0 isn't enough; the column type must declare it.

**Fix #3 — `V10__rooms_location_srid.sql`** (V9 already applied, so a new migration, not an edit):
```sql
ALTER TABLE rooms DROP INDEX idx_rooms_location;
ALTER TABLE rooms DROP COLUMN location;
ALTER TABLE rooms
    ADD COLUMN location POINT
        GENERATED ALWAYS AS (ST_SRID(POINT(longitude, latitude), 0)) STORED NOT NULL SRID 0;
CREATE SPATIAL INDEX idx_rooms_location ON rooms (location);
```
After this, the **bare** query flew:
`Index range scan on r using idx_rooms_location ... actual time=0.08 rows=1` (**2.7 ms**).

### 4e. The `= 1` wrapper blocks the spatial index
With SRID fixed, we re-isolated the two query ingredients:
- **`MBRContains(...) = 1`, no `ORDER BY`** → `type: ALL`, `key: NULL` → **full scan, 4.2s.** The `= 1` wrapper (added in 4a for HQL) hides the spatial relation from MySQL's range optimizer.
- **Bare `MBRContains(...)`, WITH `ORDER BY id LIMIT`** → `idx_rooms_location`, **3.86 ms.** Bare works, and the `ORDER BY` trap did *not* bite for that box.

**Fix #4 — emit bare `MBRContains` from the app:**
- New `config/SpatialFunctionContributor.java` — registers `mbrcontains` as a **boolean** HQL function via `SqmFunctionRegistry.registerPattern("mbrcontains", "MBRContains(?1, ?2)", BOOLEAN)`.
- New `META-INF/services/org.hibernate.boot.model.FunctionContributor` containing `com.airdnd.config.SpatialFunctionContributor`.
- `RoomPredicates.withinBounds` → `Expressions.booleanTemplate("mbrcontains(ST_GeomFromText({0}, 0), {1})", envelopeWkt, room.location)` (bare, no `= 1`).

**Verification:** EXPLAIN ANALYZE of the bare query with `ORDER BY id LIMIT` → **0.1 ms, rows=1**, using `idx_rooms_location`. Cache-independent proof (a cached *scan* would still show `rows=1e6`).

---

## Layer 5 — The intermittent 5-second spikes (Cause 1 returns)

**Symptom:** after all the above, the website still *occasionally* took ~5s. DevTools showed **TTFB 5.5s, download 2.37ms** → time was spent server-side, before the response — and *not* in the now-0.1ms query.

### Dead-end hypothesis (recorded so we don't revisit it)
Suspected **stale pooled DB connections** (Hikari `validationTimeout` default 5s ≈ the 5.5s; NAT dropping idle TCP). **Refuted by evidence:** no error logs, fast after idle, and it reproduced on the **3rd rapid request in a row** — the opposite of stale-after-idle.

### The real trigger (found by the user)
Reproducible: **slow only when the single overseas room sits at the *left (west) edge* of the map; fast in the middle; never at the right edge.** Two real request URLs, both ~30° wide, both over America, **neither** touching Korea, **neither** antimeridian-wrapped:

| Case | west | east | LA (−118.24) position | Time |
|---|---|---|---|---|
| Slow | −119.6 | −89.1 | near **west edge** | 5s |
| Fast | −132.0 | −101.5 | near **middle** | 0.5s |

### Root cause: Cause 1, made lethal by the row's high `id`
The LA room is **`id = 1048563`** with `AUTO_INCREMENT = 1048565` — essentially the **last row** in the table. When the optimizer picks the PK walk (`ORDER BY id ASC`), it scans from `id = 1` upward and finds the only match at the very end → ~1M rows → 5s.

For most boxes the optimizer correctly chooses the spatial index. But MySQL's **spatial cardinality estimate is crude**, and for this particular geometry (LA hugging the west edge) the estimate tips just far enough to make the PK walk look cheaper. The "left edge vs right edge" asymmetry is an artifact of that estimator. **The index is fine; the plan choice is fragile.**

**Confirmation:**
- Slow box, app shape → `possible_keys: idx_rooms_location` but `key: PRIMARY` (chose the PK walk).
- Slow box + `FORCE INDEX (idx_rooms_location)` → `Index range scan ... rows=1`, **8.5 ms**.

### The nuance that makes this non-trivial
The optimizer is **not always wrong** to choose the PK walk:
- **Dense box** (zoomed into Seoul, ~5% match): PK walk fills the 18-row limit in ~360 rows → genuinely faster than a spatial scan.
- **Sparse box** (overseas, 1 match at high id): PK walk is catastrophic.
MySQL can't reliably tell them apart for spatial predicates.

So a **blanket `FORCE INDEX`** trades:
- ✅ overseas/sparse: 5s → ~8ms;
- ✅ city-level domestic: still ~10–100ms;
- ⚠️ extreme "zoomed all the way out over Korea" (~1M matches): ~instant → ~1–2s (must scan all matching entries instead of stopping at 18).

A bounded, rare ~1–2s in exchange for killing an unbounded surprise 5s cliff.

### Status: OUTSTANDING (not yet implemented)
1. **Try first (free):** `ANALYZE TABLE rooms;` then re-EXPLAIN the slow box. *Might* shift the estimate so the optimizer self-corrects (unlikely for spatial, but costs nothing). If `key` becomes `idx_rooms_location`, no code change needed.
2. **If not:** implement `FORCE INDEX (idx_rooms_location)` for the search. QueryDSL-JPA can't emit `FORCE INDEX`, so this means running the ID-retrieval of `findPage`/`countInArea` as a **native query** with the hint, then hydrating `RoomSummary` + ratings as today (two-phase). Accept the dense-box trade-off above.

---

## All changes made this session

| # | File | Change |
|---|---|---|
| Fix 1 | `db/migration/V8__add_rooms_region_index.sql` | new: B-tree index on `region` |
| Fix 1 | `RoomPredicates.java` | `regionContains` → `regionStartsWith` (sargable prefix) |
| Fix 1 | `RoomQueryRepositoryImpl.java` | call site update |
| Fix 2 | `features/maps/ui/RoomResultsMap.tsx` | removed Korea `restriction` + `KOREA_BOUNDS` |
| Fix 3 | `db/migration/V9__add_rooms_spatial.sql` | new: generated `POINT` column + `SPATIAL` index |
| Fix 3 | `db/migration/V10__rooms_location_srid.sql` | new: recreate `location` as `... SRID 0` (the bit that makes the index usable) |
| Fix 3 | `Room.java` | added JTS `Point location` field (read-only mapping); **correct import** `org.locationtech.jts.geom.Point` |
| Fix 3 | `build.gradle` | added `org.hibernate.orm:hibernate-spatial` |
| Fix 4 | `RoomPredicates.java` | `withinLatitude`/`withinLongitude` → `withinBounds` (bare `mbrcontains`) |
| Fix 4 | `config/SpatialFunctionContributor.java` | new: register `mbrcontains` as a boolean function |
| Fix 4 | `META-INF/services/org.hibernate.boot.model.FunctionContributor` | new: registers the contributor |
| Outstanding | `RoomQueryRepositoryImpl.java` | TODO: `FORCE INDEX (idx_rooms_location)` via native query |

---

## How to diagnose this class of problem (playbook)

1. **Read the plan, not the clock.** `EXPLAIN ANALYZE` and compare the access node's **`actual rows`** to the matched rows. `rows=1e6` to return 1 = wasted scan. This is cache-independent (MySQL 8 has no result cache; the buffer pool can't turn a 1M-row scan into a 1-row index lookup).
2. **`key` column tells you the plan choice.** `PRIMARY` when you expected your index = the `ORDER BY id LIMIT` trap. `key: NULL` / `type: ALL` = full scan.
3. **Isolate variables.** We repeatedly split the query into one-change-at-a-time forms (`= 1` vs bare; with vs without `ORDER BY`; FORCE vs not) to attribute the cost.
4. **`FORCE INDEX` + still scanning = index unusable** (e.g., not SRID-restricted, or predicate shape hides it), not merely unchosen.
5. **Localize server vs client** with DevTools: split TTFB (server) from download (network).
6. **Catch intermittent server stalls** with `SHOW FULL PROCESSLIST` (poll in a loop) during a spike + a `jstack` thread dump. If PROCESSLIST shows no active query, the time is app-side.
7. **Geometry gotchas:** SRID-restrict spatial columns; emit spatial predicates **bare**; build the WKT polygon in `(longitude latitude)` order to match `POINT(longitude, latitude)`; watch for antimeridian / `west > east` boxes.

---

## Key fact to remember about this dataset
The overseas test room (LA) is **`id = 1048563`, the newest/last row**. That single fact is what makes the `ORDER BY id` PK-walk so catastrophic for it — the matching row is at the far end of the scan. Any overseas room added later (high id) will hit the same cliff until the `FORCE INDEX` fix lands.
