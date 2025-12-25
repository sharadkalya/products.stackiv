Odoo Sync Engine (Node.js + Express + MongoDB + node-cron)

This README is the authoritative specification for implementing the Odoo Sync Engine inside the existing backend.
All developers (human or AI) must follow this spec exactly.

⸻

🧱 1. Overview

The Odoo Sync Engine is a background synchronization pipeline that:
• Connects to each user’s Odoo instance
• Detects installed modules
• Creates time-window-based batches for each module
• Shrinks time windows dynamically so each batch contains ≤ 200 records
• Executes batches sequentially per user
• Executes batches in parallel across users
• Writes module-specific Odoo data into MongoDB
• Retries failed batches up to 4 times
• Ensures no partial writes, no skipped records, and no duplicates

This sync runs in background using node-cron.
The frontend uses /status to monitor sync state, and /dashboard only loads when sync is complete.

The sync pipeline is fault-tolerant, multi-tenant, and scalable enough for an MVP.

⸻

📂 2. Existing Backend Structure (KEEP AS-IS)

We do not change the project layout.
We plug sync into this structure:

backend/src
│
├── controllers
│ ├── odoo.controller.ts
│ ├── dashboard.controller.ts
│ └── ...
│
├── models
│ ├── odoo.model.ts → existing: odooconnectiondetails
│ ├── odooSyncStatus.model.ts → existing: odoosyncstatuses
│ ├── user.model.ts → existing: users
│ ├── odooSyncBatch.model.ts → NEW (batch metadata)
│ ├── odooSaleOrder.model.ts → NEW
│ ├── odooInvoice.model.ts → NEW
│ ├── odooContact.model.ts → NEW
│ ├── odooEmployee.model.ts → NEW
│
├── services
│ ├── odoo.service.ts → existing (rpc logic)
│ ├── odooClient.service.ts → NEW (wrapper around odoo.service.ts)
│ ├── odooSync.service.ts → NEW (core pipeline)
│ ├── windowSizer.service.ts → NEW (batch window adaptation)
│ ├── moduleDataWriter.service.ts → NEW (upsert into module collections)
│ └── ...
│
├── cron
│ └── odooSyncCron.ts → NEW (cron runner)
│
├── utils
│ ├── sleep.ts → NEW
│ ├── time.ts → NEW
│ └── ...
│
└── config
└── sync.config.ts → NEW

⸻

⚙️ 3. Configuration (sync.config.ts)

export const SYNC_CONFIG = {
LIMIT_PER_CALL: 200,
MAX_BATCH_ATTEMPTS: 4,
INITIAL_SYNC_RANGE_DAYS: 90,

MIN_WINDOW_MINUTES: 30,
MAX_WINDOW_HOURS: 24,

API_CALL_DELAY_MS: 1000,
CRON_SCHEDULE: "_/10 _ \* \* \* \*", // every 10 sec

SUPPORTED_MODULES: [
"res.company",
"res.partner",
"res.users",
"hr.employee",
"product.product",
"product.category",
"crm.lead",
"sale.order",
"sale.order.line",
"account.move",
"account.move.line",
"purchase.order",
"purchase.order.line",
"account.journal",
"account.account"
] as const,
};

export type SupportedModule = (typeof SYNC_CONFIG.SUPPORTED_MODULES)[number];

⸻

🗄 4. Database Collections

4.1 Existing collections (use as-is)

odooconnectiondetails

Holds user’s Odoo credentials.

odoosyncstatuses

Holds sync progress for each user:

syncStatus: "not_started" | "in_progress" | "done" | "failed"
connectionInfoAvailable: boolean

users

Standard user accounts.

⸻

4.2 New collection: odoosyncbatches

Stores batch metadata. Every batch = a time window to fetch.

{
userId: string,
module: "sale.order" | "account.move" | ...
startTime: Date,
endTime: Date,
status: "not_started" | "in_progress" | "failed" | "done" | "permanently_failed",
attempts: number,
recordCountExpected?: number
}

⸻

4.3 New module-specific collections

odooSaleOrder.model.ts

odooInvoice.model.ts

odooContact.model.ts

odooEmployee.model.ts

Each must have:

userId (string)
odooId (number)
writeDate (Date)
createDate (Date)
...other Odoo fields

