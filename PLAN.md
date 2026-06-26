# CardLedger — Technical Planning & Specification Document

> **Status:** Pre-development planning document  
> **Scope:** Card Storage Inventory module (Decks In / Decks Out)  
> **Version:** 1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Recommendation](#2-architecture-recommendation)
3. [Data Model / Schema](#3-data-model--schema)
4. [UI Screen List](#4-ui-screen-list)
5. [Transaction Workflow](#5-transaction-workflow)
6. [Immutable Record Strategy](#6-immutable-record-strategy)
7. [Admin Panel Specification](#7-admin-panel-specification)
8. [Modular Design for Future Expansion](#8-modular-design-for-future-expansion)
9. [Risks and Limitations](#9-risks-and-limitations)
10. [Open Questions](#10-open-questions)

---

## 1. Overview

**CardLedger** is a local-first casino card storage inventory application.  
It tracks playing cards moving **into** card storage ("Decks In") and **out of** card storage to the gaming floor ("Decks Out").

### In scope for this module

- Receiving cards into storage (Decks In)
- Issuing cards from storage to the floor (Decks Out)
- Multi-line batch transactions (multiple card types and colors per transaction)
- Signature capture for Security and Gaming Management employees
- Immutable, signed PDF record per transaction
- Running inventory display
- Transaction log with PDF link
- Admin configuration panel
- Correction entry workflow

### Out of scope for this module

- Game assignment tracking
- Post-use / destruction tracking
- Dice or other equipment inventory
- Table fills / credits
- Any future module listed in section 8

---

## 2. Architecture Recommendation

### Option A — Browser / Local Web App (Electron or Tauri)

| Concern | Notes |
|---------|-------|
| **Runtime** | Chromium-based Electron or Tauri wrapping a standard web front-end |
| **Storage** | SQLite via `better-sqlite3` (Electron) or via Tauri's built-in SQLite plugin |
| **PDF generation** | Node.js `pdfkit` or `puppeteer` (headless Chromium print-to-PDF) — both run natively in Electron; no server required |
| **File writing** | Full Node.js `fs` access; PDFs written directly to a local folder |
| **Signature capture** | `signature_pad` canvas library — works natively in a browser context |
| **Tablet UX** | Responsive web CSS — portrait orientation, large touch targets |
| **Offline** | 100 % local; no network required |
| **Updates** | Electron auto-updater or manual install package |

### Option B — Pure Browser App (no desktop wrapper)

| Concern | Notes |
|---------|-------|
| **Runtime** | Any modern browser (Chrome/Edge) on the tablet |
| **Storage** | IndexedDB via `Dexie.js` |
| **PDF generation** | `jsPDF` + `html2canvas` — runs entirely in-browser; no filesystem access |
| **File writing** | Browser "Save As" / `showSaveFilePicker` (File System Access API) — user must confirm each save; no background writing |
| **Signature capture** | `signature_pad` — works in-browser |
| **Tablet UX** | Same responsive CSS |
| **Offline** | Works offline once loaded; use a PWA Service Worker to cache the app shell |
| **Updates** | Cache-busting on next network connection |

### Recommendation: **Option A — Electron (or Tauri) Desktop App**

The primary reason is **automatic, background PDF generation with no user prompts**.  
A casino compliance tool must guarantee that a PDF is written to disk every time a transaction is submitted, without relying on the user to confirm a browser save dialog.  
Electron (or Tauri) provides:

- Full `fs` write access → PDFs saved silently to a configurable folder
- SQLite → reliable relational storage with foreign keys, transactions, and ACID guarantees
- Runs as a normal desktop app on any Windows or macOS tablet
- Single distributable `.exe` / `.dmg` installer

**Tauri** is preferred over Electron if binary size and memory footprint matter; both are otherwise equivalent for this use case.

### Recommended Stack

| Layer | Technology |
|-------|-----------|
| UI framework | React 18 + TypeScript |
| Desktop wrapper | Tauri v2 (or Electron v31 if Tauri is unfamiliar) |
| Local database | SQLite via `better-sqlite3` (Electron) / Tauri SQLite plugin |
| PDF generation | `pdfkit` (Node/Tauri sidecar) |
| Signature capture | `signature_pad` |
| State management | Zustand (lightweight, no boilerplate) |
| Styling | Tailwind CSS (utility-first, easy responsive/portrait layout) |
| Build tool | Vite |
| Testing | Vitest + React Testing Library |

---

## 3. Data Model / Schema

All tables live in a single SQLite database file (`cardledger.db`) stored in the app's user-data directory.

### 3.1 `settings`

Holds singleton property-wide configuration.

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

Default keys:

| key | example value |
|-----|---------------|
| `property_name` | `"Grand Casino"` |
| `pdf_output_dir` | `"/Users/casino/CardLedger/pdfs"` |
| `pdf_header_text` | `"CONFIDENTIAL — Card Storage Log"` |
| `pdf_footer_text` | `"Authorized personnel only"` |
| `allow_partial_boxes` | `"false"` |

### 3.2 `card_types`

```sql
CREATE TABLE card_types (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,          -- e.g. "Baccarat", "Single Deck"
  decks_per_box INTEGER NOT NULL,            -- 8 for Baccarat, 12 for Single Deck
  boxes_per_case INTEGER NOT NULL,           -- configurable per vendor
  active      INTEGER NOT NULL DEFAULT 1    -- soft-delete flag
);
```

### 3.3 `colors`

```sql
CREATE TABLE colors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL UNIQUE,           -- e.g. "Blue", "Red", "Green"
  active     INTEGER NOT NULL DEFAULT 1
);
```

### 3.4 `card_type_colors`

Links which colors are valid for a given card type.

```sql
CREATE TABLE card_type_colors (
  card_type_id INTEGER NOT NULL REFERENCES card_types(id),
  color_id     INTEGER NOT NULL REFERENCES colors(id),
  PRIMARY KEY (card_type_id, color_id)
);
```

### 3.5 `employees`

```sql
CREATE TABLE employees (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL UNIQUE,          -- badge / ID number
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,                 -- "security" | "gaming_management" | "admin"
  active      INTEGER NOT NULL DEFAULT 1
);
```

### 3.6 `transactions`

One row per submitted transaction batch.

```sql
CREATE TABLE transactions (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_uuid     TEXT NOT NULL UNIQUE,            -- UUID v4
  transaction_type     TEXT NOT NULL CHECK (transaction_type IN ('IN','OUT')),
  submitted_at         TEXT NOT NULL,                   -- ISO-8601 UTC timestamp
  security_employee_id INTEGER NOT NULL REFERENCES employees(id),
  security_signature   TEXT NOT NULL,                   -- base64 PNG data URL
  mgmt_employee_id     INTEGER NOT NULL REFERENCES employees(id),
  mgmt_signature       TEXT NOT NULL,                   -- base64 PNG data URL
  notes                TEXT,
  pdf_path             TEXT,                            -- absolute path to generated PDF
  is_correction        INTEGER NOT NULL DEFAULT 0,      -- 1 if this is a correction entry
  corrects_transaction_id INTEGER REFERENCES transactions(id), -- FK to original if correction
  correction_reason    TEXT,
  locked               INTEGER NOT NULL DEFAULT 1       -- always 1 after submission
);
```

### 3.7 `transaction_lines`

One row per card-type/color line item within a transaction.

```sql
CREATE TABLE transaction_lines (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id   INTEGER NOT NULL REFERENCES transactions(id),
  card_type_id     INTEGER NOT NULL REFERENCES card_types(id),
  color_id         INTEGER NOT NULL REFERENCES colors(id),
  full_cases       INTEGER NOT NULL DEFAULT 0,
  loose_boxes      INTEGER NOT NULL DEFAULT 0,
  total_boxes      INTEGER NOT NULL,     -- computed: (full_cases * boxes_per_case) + loose_boxes
  total_decks      INTEGER NOT NULL,     -- computed: total_boxes * decks_per_box
  boxes_per_case   INTEGER NOT NULL,     -- snapshot of config at time of transaction
  decks_per_box    INTEGER NOT NULL      -- snapshot of config at time of transaction
);
```

> **Note:** `total_boxes`, `total_decks`, `boxes_per_case`, and `decks_per_box` are stored as
> snapshots at submission time so that future admin changes to packaging config do not alter
> historical records.

### 3.8 `inventory_snapshots`

Running balance per card-type/color pair, updated atomically with each submitted transaction.

```sql
CREATE TABLE inventory_snapshots (
  card_type_id  INTEGER NOT NULL REFERENCES card_types(id),
  color_id      INTEGER NOT NULL REFERENCES colors(id),
  boxes_on_hand INTEGER NOT NULL DEFAULT 0,
  decks_on_hand INTEGER NOT NULL DEFAULT 0,
  last_updated  TEXT NOT NULL,           -- ISO-8601 UTC timestamp
  PRIMARY KEY (card_type_id, color_id)
);
```

> Inventory is also computable by replaying the `transactions` + `transaction_lines` tables, which
> serves as an audit cross-check.

### 3.9 Entity-Relationship Summary

```
settings (singleton)

card_types ──< card_type_colors >── colors

employees

transactions ──< transaction_lines >── card_types
     │                               └─> colors
     └── employees (security + mgmt, two FKs)
     └── transactions (self-ref for corrections)

inventory_snapshots >── card_types
                    └── colors
```

---

## 4. UI Screen List

### 4.1 Screen: Dashboard / Inventory Summary

**Route:** `/`  
**Orientation:** Portrait (tablet primary)

**Purpose:** At-a-glance current inventory and entry point for new transactions.

**Elements:**

- App header: property name, current date/time
- **Inventory grid** — one card per card-type/color combination showing:
  - Card type name
  - Color
  - Boxes on hand
  - Decks on hand
- **"New Decks In"** primary button
- **"New Decks Out"** primary button
- Navigation links: Transaction Log, Admin

---

### 4.2 Screen: New Transaction — Build Batch

**Route:** `/transaction/new`  
**Orientation:** Portrait (tablet primary)

**Purpose:** Add one or more line items to the transaction batch.

**Elements:**

- Transaction type badge (IN / OUT) — set from Dashboard button, read-only here
- **Line item builder form** (looks like a paper inventory sheet row):
  - Card type selector (dropdown)
  - Color/category selector (filtered by card type)
  - Full cases (numeric input)
  - Loose boxes (numeric input)
  - Auto-calculated: total boxes, total decks (displayed inline, read-only)
  - "Add to Batch" button
- **Running batch table** — shows all added line items with edit (pencil) and remove (trash) icons
- **Running batch totals** (summary of all lines so far)
- "Add Another Line" button
- "Review & Sign" button (disabled until at least one line item is in the batch)
- Optional notes field

---

### 4.3 Screen: Transaction Preview / Confirmation

**Route:** `/transaction/preview`  
**Orientation:** Portrait (tablet primary)

**Purpose:** Show the full transaction preview before capturing signatures.  
This is the fail-safe step — no signatures are captured until the user reviews and confirms.

**Elements:**

- Transaction type (IN / OUT) — large, clearly labelled
- Batch summary table showing all line items with full packaging breakdown:
  - Card type
  - Color
  - Cases × (boxes per case) + loose boxes = total boxes
  - Total boxes × decks per box = total decks
- Grand total row: total boxes across all lines, total decks across all lines
- Notes (if any)
- "Edit Batch" button (returns to Build Batch screen, all line items preserved)
- "Confirm & Proceed to Signatures" button

---

### 4.4 Screen: Signatures

**Route:** `/transaction/sign`  
**Orientation:** Portrait (tablet primary)

**Purpose:** Capture employee identification and handwritten signatures.

**Elements:**

- Section A — Security:
  - Employee name field (or lookup from employee list)
  - Employee ID field
  - Signature pad canvas (full-width, tall enough for a comfortable signature)
  - "Clear Signature" button
- Section B — Gaming Management:
  - Employee name field (or lookup)
  - Employee ID field
  - Signature pad canvas
  - "Clear Signature" button
- "Submit Transaction" button — enabled only when both signatures are present
- "Back to Preview" button

---

### 4.5 Screen: Transaction Submitted (Receipt)

**Route:** `/transaction/submitted/:id`  
**Orientation:** Portrait (tablet primary)

**Purpose:** Confirmation that the transaction is locked and PDF has been generated.

**Elements:**

- Success confirmation (large checkmark or banner)
- Transaction ID and timestamp
- Summary of what was moved
- "View PDF" button (opens generated PDF)
- "Download / Print PDF" button
- "Return to Dashboard" button

---

### 4.6 Screen: Transaction Log

**Route:** `/log`  
**Orientation:** Landscape preferred / Portrait with horizontal scroll

**Purpose:** Searchable, filterable history of all transactions.

**Columns:**

| Column | Notes |
|--------|-------|
| Date / Time | Submitted timestamp |
| Transaction ID | UUID (truncated) |
| Type | IN / OUT |
| Card Types | Summary of line items |
| Security Employee | Name + ID |
| Mgmt Employee | Name + ID |
| Total Boxes | Sum across all lines |
| Total Decks | Sum across all lines |
| Correction | Flag / link to original if applicable |
| PDF | "Open PDF" / "View" button |

**Filters:** date range, IN/OUT, card type, employee

---

### 4.7 Screen: Correction Entry

**Route:** `/transaction/:id/correct`  
**Orientation:** Portrait (tablet primary)

**Purpose:** Create a correcting transaction that references a prior locked record.

**Elements:**

- Read-only display of the original transaction details
- Correction reason (required text field)
- New batch builder (same multi-line form as screen 4.2, pre-populated with opposite of original if helpful)
- Preview step (same as screen 4.3)
- Signature step (same as screen 4.4)
- "Submit Correction" button
- After submission: both the original and correcting transaction IDs shown in the log with a visual indicator

---

### 4.8 Screen: Admin Panel

**Route:** `/admin`  
**Access:** Admin role only (PIN or employee login)

Sub-sections (tabs or accordion):

1. **Property Settings** — name, PDF output directory, header/footer text
2. **Card Types** — add/edit/deactivate card types; set decks-per-box and boxes-per-case per card type
3. **Colors** — add/edit/deactivate colors; assign colors to card types
4. **Employees** — add/edit/deactivate employees; set role (Security, Gaming Management, Admin)
5. **Packaging Rules** — allow partial boxes toggle (default: disabled)
6. **Backup / Export** — manual SQLite backup button, export log to CSV

---

## 5. Transaction Workflow

### 5.1 Normal Transaction Flow

```
1. Dashboard
   └─ Tap "New Decks In" or "New Decks Out"

2. Build Batch screen
   ├─ Select card type → color → cases → loose boxes
   ├─ App auto-calculates total boxes and total decks
   ├─ Tap "Add to Batch"
   ├─ Running batch table appears (or updates)
   ├─ Repeat for additional line items
   └─ Tap "Review & Sign"

3. Preview / Confirmation screen
   ├─ Full breakdown shown (cases × boxes/case + loose = total boxes → × decks/box = total decks)
   ├─ Grand totals shown
   ├─ Tap "Edit Batch" → return to step 2 (batch preserved)
   └─ Tap "Confirm & Proceed to Signatures"

4. Signatures screen
   ├─ Enter Security employee name / ID
   ├─ Capture Security signature on canvas
   ├─ Enter Gaming Management employee name / ID
   ├─ Capture Gaming Management signature on canvas
   └─ Tap "Submit Transaction"

5. Backend processing (atomic, in a single SQLite transaction):
   a. Write `transactions` row (locked = 1)
   b. Write all `transaction_lines` rows
   c. Update `inventory_snapshots` (add for IN, subtract for OUT)
   d. Generate PDF → save to configured folder
   e. Update `transactions.pdf_path`

6. Submitted screen
   ├─ Show transaction ID, timestamp, summary
   ├─ "View PDF" button
   └─ "Return to Dashboard"
```

### 5.2 Packaging Calculation Rules

```
total_boxes = (full_cases × boxes_per_case) + loose_boxes
total_decks = total_boxes × decks_per_box
```

Where `boxes_per_case` and `decks_per_box` come from the `card_types` table at the time the line item is built.

**Partial box guard:** If `allow_partial_boxes` setting is `false` (default), the UI only allows whole-number inputs and only permits movement in full packaging units. A future admin setting can relax this.

### 5.3 Correction Workflow

```
1. Log screen → locate original transaction → tap "Correct"

2. Correction Entry screen
   ├─ Original transaction shown read-only
   ├─ Enter correction reason (required)
   └─ Build correcting batch (e.g. reversing line items or adjusting quantities)

3. Preview step (same as normal flow)

4. Signatures step (same as normal flow — both Security and Mgmt must sign)

5. Backend processing (atomic):
   a. Write new `transactions` row with:
      - is_correction = 1
      - corrects_transaction_id = <original ID>
      - correction_reason = <entered reason>
   b. Write correcting `transaction_lines`
   c. Update `inventory_snapshots` to reflect correcting amounts
   d. Generate correction PDF (clearly labelled "CORRECTION — references TX-XXXX")
   e. Both original and correction records remain in log, both immutable

6. Log screen shows correction row linked to original
```

---

## 6. Immutable Record Strategy

### 6.1 Database Immutability

- The `transactions` table has a `locked` column always set to `1` on insert.
- No `UPDATE` or `DELETE` SQL is permitted on `transactions` or `transaction_lines` rows at the application layer.
- All correction logic creates new rows — never modifies existing ones.
- If enhanced tamper-resistance is needed: hash (`SHA-256`) the serialized transaction JSON at submission time and store the hash in the `transactions` table; re-verify on load.

### 6.2 PDF Generation

Each submitted transaction produces a PDF with the following content:

- Property name and logo (if configured)
- PDF header text (from settings)
- Transaction ID (UUID) and submission timestamp
- Transaction type: IN or OUT
- Line items table (card type, color, cases, loose boxes, total boxes, total decks)
- Grand totals
- Notes
- Security employee name, ID, and signature image
- Gaming Management employee name, ID, and signature image
- Resulting inventory balance per affected card-type/color at time of submission
- PDF footer text (from settings)
- "CORRECTION — References: TX-XXXX" banner if applicable

**PDF tool:** `pdfkit` (Node.js) called from the Electron/Tauri main process.  
PDFs are saved to `{pdf_output_dir}/{YYYY-MM}/{transaction_uuid}.pdf`.  
The path is recorded in `transactions.pdf_path`.

### 6.3 Fallback (Pure Browser)

If a pure-browser deployment is ever required:
- Use `jsPDF` + `html2canvas` to render the submitted form to PDF in-browser.
- Trigger a download prompt (`showSaveFilePicker` or `<a download>`).
- Store the PDF as a Blob in IndexedDB alongside the transaction record.
- Accept that the file system write is not fully automatic in this mode.

---

## 7. Admin Panel Specification

### 7.1 Property Settings

| Field | Type | Notes |
|-------|------|-------|
| Property name | Text | Shown in app header and PDF |
| PDF output directory | Directory picker | Where PDFs are saved |
| PDF header text | Text area | Printed at top of every PDF |
| PDF footer text | Text area | Printed at bottom of every PDF |

### 7.2 Card Types

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | e.g. "Baccarat", "Single Deck" |
| Decks per box | Integer | e.g. 8 (Baccarat), 12 (Single Deck) |
| Boxes per case | Integer | Configurable per vendor/property |
| Active | Toggle | Soft-delete; deactivated types hidden from transaction form |

### 7.3 Colors

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | e.g. "Blue", "Red", "Green", "Yellow" |
| Assigned to card types | Multi-select | Which card types this color applies to |
| Active | Toggle | Soft-delete |

### 7.4 Employees

| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Full name |
| Employee ID | Text | Badge / ID number; must be unique |
| Role | Select | Security / Gaming Management / Admin |
| Active | Toggle | Deactivated employees hidden from transaction form |

### 7.5 Packaging Rules

| Setting | Type | Default | Notes |
|---------|------|---------|-------|
| Allow partial boxes | Toggle | Off | When off, only full-box quantities permitted |

### 7.6 Backup / Export

- **Backup SQLite:** Copies `cardledger.db` to a user-chosen location.
- **Export log to CSV:** Exports `transactions` + `transaction_lines` joined view to CSV.

---

## 8. Modular Design for Future Expansion

### 8.1 Module Boundary

The card storage inventory feature is a **self-contained module** within CardLedger.  
It owns its own database tables (all prefixed `card_`), its own routes, and its own components.

Shared system concepts are designed as **standalone shared modules** from day one, even if only the card inventory module uses them initially:

| Shared Module | Purpose |
|---------------|---------|
| `core/employees` | Employee records, roles, ID validation |
| `core/signatures` | Signature capture canvas + base64 serialization |
| `core/immutable-records` | Locked-record pattern, hash verification |
| `core/pdf` | PDF generation engine (pdfkit wrapper) |
| `core/audit-log` | Append-only audit event log (separate from transaction log) |
| `core/settings` | Property-wide configuration key/value store |
| `core/corrections` | Correction/addendum entry pattern |
| `core/auth` | Admin PIN or employee login (future) |

### 8.2 Possible Future Modules

| Module | Description |
|--------|-------------|
| `dice-inventory` | Same IN/OUT pattern for dice inventory |
| `table-fills` | Table fills and credits log |
| `key-control` | Key issuance and return log |
| `equipment-malfunction` | Equipment malfunction reporting |
| `surveillance-activity` | Surveillance log entries |
| `incident-reporting` | Incident reports with attachments |
| `evidence-custody` | Evidence release / chain of custody |
| `bolo-watchlist` | BOLO / watchlist tracking |

### 8.3 Architectural Principle

Each future module will consume `core/*` shared services and follow the same:
- Transaction → Preview → Signature → Submit → PDF pattern
- Immutable record + correction entry pattern
- Employee lookup from `core/employees`
- PDF generation from `core/pdf`

The card inventory module must not contain hard-coded assumptions about being the only module.  
Route namespacing (`/cards/*`), table name prefixes (`card_types`, `card_*`), and component namespacing (`CardTransaction`, `CardLog`, etc.) enforce this isolation.

---

## 9. Risks and Limitations

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|-----------|
| 1 | Tablet goes offline mid-transaction before PDF is written | Low | High | SQLite write and PDF generation are atomic in the Electron/Tauri main process; if PDF fails, the transaction is rolled back |
| 2 | Employee enters wrong quantity and submits before noticing | Medium | Medium | Preview screen with full breakdown before signatures; correction workflow after submission |
| 3 | Signature canvas not usable on older resistive-touch tablets | Low | Medium | Test early; `signature_pad` has broad device support; consider mouse fallback |
| 4 | PDF output directory becomes full or unavailable | Low | High | Validate directory on startup; alert admin; fall back to app-data directory |
| 5 | Admin changes `boxes_per_case` after historical transactions | Low | High | Snapshot `boxes_per_case` and `decks_per_box` in `transaction_lines` at submission time |
| 6 | Multiple clerks use the same tablet simultaneously | Low | Medium | Single-user session assumption is sufficient for V1; add login in V2 |
| 7 | Database corruption from abrupt power loss | Low | High | SQLite WAL mode; regular admin-triggered backups; future: cloud sync backup |
| 8 | Pure-browser deployment loses PDF auto-save | Medium | Medium | Recommend desktop wrapper; document browser limitation clearly |
| 9 | Inventory counts drift from transaction log | Low | High | `inventory_snapshots` can be rebuilt by replaying `transactions` + `transaction_lines`; add admin "Recalculate Inventory" function |
| 10 | No authentication in V1 | High | Medium | Acceptable for V1 kiosk use; plan `core/auth` for V2; admin panel should be PIN-protected from V1 |

---

## 10. Open Questions

The following questions should be answered by the casino operations team before coding begins:

1. **Boxes per case:** What is the exact number of Baccarat boxes per case and Single Deck boxes per case for your primary vendor(s)? (These become defaults in the admin panel but should be verified.)

2. **Colors in use:** Which card colors are currently in use at this property, and do they differ between Baccarat and Single Deck cards?

3. **Employee validation:** Should employee IDs be validated against a pre-loaded employee list, or is free-text entry with optional lookup acceptable for V1?

4. **Signature legal standing:** Will the captured on-screen signatures be used as legally binding gaming compliance records? If so, a signature audit trail (timestamp, device ID, IP) may be required beyond what is described here.

5. **PDF storage location:** Where should PDFs be saved? (Local folder on the tablet, network share, or both?) Who is responsible for backing up the PDF folder?

6. **Admin access control:** Should admin panel access require a PIN, a separate admin employee login, or is physical access to the tablet sufficient?

7. **Partial boxes:** Are there any current or planned scenarios where cards leave storage in quantities smaller than a full box? (Partial box support is designed but disabled by default.)

8. **Multiple properties / tablets:** Will this app run on a single tablet per property, or on multiple tablets at the same property that need to share inventory data? (Multi-tablet sync is out of scope for V1 but would require a local server or cloud backend.)

9. **Correction frequency:** How often do corrections occur in practice? This informs how prominent the "Correct" button should be in the UI.

10. **Print vs. digital PDF:** Should the generated PDF always be printed immediately, sent to a print queue, or stored digitally only? Is there a network printer available at the card storage station?

11. **Audit / compliance review:** Will an external auditor or gaming commission ever need access to the transaction log and PDFs? If so, the export format (CSV, PDF report, or direct database access) needs to be agreed upon.

12. **Data retention:** How long must records be kept? Is there a regulatory retention period? Should records older than N years be archived or purged?

---

*End of planning document.*
