
Incremental Sync Addendum (v3)

This file supplements v1 and v2, and defines the complete rules for incremental sync.

⸻

📘 Odoo Sync Engine – v3 Specification (Incremental Sync Layer)

Filename: odoo-sync-readme-v3.md
Purpose:
This document extends odoo-sync-readme.md (v1) and odoo-sync-readme-v2.md (v2).
It introduces the incremental sync system used after initial sync completes.

Where conflicts arise:
	•	v3 overrides v2
	•	v2 overrides v1

⸻

🎯 1. Scope of v3

v2 guarantees a correct, safe initial sync using:
	•	fixed windows
	•	ID-based pagination
	•	upsert
	•	all-or-nothing batching

v3 adds:
	•	continuous incremental sync
	•	window generation for new data
	•	updated syncStatus fields
	•	sync session logging

⸻

🧱 2. Updated Data Model Requirements

2.1 odoosyncstatuses (per user)

Add the following fields:

initialSyncDone: boolean                // true after v2 initial sync completes
hasFailedBatches: boolean               // true if ANY batch fails (initial or incremental)
lastCompletedWindowEnd: Date | null     // end-time of last successfully synced window
lastSyncStartedAt: Date
lastSyncCompletedAt: Date
lastSyncFailedAt: Date
lastProcessId: string | null            // pointer to most recent syncSession

Rules:
	•	No ID cursor is stored here.
	•	No write_date cursor is stored here.
	•	Only fixed-window progression is tracked.

⸻

2.2 odoosyncbatches (per batch, unchanged)

Fields remain:

userId
module
startTime
endTime
status: "not_started" | "in_progress" | "done" | "failed" | "permanently_failed"
attempts
recordCountExpected
timestamps

Additional v3 rule:

Batches from incremental syncs are generated using lastCompletedWindowEnd.

⸻

2.3 syncSessions (NEW – lightweight sync logs)

Each time a sync process runs (initial or incremental):

{
  _id,
  userId,
  type: "initial" | "incremental",
  startAt: Date,
  endAt: Date | null,
  status: "success" | "failed" | "partial",
  totalBatches: number,
  successfulBatches: number,
  failedBatches: number
}

Purpose:
	•	Provides a history of sync runs.
	•	Useful for debugging and customer-facing visibility.
	•	Does not affect logic — purely observability.

⸻

🧩 3. Incremental Sync Window Generation (Core of v3)

After initial sync completes:

initialSyncDone = true
lastCompletedWindowEnd = <timestamp of last initial batch end>

Incremental sync rules:

A new incremental batch is created whenever:

now >= lastCompletedWindowEnd + WINDOW_HOURS

Incremental batch window:

startTime = lastCompletedWindowEnd
endTime   = startTime + WINDOW_HOURS

Example:

If:

lastCompletedWindowEnd = Feb 10 00:00

Then next incremental window is:

Feb 10 00:00 → Feb 11 00:00


⸻

🔄 4. Incremental Sync Cron Flow

Cron runs every 10 seconds (same as v2).

For each user:

Case A — initialSyncDone = false

→ Run v2 logic until all initial batches finish
→ Then set:

initialSyncDone = true
lastCompletedWindowEnd = <last initial batch endTime>


⸻

Case B — initialSyncDone = true

→ Check for incremental windows:

if now >= lastCompletedWindowEnd + WINDOW_HOURS:
    create new batch with:
        start = lastCompletedWindowEnd
        end = start + WINDOW_HOURS

→ Insert new odoosyncbatches document (status=not_started)

→ Cron will process it naturally via processNextBatch

When batch completes:

update odoosyncstatuses.lastCompletedWindowEnd = batch.endTime


⸻

🔧 5. Processing Incremental Windows

Incremental windows are processed identical to v2:
	•	fixed window
	•	fetchAllRecordsForWindow using ID pagination
	•	retry up to MAX_BATCH_ATTEMPTS
	•	all-or-nothing
	•	upsert
	•	mark status done/failed
	•	never use shrinking windows (forbidden)
	•	never store lastId (forbidden)
	•	never rely on write_date continuity (forbidden)

v3 introduces zero new fetching logic — just new window generation.

⸻

🆔 6. Behavior Rules (Mandatory)

6.1 No Persisted Cursors

Do NOT store:
	•	lastId
	•	offset
	•	continuation tokens
	•	batch-level write_date

These create gaps and data loss.
Only lastCompletedWindowEnd is used globally.

⸻

6.2 All windows are fixed

No shrinking.
No adaptive logic.
No midpoint logic.
No count-based resizing.

⸻

6.3 Upsert remains mandatory

Every incremental batch must upsert by:

{ userId, odooId } // unique index


⸻

6.4 Incremental windows never overlap

Because they always advance from:

previous batch’s endTime


⸻

🧪 7. Failure Handling

If an incremental batch fails:
	•	attempts += 1
	•	status = “failed”
	•	hasFailedBatches = true

If attempts reaches MAX:
	•	status = “permanently_failed”
	•	window is skipped (no new startTime advancement)
	•	administrator must resolve manually

⸻

📊 8. SyncSessions Lifecycle (Recommended)

Every time a sync process begins:

create syncSession {
   userId,
   type: initial | incremental,
   startAt: now,
   status: "in_progress"
}

At process end:

update session with:
  endAt
  totalBatches
  successfulBatches
  failedBatches
  status = "success" | "failed" | "partial"

Purpose:
	•	Full historical visibility
	•	Customer-facing “What changed in the last sync?”
	•	Debugging incremental sync issues

⸻

🔚 9. Summary (What v3 Adds)

✔ Continuous background syncing

✔ New windows generated as time moves forward

✔ Clean incremental sync using v2 batch engine

✔ lastCompletedWindowEnd is the ONLY global cursor

✔ syncSessions for visibility

✔ No ID or write_date cursor persistence

✔ No adaptive windowing

✔ No change to core ID-pagination logic

You now have:
	•	v1 = baseline
	•	v2 = correct + safe initial sync
	•	v3 = clean incremental sync layer

Together these form a production-grade Odoo → MongoDB sync engine.