And:

unique index: { userId, odooId }

Sync always uses upsert to prevent duplicates.

⸻

🔌 5. Odoo RPC Client (odooClient.service.ts)

Thin wrapper around your existing odoo.service.ts.

Must expose:

testConnection(conn)

Test Odoo authentication.

getInstalledModules(conn)

Return list of installed Odoo modules.

countRecords(conn, module, start, end)

Perform search_count.

fetchRecords(conn, module, start, end, limit)

Perform search_read with domain:

["&", ["write_date", ">=", start], ["write_date", "<", end]]

⸻

🧠 6. Window Sizing Logic (windowSizer.service.ts)

The sync system uses time windows that are shrunk dynamically to keep record count ≤ 200.

Initial window:

startTime = now - INITIAL_SYNC_RANGE_DAYS
endTime = startTime + MAX_WINDOW_HOURS

Adaptive shrinking algorithm:

while true:
count = search_count(start, end)

    if count <= LIMIT_PER_CALL:
        return (start, end, count)

    else:
        halve the window:
          end = midpoint(start, end)

        if window < MIN_WINDOW_MINUTES:
            throw error "too dense"

This ensures:
• small windows for heavy data
• large windows for light data
• no Odoo overload
• correct batch size

⸻

🔄 7. Sync Lifecycle Flow

STEP 1 — Frontend saves credentials

Backend stores them in odooconnectiondetails
Sets:

odooSyncStatus.syncStatus = "not_started"
connectionInfoAvailable = true

⸻

STEP 2 — Cron detects user with not_started

Cron calls:

prepareSync(userId)

Which: 1. Tests connection 2. Detects installed modules 3. Filters SUPPORTED_MODULES 4. For each module
• generate FIRST batch window
• store batch with status = not_started 5. Update syncStatus → "in_progress"

⸻

STEP 3 — Cron processes user with in_progress

Cron calls:

processNextBatch(userId)

Which: 1. Finds one batch for the user:

status in ["not_started", "failed"]
attempts < MAX_BATCH_ATTEMPTS
sort by startTime asc
limit 1

    2.	Mark batch → "in_progress" (this is the lock)
    3.	Shrink window to safe size
    4.	Fetch count & fetch rows
    5.	Validate:

rows.length === expectedCount

    6.	If mismatch → fail (do NOT write partial data)
    7.	Upsert data into module-specific collection
    8.	Mark batch "done"
    9.	Create NEXT batch for same module:

nextStart = batch.endTime
nextEnd = nextStart + MAX_WINDOW_HOURS

    10.	Sleep 1 second between API calls.

⸻

STEP 4 — Sync completion

When all batches for all modules are:

done OR permanently_failed

Then:

syncStatus = "done"

Frontend can now load dashboard.

⸻

🔁 8. Retry Logic

Each batch has:

attempts < 4 → retry
attempts == 4 → permanently_failed

⸻

🔄 9. Concurrency Rules

1. Sequential per user

Sync must never process two batches for the same user in parallel.

Lock is provided by:

status = in_progress

2. Parallel across users

Cron loops through all users:

for (const user of users) {
await prepareSync or await processNextBatch
}

Each user’s sync is independent.

⸻

✨ 10. Data Writing (moduleDataWriter.service.ts)

Upsert logic per module:
• Use bulk operations
• Key: { userId, odooId }
• Overwrite if duplicate
• Never insert duplicates

Example:

bulk.find({ userId, odooId: row.id }).upsert().updateOne({ $set: transformedRow });

⸻

📣 11. Controller Endpoints

/status

Return:

connectionInfoAvailable
syncStatus

Used by UI for polling.

/dashboard

Only allowed when:

syncStatus === "done"

Else return:

{ error: "sync_not_ready" }

⸻

🕒 12. Cron (odooSyncCron.ts)

Install:

npm install node-cron

Cron runs:
• every 10 seconds
• checks all users
• calls prepareSync or processNextBatch accordingly

Command to run cron:

node dist/cron/odooSyncCron.js

Run via PM2 in production:

pm2 start dist/cron/odooSyncCron.js --name=odoo-sync-cron

⸻

🧹 13. Optional Cleanup Job

Delete stale completed batches:

status in ["done", "permanently_failed"]
updatedAt older than X days
