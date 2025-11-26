
📘 Odoo Sync Engine – Specification Addendum (v2)

Purpose:
This document supersedes specific behaviors defined in odoo-sync-readme.md.
Where conflicts exist, v2 overrides v1.
This is the official specification for implementing the upgraded batching logic, pagination strategy, and deduplication model.

⸻

🚨 1. Removal of Dynamic Time-Window Shrinking

The following v1 components are deprecated and must not be used:
	•	Section 6. Window Sizing Logic
	•	The concept of “shrinking windows until ≤ LIMIT_PER_CALL”
	•	Halving windows, midpoint windows, adaptive windows
	•	Any use of:
	•	MIN_WINDOW_MINUTES
	•	MAX_WINDOW_HOURS
	•	Any mechanism that throws "too dense" errors
	•	The file windowSizer.service.ts

Time windows are now fixed and immutable.

⸻

📅 2. Fixed Window Model (New v2 Behavior)

Each batch corresponds to a fixed time window, typically:

WINDOW_HOURS = 24

Windows are generated as:

initialStart = now() - INITIAL_SYNC_RANGE_DAYS
initialEnd   = initialStart + WINDOW_HOURS

Subsequent batches:

nextStart = previousBatch.endTime
nextEnd   = nextStart + WINDOW_HOURS

Windows never shrink, never expand, and never adapt dynamically.

⸻

🔍 3. ID-Based Pagination (New Core Mechanism)

Fetching records for a batch now uses deterministic, retry-safe, ID-based pagination, not count-based window shrinking.

Domain Filter:

[
  ["write_date", ">=", startTime],
  ["write_date", "<", endTime],
  ["id", ">", lastId]
]

Ordering:

order: "id asc"

Pagination Logic:
	•	limit = LIMIT_PER_CALL (default: 200)
	•	lastId starts at 0 for each attempt
	•	Fetch pages until the result is empty
	•	Maintain lastId in memory only (never stored)

This ensures:
	•	No skipped records
	•	No reliance on timestamp density
	•	Correct behavior during CSV imports and Odoo bursts

⸻

🔁 4. Batch Attempt Rules (All-or-Nothing)

A batch attempt follows:
	1.	Mark batch as "in_progress"
	2.	Fetch all records for its window using ID pagination
	3.	Optionally validate with search_count
	4.	If any part fails:
	•	discard all fetched rows
	•	increment attempts
	•	set status "failed" or "permanently_failed"
	5.	If successful:
	•	upsert all rows
	•	set status = "done"
	•	set recordCountExpected = rows.length

No partial writes are ever permitted.

⸻

🧪 5. Canonical Function: fetchAllRecordsForWindow()

This is the required algorithm for stable pagination:

lastId = 0
allRows = []

loop:
    rows = fetchRecords(limit=200, id > lastId)

    if rows.length == 0:
        break

    allRows.push(...rows)

    lastId = max(row.id for row in rows)

    sleep(API_CALL_DELAY_MS)

return allRows

This function never writes to the database.
It is purely an in-memory fetch mechanism.

⸻

🧱 6. Mandatory Deduplication: Upsert + Unique Index

To prevent duplicates under retries, overlapping windows, or dense write_date areas:

6.1 Required Unique Index

Every module-specific collection must include:

{ userId: 1, odooId: 1 } with unique: true

This is a hard requirement.

6.2 Required Upsert Strategy

All writes must use upsert:

filter = { userId, odooId: row.id }
update = { $set: transformedRow }
options = { upsert: true }

Implemented via bulk operations.

6.3 Guarantees

This ensures:
	•	retries never create duplicates
	•	overlapping windows never create duplicates
	•	reprocessing a failed batch overwrites cleanly
	•	CSV imports or bulk backfills do not break the sync

This deduplication model is core to v2 correctness.

⸻

🧷 7. Behavior Under Bursts (CSV Imports, Bulk Updates)

The engine is now resilient to:
	•	10,000+ records with identical write_date
	•	massive CSV imports
	•	batch-created records
	•	intense automation activity
	•	backfilled historical data

Why it works:
	•	fixed windows prevent edge-case shrink loops
	•	ID pagination never gets stuck
	•	dedup via upsert collapses duplicates
	•	no partial writes ensure correctness
	•	no persisted cursor prevents corrupt continuation

⸻

❌ 8. Forbidden v1 Behaviors in v2

These patterns are no longer allowed anywhere:
	•	shrinking time windows
	•	halving or splitting windows
	•	storing or reusing a last processed ID
	•	dynamically determining window size via record count
	•	inserting without upsert
	•	writing partial batch results

Any implementation using these must be refactored.

⸻

🔧 9. Unchanged v1 Sections (Still Valid)

The following remain intact unless they contradict v2:
	•	Overall architecture
	•	Cron orchestration
	•	Sync status management
	•	Retry rules (MAX_BATCH_ATTEMPTS = 4)
	•	Per-user sequential processing
	•	Parallel processing across users
	•	/status and /dashboard endpoints
	•	Module collections’ field schemas (except new required index)
	•	moduleDataWriter bulk upsert pattern

⸻

🏁 10. v2 Overrides Summary

This v2 document overrides:

Fully replaced:
	•	v1 Section 6: Window Sizing Logic
	•	All references to dynamic shrinking
	•	All adaptive window mechanics
	•	All logic related to count-driven window adjustment

Partially replaced:
	•	v1 batching logic
	•	v1 fetch logic
	•	v1 deduplication guarantees

New mandatory additions:
	•	Fixed time windows
	•	ID-based pagination
	•	All-or-nothing batch attempts
	•	Upsert-by-(userId, odooId)
	•	Unique index requirements

⸻

✔ Final Statement

This v2 spec is the single source of truth for how batching, pagination, retries, and deduplication must operate going forward.
All future development must follow this specification.
