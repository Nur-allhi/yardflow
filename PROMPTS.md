# PROMPTS.md — YardFlow ERP
# Google Stitch UI Design Prompts — All Screens

> **How to use this file:**
> 1. Attach your `DESIGN.md` file in every Stitch session.
> 2. Add this line at the top of every prompt: _"Use the attached DESIGN.md as the single source of truth for all colors, typography, spacing, radius, elevation, and components."_
> 3. Copy the prompt for the screen you want to generate.
> 4. Generate one screen at a time.

---

## GLOBAL PREAMBLE
> Paste this block before EVERY screen prompt below.

```
Use the attached DESIGN.md as the single source of truth for all colors,
typography, spacing, radius, elevation, and components.

DESIGN SYSTEM SUMMARY:
- Primary Navy #0F172A — sidebar, headers, primary buttons
- Slate #64748B — secondary text, muted labels, borders
- Sage Green #059669 — CTAs, active states, positive values, links
- Background #F8FAFC — page canvas
- Surface #FFFFFF — cards, panels
- Success #22C55E | Warning #EAB308 | Error #EF4444 | Info #0EA5E9
- Headlines: Plus Jakarta Sans | Body & UI: DM Sans | Numbers & data: Fira Code
- Spacing base: 8px | Card padding: 24px | Default radius: 8px
- Shadows: soft and diffused, never harsh

LAYOUT — DESKTOP (PRIMARY):
- Fixed left sidebar: 240px wide, #0F172A background, white icons and text
- Sidebar nav items: Dashboard, Inventory, Purchases, Sales, HR, Accounts, Reports, Settings
- Active nav item: left Sage Green accent bar, slightly lighter navy background
- Top bar: page title in Plus Jakarta Sans 24px semibold, right-aligned user avatar + org name
- Content area: #F8FAFC background, 32px padding

LAYOUT — MOBILE (SECONDARY, 375px):
- No sidebar — bottom tab bar with 5 icons: Home, Sales, Stock, HR, Menu
- Top bar: hamburger left, page title center, avatar right
- Content stacks vertically, full width

TONE: Industrial but clean. Trustworthy, fast to scan, dense with useful
information without feeling cluttered. Precision over decoration.
No gradients, no illustrations. Data is the hero.
Currency: ৳ (Bangladeshi Taka). Weight: kg. Language: English.
```

---

## SCREEN 01 — Login

```
SCREEN TO DESIGN: Login Page (/login)

This is the entry point for all users (owner, manager, worker) of a
YardFlow ERP system. It is a full-page auth screen, no sidebar.

DESKTOP LAYOUT:
- Split layout: left half and right half
- Left half (#0F172A navy background):
  - Centered vertically
  - App name "YardFlow ERP" in Plus Jakarta Sans 32px bold, white
  - Tagline below: "Manage your workshop. Track every kilogram." in DM Sans
    16px, #94A3B8
  - Below tagline: 3 small icon + text rows summarizing key features:
    - "Inventory & Stock Tracking"
    - "Sales, Purchases & Dues"
    - "Payroll & Reports"
  - Each row: small sage green icon, DM Sans 14px white text
- Right half (#F8FAFC background):
  - Centered card (#FFFFFF, 8px radius, soft shadow, 48px padding)
  - "Welcome back" in Plus Jakarta Sans 24px semibold #0F172A
  - "Sign in to your organization" in DM Sans 14px #64748B, below title
  - Email input field (label: "Email address")
  - Password input field (label: "Password") with show/hide toggle icon
  - Primary button full width: "Sign In" (#0F172A fill, white text)
  - Below button: "Forgot password?" sage green ghost link, right-aligned
  - Divider line with "or" text
  - Secondary outlined button: "Register your business" full width
  - Footer text: "Multi-tenant — your data is completely private"
    in DM Sans 12px #94A3B8, centered

MOBILE LAYOUT (375px):
- Single column, full screen
- Top: app name + tagline centered, #0F172A background, top 40% of screen
- Bottom: white card slides up with rounded top corners (16px radius)
- Same form fields and buttons as desktop right panel
- No feature list shown on mobile
```

---

## SCREEN 02 — Business Registration

```
SCREEN TO DESIGN: Business Registration Page (/register)

New businesses register here. Creates the organization + owner account.
Full-page, no sidebar, no top bar.

DESKTOP LAYOUT:
- Centered single card on #F8FAFC background, max-width 560px
- Card: #FFFFFF, 8px radius, md shadow, 40px padding
- Top: "YardFlow ERP" app name in Plus Jakarta Sans 20px bold #0F172A,
  centered, with a small dark logo mark beside it
- Below: "Register your business" in Plus Jakarta Sans 28px bold #0F172A
- Sub-label: "Set up your organization in 2 minutes" DM Sans 14px #64748B

SECTION 1 — Organization Details (Plus Jakarta Sans 16px semibold label):
- Business Name (text input, required)
- Phone Number (text input)
- Business Address (textarea, 3 rows)

SECTION 2 — Owner Account:
- Your Full Name (text input)
- Email Address (text input)
- Password (password input with strength indicator bar below:
  weak = #EF4444, medium = #EAB308, strong = #22C55E)
- Confirm Password (password input)

Below form:
- Primary full-width button: "Create Organization & Sign In"
- Link below: "Already registered? Sign in →" in sage green

MOBILE LAYOUT (375px):
- Same content, full width, 20px horizontal padding
- Sections stack naturally
- Button pinned to bottom of viewport as sticky CTA
```

---

## SCREEN 03 — Main Dashboard

```
SCREEN TO DESIGN: Main Dashboard (/dashboard)

The owner's home screen. Shows full business health at a glance.
Must feel like a command center — dense but organized.

DESKTOP LAYOUT:

ROW 1 — Quick Actions Bar (below top nav):
- 4 primary action buttons in a horizontal row, right-aligned:
  "+ New Sale" (primary #0F172A), "+ New Purchase" (secondary outlined),
  "Record Advance" (ghost), "Generate Report" (ghost)

ROW 2 — 4 KPI Stat Cards (equal width, side by side):
1. "Total Stock" — e.g. 48,200 kg, neutral navy accent
2. "Today's Sales" — e.g. ৳1,24,500, sage green positive accent
3. "Customers Owe Us" — e.g. ৳3,20,000, amber warning accent
4. "We Owe Vendors" — e.g. ৳85,000, amber warning accent
Each card: white surface, 8px radius, soft shadow, large Fira Code number,
DM Sans label, small trend arrow with % change vs yesterday/last month

ROW 3 — 2 columns:
LEFT (60%): "Recent Sales" table
- Columns: Date | Customer | Type | Weight | Amount | Status | Action
- Sale Type chips: "Fabricated" (navy), "Raw" (slate), "Scrap" (sage green)
- Status chips: "Paid" (success), "Due" (warning), "Partial" (info)
- 5 sample rows with Bangladeshi data (customer names like "Rahim Traders",
  amounts like ৳45,000, weights like 480 kg)
- Table rows: 48px height, 1px #F1F5F9 dividers, #F8FAFC hover
- "View all sales →" sage green link at bottom right

RIGHT (40%): "Stock Levels" panel
- Card title: "Stock Overview"
- List of iron subtypes with stock bars:
  Plates 5-8mm → 12,400 kg (sage green bar, 80% full)
  Plates 12-13mm → 8,200 kg (sage green bar, 55%)
  Angle Iron 50mm → 3,100 kg (amber bar, 20% — low stock warning badge)
  Girder 150mm → 6,800 kg (sage green bar, 45%)
- Each row: subtype name DM Sans 14px, kg in Fira Code 14px bold, fill bar
- Low stock: amber "Low" chip badge on the right
- "Manage Inventory →" link at bottom

ROW 4 — 3 columns:
LEFT (33%): "Account Balances"
- Each account as a row: account name, balance in Fira Code, account type chip
  Cash → ৳42,000 (chip: CASH)
  Dutch Bangla Bank → ৳1,85,000 (chip: BANK)
  bKash Business → ৳23,500 (chip: BANK)
- Divider, then "Total: ৳2,50,500" in Fira Code 20px bold #0F172A

MIDDLE (33%): "Pending Dues"
- Two tabs: "To Collect" / "To Pay"
- "To Collect" active tab:
  3 rows: customer name, amount in Fira Code amber, overdue indicator
  "Record Payment" ghost button appears on hover
- Tab toggle uses sage green underline for active

RIGHT (33%): "Pending Salaries"
- Title: "Payroll — May 2025"
- List of workers not yet fully paid:
  Rahim (Welder) — Net payable: ৳7,000 — "Pay" button
  Karim (Helper) — Net payable: ৳12,000 — "Pay" button
  Salim (Manager) — Net payable: ৳17,000 — "Pay" button
- "View Full Payroll →" link at bottom

MOBILE LAYOUT (375px):
- Quick actions: 2x2 grid of compact icon+label buttons
- KPI cards: 2x2 grid
- Recent Sales collapses to card list (no table)
- Account balances, dues, salaries stack as individual cards below
```

---

## SCREEN 04 — Inventory: Stock Overview

```
SCREEN TO DESIGN: Inventory Stock Overview (/inventory)

Shows current stock levels for all material sub-types. Owner checks this
daily to know what's in the workshop.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Inventory" | Breadcrumb: Dashboard > Inventory
- Right side: "+ Add Category" secondary button, "+ Add Sub-type" primary button

SUB-NAVIGATION TABS (below header, horizontal):
Stock Overview | Categories | Sub-types | Scrap Pool | Consumables
Active tab: sage green underline, #0F172A text. Inactive: #64748B text.

MAIN CONTENT — Stock Overview tab active:

Summary bar (4 mini stat cards in a row):
- Total Stock: 48,200 kg
- Total Stock Value: ৳42,50,000 (at WAC)
- Scrap Pool: 1,240 kg
- Low Stock Alerts: 2 items (error red accent)

Below summary — grouped by category:

CATEGORY GROUP: "Iron Plates" (collapsible, expanded by default)
- Group header: category name Plus Jakarta Sans 16px semibold, total kg for
  category in Fira Code, chevron icon
- Table inside group:
  Columns: Sub-type | Current Stock (kg) | WAC (tk/kg) | Stock Value (৳) |
           Last Movement | Status
  Rows:
  Plates 5-8mm    | 12,400 kg | ৳108.13 | ৳13,40,812 | 2 days ago | In Stock (green chip)
  Plates 9-11mm   | 8,200 kg  | ৳94.50  | ৳7,74,900  | 5 days ago | In Stock (green chip)
  Plates 12-13mm  | 3,100 kg  | ৳91.00  | ৳2,82,100  | 1 day ago  | Low Stock (amber chip)
  Plates 14-20mm  | 0 kg      | ৳87.00  | ৳0         | 12 days ago| Out of Stock (red chip)

CATEGORY GROUP: "Angle Iron" (collapsed, show total only in header)
CATEGORY GROUP: "Girder" (collapsed)

All values use Fira Code for numbers.
Row hover: #F8FAFC. Row height: 48px. Dividers: 1px #F1F5F9.

Right side of each row: action icon (kebab menu) with options:
View Ledger | Edit Sub-type | Set Alert Threshold

MOBILE LAYOUT (375px):
- Tabs become horizontal scrollable pills
- Each sub-type becomes a card: name, stock kg large, WAC small, status chip
- Categories shown as section headers between cards
```

---

## SCREEN 05 — Inventory: Categories & Sub-types Management

```
SCREEN TO DESIGN: Inventory Sub-types Management (/inventory/subtypes)

Where the owner configures what types of iron they deal in.
Same tab navigation as Screen 04, "Sub-types" tab active.

DESKTOP LAYOUT:

Two panels side by side:

LEFT PANEL (35%) — Categories list:
- Panel title: "Categories" with "+ Add" small button top right
- List of categories as rows:
  Iron Plates (6 sub-types) — active, sage green left border
  Angle Iron (4 sub-types)
  Girder (3 sub-types)
  + Add Category row at bottom (ghost style, dashed border)
- Clicking a category loads its sub-types on the right

RIGHT PANEL (65%) — Sub-types for selected category:
- Panel title: "Iron Plates — Sub-types" with "+ Add Sub-type" primary button
- Table:
  Columns: Sub-type Name | Default Price (tk/kg) | Unit | Status | Actions
  Rows:
  5-8mm (Thin)      | ৳110.00 | kg | Active (green chip) | Edit | Deactivate
  9-11mm            | ৳95.00  | kg | Active              | Edit | Deactivate
  12-13mm           | ৳92.00  | kg | Active              | Edit | Deactivate
  14-20mm           | ৳87.00  | kg | Active              | Edit | Deactivate
  25mm (Thick)      | ৳90.00  | kg | Active              | Edit | Deactivate
  50mm (Very Thick) | ৳95.00  | kg | Inactive (slate chip)| Edit | Activate

MODAL overlay shown (add/edit sub-type):
- Modal: 480px wide, 8px radius, lg shadow, 32px padding
- Title: "Add Sub-type" Plus Jakarta Sans 20px semibold
- Fields: Sub-type Name, Default Price per kg (number input with ৳ prefix),
  Unit (select: kg / ton), Low Stock Alert Threshold (kg)
- Buttons: "Save Sub-type" primary, "Cancel" ghost

MOBILE LAYOUT (375px):
- Left panel becomes a horizontal scrollable chip row for category selection
- Right panel takes full width showing sub-type cards
- Modal becomes bottom sheet (slides up from bottom, rounded top corners)
```

---

## SCREEN 06 — Inventory: Scrap Pool

```
SCREEN TO DESIGN: Scrap Pool (/inventory/scrap)

Shows the accumulated scrap iron waiting to be sold. Same tab nav,
"Scrap Pool" tab active.

DESKTOP LAYOUT:

TOP — 3 KPI cards in a row:
1. "Current Scrap Pool" — 1,240 kg (large Fira Code, sage green accent)
2. "Estimated Value" — ৳62,000 at ৳50/kg (Fira Code, slate)
3. "Last Scrap Sale" — 15 days ago, 800 kg sold (Fira Code, slate)

Below KPIs — 2 columns:

LEFT (60%): "Scrap Movement History"
- Table: Date | Movement Type | Quantity (kg) | Reference | Note
- Movement types as chips:
  "Added" (sage green) — from period reconciliation
  "Sold" (navy) — from scrap sale
- 8 rows of sample data
- "IN" movements: reference = "Period Reconciliation — April 2025"
- "OUT" movements: reference = "Scrap Sale #SC-004"
- Running balance column on right edge

RIGHT (40%): "Record Scrap Sale" form card
- Card title: "New Scrap Sale"
- Fields:
  Date (date picker)
  Quantity to Sell (kg) — shows "Available: 1,240 kg" helper text
  Price per kg (৳ input, helper: "Current market ~৳50/kg")
  Total Amount (auto-calculated, Fira Code, read-only, sage green)
  Buyer Name (optional text input)
  Receive Payment from (account selector)
  Notes (optional textarea)
- Button: "Record Scrap Sale" primary full-width

MOBILE LAYOUT (375px):
- KPI cards: scrollable horizontal row
- Movement history as card list below
- "New Scrap Sale" becomes a floating "+ Sell Scrap" button that opens
  a bottom sheet form
```

---

## SCREEN 07 — Purchases: Purchase List

```
SCREEN TO DESIGN: Purchases List (/purchases)

All purchases from vendors. Owner and manager use this daily.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Purchases" | right: "+ New Purchase" primary button, "Vendors" secondary button

FILTER BAR (below header):
- Date range picker (From / To)
- Vendor dropdown filter
- Status filter chips: All | Paid | Partial | Due
- Search input: "Search by vendor or note..."

SUMMARY STRIP (between filter and table):
4 inline stats: Total Purchases: ৳12,40,000 | Total Paid: ৳9,80,000 |
Total Due: ৳2,60,000 | This Month: ৳3,20,000
Each stat: DM Sans 12px label, Fira Code 16px bold value, separated by dividers

PURCHASES TABLE:
Columns: Date | Purchase # | Vendor | Items Summary | Total (৳) | Paid (৳) | Due (৳) | Status | Actions
Rows (8 sample rows):
14 May 2025 | PUR-0024 | Chattogram Shipyard | Plates 5-8mm, 12-13mm (2 items) | ৳1,85,000 | ৳1,00,000 | ৳85,000 | Partial (amber) | View | Pay
12 May 2025 | PUR-0023 | Al-Amin Shipbreakers | Angle Iron 50mm (1 item)        | ৳62,000   | ৳62,000   | ৳0      | Paid (green)    | View
...

- Status chips: Paid (green), Partial (amber), Due (red)
- Row hover: #F8FAFC
- "View" link: sage green text button
- "Pay" link: only shown when status is Partial or Due
- Pagination: "Showing 1–10 of 47" with prev/next buttons

MOBILE LAYOUT (375px):
- Filter bar collapses to a filter icon button that opens a bottom sheet
- Table becomes card list:
  Each card: vendor name bold, date small, total large Fira Code, status chip,
  due amount in amber if applicable, View/Pay buttons at bottom of card
```

---

## SCREEN 08 — Purchases: New Purchase Form

```
SCREEN TO DESIGN: New Purchase Entry (/purchases/new)

Where the owner records a new raw material purchase from a shipyard vendor.
This is one of the most used screens in the app.

DESKTOP LAYOUT:
- Wide single-column form, max-width 860px, centered
- Page title: "New Purchase" with back arrow

SECTION 1 — Purchase Details (card):
- Vendor (select dropdown, shows vendor name + total current due in parentheses)
  Below vendor select: "Vendor due balance: ৳85,000" in amber if due exists
- Purchase Date (date picker, default today)
- Note (optional textarea, 2 rows)

SECTION 2 — Line Items (card):
- Section title: "Materials Purchased" with "+ Add Item" sage green button
- Table-style line items (3 rows shown, each row is one iron sub-type):
  Row structure: [Category dropdown] [Sub-type dropdown] [Quantity kg] [Price/kg ৳] [Total ৳] [Remove ×]
  Sample row 1: Iron Plates | 5-8mm | 500 kg | ৳110 | ৳55,000 | ×
  Sample row 2: Iron Plates | 12-13mm | 300 kg | ৳92 | ৳27,600 | ×
  Sample row 3: Angle Iron | 50mm | 200 kg | ৳88 | ৳17,600 | ×
- Items total at bottom right: "Items Total: ৳1,00,200" in Fira Code 18px bold

SECTION 3 — Payment (card):
- "How much are you paying now?" label
- Two options as radio-style cards:
  [Pay Full Amount ৳1,00,200] [Pay Partial Amount]
- If partial selected: "Amount Paying Now" number input appears
- Pay From Account (select: Cash / Dutch Bangla Bank / bKash)
- Summary box below:
  Total Purchase: ৳1,00,200
  Paying Now:     ৳50,000
  Remaining Due:  ৳50,200  ← amber color
  Status will be: Partial   ← amber chip

STICKY BOTTOM BAR:
- Left: items count + total summary
- Right: "Cancel" ghost button | "Save Purchase" primary button

MOBILE LAYOUT (375px):
- Sections stack as full-width cards
- Line items: each item is a compact card with swipe-to-delete
- Sticky bottom bar remains pinned
```

---

## SCREEN 09 — Purchases: Purchase Detail

```
SCREEN TO DESIGN: Purchase Detail (/purchases/[id])

Full view of a single purchase — what was bought and all payment history.

DESKTOP LAYOUT:
- Page title: "Purchase #PUR-0024" with back arrow and status chip "PARTIAL" amber
- Sub-label: "Chattogram Shipyard • 14 May 2025"
- Right: "Record Payment" primary button (if not fully paid)

TWO COLUMN LAYOUT:

LEFT (60%):
CARD 1 — Purchase Summary:
- Vendor: Chattogram Shipyard (clickable link)
- Date: 14 May 2025
- Note: "May shipment - mixed plates"
- Created by: Md. Rahim (owner)

CARD 2 — Items Purchased:
- Table: Material Sub-type | Quantity (kg) | Price/kg | Total
  Plates 5-8mm    | 500 kg  | ৳110 | ৳55,000
  Plates 12-13mm  | 300 kg  | ৳92  | ৳27,600
  Angle Iron 50mm | 200 kg  | ৳88  | ৳17,600
- Total row: ৳1,00,200 in Fira Code bold

RIGHT (40%):
CARD 3 — Payment Summary:
- 3 stat rows:
  Total Amount: ৳1,00,200 (Fira Code bold)
  Total Paid:   ৳50,000   (sage green)
  Balance Due:  ৳50,200   (amber, larger)
- Progress bar: paid portion sage green, remaining amber

CARD 4 — Payment History:
- Table: Date | Amount | Account | Note
  14 May 2025 | ৳50,000 | Cash | Initial payment
- Each row: DM Sans 14px, Fira Code amount
- "Record Payment" button at bottom of card (if still due)

MOBILE LAYOUT (375px):
- Payment summary card appears first (most important info)
- Items table becomes card list below
- Payment history below that
- "Record Payment" sticky bottom button
```

---

## SCREEN 10 — Purchases: Vendor List

```
SCREEN TO DESIGN: Vendor List (/purchases/vendors)

Overview of all suppliers and what is owed to each.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Vendors" | right: "+ Add Vendor" primary button

SUMMARY CARDS (3 in a row):
- Total Vendors: 8
- Total Payable (we owe): ৳2,60,000 (amber accent)
- Settled Vendors: 5 (no due)

VENDOR TABLE:
Columns: Vendor Name | Phone | Type | Total Purchases | Total Paid | Due Balance | Status | Actions
Rows:
Chattogram Shipyard   | 01711-XXXXXX | Shipyard    | ৳8,40,000 | ৳7,55,000 | ৳85,000 | Due (amber chip)    | View | Pay
Al-Amin Shipbreakers  | 01812-XXXXXX | Shipyard    | ৳3,20,000 | ৳3,20,000 | ৳0      | Settled (green chip)| View
Karim Hardware        | 01911-XXXXXX | Consumable  | ৳45,000   | ৳30,000   | ৳15,000 | Due (amber chip)    | View | Pay

- "Due Balance" column: Fira Code, amber color if > 0, green if 0
- "View" opens vendor detail page
- "Pay" opens record payment modal

RECORD PAYMENT MODAL (shown as overlay):
- Title: "Pay Chattogram Shipyard"
- "Outstanding Due: ৳85,000" in amber
- Amount (number input)
- Pay From Account (select)
- Date (date picker)
- Note (optional)
- Buttons: "Record Payment" primary | "Cancel" ghost

MOBILE LAYOUT (375px):
- Table becomes card list: vendor name, type chip, due amount large in amber,
  action buttons at bottom of each card
```

---

## SCREEN 11 — Sales: Sales List

```
SCREEN TO DESIGN: Sales List (/sales)

All sales records. Used by owner and manager to track what was sold and
what is owed by customers.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Sales" | right: "+ Quick Cash Sale" ghost button, "+ New Sale" primary button

FILTER BAR:
- Date range picker
- Customer dropdown
- Sale type chips: All | Fabricated | Raw | Scrap | Quick Cash
- Status chips: All | Paid | Partial | Due

SUMMARY STRIP:
Total Sales: ৳18,40,000 | Total Received: ৳15,20,000 | Total Due: ৳3,20,000 | Today: ৳1,24,500

SALES TABLE:
Columns: Date | Sale # | Customer | Sale Type | Weight (kg) | Total (৳) | Due (৳) | Status | Actions
Rows (8 sample):
19 May 2025 | SAL-0091 | Rahim Traders       | Fabricated (navy chip) | 480 kg  | ৳45,600  | ৳0      | Paid (green)   | View
18 May 2025 | SAL-0090 | Karim Construction  | Raw (slate chip)       | 1,200 kg | ৳1,14,000 | ৳50,000 | Partial (amber)| View | Collect
17 May 2025 | SAL-0089 | Cash Sale           | Fabricated (navy chip) | 120 kg  | ৳11,400  | ৳0      | Paid (green)   | View
16 May 2025 | SAL-0088 | Jahan Steel         | Scrap (sage chip)      | 800 kg  | ৳40,000  | ৳0      | Paid (green)   | View

- "Cash Sale" customer field: shown in #64748B italic (no customer linked)
- "Collect" link only shown if due > 0

MOBILE LAYOUT (375px):
- Each sale: card with customer name, sale type chip, total large, due amber,
  status chip, date small. View/Collect buttons inside card.
```

---

## SCREEN 12 — Sales: New Fabricated / Raw Sale Form

```
SCREEN TO DESIGN: New Sale Form (/sales/new)

Recording a standard sale (fabricated or raw pass-through) to a customer.
Most commonly used sale form.

DESKTOP LAYOUT:
- Wide form, max-width 860px, centered
- Page title: "New Sale"

SECTION 1 — Sale Type Selection:
- 2 large radio cards side by side:
  [Fabricated Sale] — "Iron processed by workers to customer spec. Most common."
  [Raw Pass-through] — "Sold directly without processing. Full weight."
- Selected card: #0F172A border 2px, light navy tint background #0F172A08
- Unselected: #E2E8F0 border

SECTION 2 — Customer:
- Two sub-options as toggle:
  [Recorded Sale — Known Customer] [Quick Cash Sale — No Customer]
- If Recorded: Customer dropdown (search+select, shows customer + due balance)
  Below: "Customer current due: ৳50,000" in amber if applicable
- Sale Date (date picker)
- Note (optional)

SECTION 3 — Line Items (same structure as purchase form):
- Material category + sub-type + kg + price/kg + total per row
- "+ Add Item" button
- Items total: Fira Code bold bottom right

SECTION 4 — Payment:
- Same radio card pattern as purchase form
- Pay Full / Pay Partial options
- Account selector
- Summary box: Total | Receiving Now | Remaining Due | Status

STICKY BOTTOM: Cancel | "Save Sale" primary

MOBILE LAYOUT (375px):
- Sale type selection: full-width stacked cards
- Sections as full-width cards
- Sticky bottom bar
```

---

## SCREEN 13 — Sales: Quick Cash Sale Form

```
SCREEN TO DESIGN: Quick Cash Sale (/sales/new/quick)

Minimal form for small, anonymous cash sales. Owner wants to record this
in under 30 seconds. Speed is the priority.

DESKTOP LAYOUT:
- Narrow centered card, max-width 520px
- Card: #FFFFFF, 8px radius, md shadow
- Top banner: "Quick Cash Sale" in Plus Jakarta Sans 20px semibold
  Sub-text: "No customer record. Payment received in full." DM Sans 14px #64748B

FORM FIELDS (compact, dense):
- Material (category + sub-type inline, two dropdowns side by side)
- Quantity (kg input, large, prominent)
- Price per kg (৳ input)
- Total Amount (auto-calculated, Fira Code 24px bold sage green, read-only,
  shown large below the inputs)
- Receive Payment Into (account select)
- Date (date picker, default today)
- Note (optional, single line)

Below form:
- Info chip: "This sale will be recorded as PAID immediately"
- "Save Quick Sale" primary button full-width
- "Need to record a customer?" ghost link below button

MOBILE LAYOUT (375px):
- Same layout, full width
- Total amount shown extra large for quick confirmation
- Numeric keyboard auto-triggers for quantity and price inputs
```

---

## SCREEN 14 — Sales: Customer List

```
SCREEN TO DESIGN: Customer List (/sales/customers)

All customers and their outstanding balances.
Mirror structure of Vendor List (Screen 10) but for customers.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Customers" | right: "+ Add Customer" primary button

SUMMARY CARDS (3 in a row):
- Total Customers: 24
- Total Receivable (owed to us): ৳3,20,000 (sage green accent — this is money coming in)
- Settled Customers: 18

CUSTOMER TABLE:
Columns: Customer Name | Phone | Type | Total Sales | Total Received | Due Balance | Status | Actions
Rows:
Rahim Traders       | 01711-XXXXXX | Regular (navy chip)   | ৳4,20,000 | ৳4,20,000 | ৳0      | Settled (green)| View
Karim Construction  | 01812-XXXXXX | Regular (navy chip)   | ৳2,80,000 | ৳2,30,000 | ৳50,000 | Due (amber)    | View | Collect
Walk-in Customer    | —            | Walk-in (slate chip)  | ৳85,000   | ৳85,000   | ৳0      | Settled (green)| View

- Due Balance: Fira Code, amber if > 0
- "Collect" button opens record payment modal

RECORD PAYMENT MODAL:
- Title: "Collect from Karim Construction"
- "Outstanding Due: ৳50,000" sage green (this is money coming in)
- Amount, receive into account, date, note
- "Record Collection" primary button

MOBILE LAYOUT (375px):
- Card list per customer, same pattern as vendor mobile
```

---

## SCREEN 15 — Sales: Sale Detail

```
SCREEN TO DESIGN: Sale Detail (/sales/[id])

Full view of a single sale.

DESKTOP LAYOUT:
- Page title: "Sale #SAL-0090" with status chip "PARTIAL" amber, back arrow
- Sub-label: "Karim Construction • 18 May 2025 • Raw Pass-through"

TWO COLUMNS:

LEFT (60%):
CARD 1 — Sale Info:
- Customer: Karim Construction (link)
- Sale Type: Raw Pass-through (chip)
- Date: 18 May 2025
- Note: "May order — 12mm plates direct"

CARD 2 — Items Sold:
- Table: Sub-type | Qty (kg) | Price/kg | Total
  Plates 12-13mm | 1,200 kg | ৳95.00 | ৳1,14,000
- Total: ৳1,14,000

RIGHT (40%):
CARD 3 — Payment Summary:
- Total: ৳1,14,000
- Received: ৳64,000 (sage green)
- Outstanding: ৳50,000 (amber, large)
- Progress bar (same pattern as purchase detail)

CARD 4 — Payment History:
- Date | Amount | Account | Note
  18 May 2025 | ৳64,000 | Dutch Bangla Bank | Initial payment
- "Collect Payment" button at bottom

MOBILE LAYOUT (375px):
- Same pattern as purchase detail mobile
```

---

## SCREEN 16 — HR: Workers List

```
SCREEN TO DESIGN: Workers List (/hr/workers)

All workshop workers with their salary and status.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "HR & Payroll" | right: "+ Add Worker" primary button

SUB-NAVIGATION TABS:
Workers | Advances | Payroll

WORKERS TABLE:
Columns: Worker Name | Designation | Monthly Salary | Status | This Month: Advances | Actions
Rows:
Md. Rahim     | Welder   | ৳15,000 | Active (green) | ৳8,000 advances taken | View | Advance
Md. Karim     | Helper   | ৳12,000 | Active (green) | ৳0                    | View | Advance
Salim Mia     | Manager  | ৳25,000 | Active (green) | ৳5,000 advances taken | View | Advance
Jamal         | Grinder  | ৳13,000 | Active (green) | ৳0                    | View | Advance
Old Worker    | Helper   | ৳10,000 | Inactive(slate)| —                     | View

- Monthly Salary: Fira Code bold #0F172A
- Advances column: amber text if advances taken
- "Advance" button opens quick advance form modal

QUICK ADVANCE MODAL:
- Title: "Record Salary Advance"
- Worker name (read-only, pre-filled)
- Amount (৳ input)
- Pay From Account (select)
- Date (date picker, default today)
- Month/Year (auto-filled, editable)
- Note (optional)
- "Record Advance" primary button

MOBILE LAYOUT (375px):
- Cards per worker: name, designation, salary Fira Code,
  advances chip amber, View / Advance buttons
```

---

## SCREEN 17 — HR: Worker Profile

```
SCREEN TO DESIGN: Worker Profile Detail (/hr/workers/[id])

Full history for one worker — advances, salary payments, earnings.

DESKTOP LAYOUT:
- Page title: "Md. Rahim" with "Welder" chip and "Active" green chip, back arrow
- Right: "Edit Worker" ghost button | "Record Advance" primary button

TOP ROW — 4 stat cards:
1. Monthly Salary: ৳15,000 (Fira Code bold)
2. This Month Advances: ৳8,000 (amber)
3. This Month Net Payable: ৳7,000 (sage green)
4. Total Earned (all time): ৳1,80,000 (Fira Code)

TWO COLUMNS:

LEFT (55%): "Salary History"
- Table: Month/Year | Base Salary | Advances | Net Paid | Account | Status
  April 2025 | ৳15,000 | ৳5,000 | ৳10,000 | Cash | Paid (green)
  March 2025 | ৳15,000 | ৳8,000 | ৳7,000  | Cash | Paid (green)
  Feb 2025   | ৳15,000 | ৳0     | ৳15,000 | Cash | Paid (green)
- All amounts Fira Code

RIGHT (45%): "Advance History — May 2025"
- Month/year selector at top
- List of advances for selected month:
  10 May → ৳5,000 (Cash) — "Advance for rent"
  18 May → ৳3,000 (Cash) — ""
- Total advances: ৳8,000 amber bold
- Base salary: ৳15,000
- Net payable: ৳7,000 sage green bold

MOBILE LAYOUT (375px):
- Stat cards: 2x2 grid
- Salary history as card list
- Advance history below, month selector as pill tabs
```

---

## SCREEN 18 — HR: Monthly Payroll

```
SCREEN TO DESIGN: Monthly Payroll (/hr/payroll)

The payroll run screen. Owner processes end-of-month salary payments here.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Payroll" | Month/Year selector (dropdown: "May 2025")
- Sub-tabs: Workers | Advances | Payroll (Payroll tab active)

PAYROLL SUMMARY BAR:
Total Payroll: ৳75,000 | Total Advances Paid: ৳21,000 | Total Net Payable: ৳54,000 | Paid: ৳0 | Pending: ৳54,000

PAYROLL TABLE:
Columns: Worker | Designation | Base Salary | Advances (May) | Net Payable | Paid | Balance | Status | Action
Rows:
Md. Rahim  | Welder  | ৳15,000 | ৳8,000 | ৳7,000  | ৳0     | ৳7,000  | Pending (amber) | Pay Now
Md. Karim  | Helper  | ৳12,000 | ৳0     | ৳12,000 | ৳0     | ৳12,000 | Pending (amber) | Pay Now
Salim Mia  | Manager | ৳25,000 | ৳5,000 | ৳20,000 | ৳20,000| ৳0      | Paid (green)    | View
Jamal      | Grinder | ৳13,000 | ৳8,000 | ৳5,000  | ৳0     | ৳5,000  | Pending (amber) | Pay Now

- All amounts Fira Code
- Net Payable column: sage green text
- "Pay Now" button opens modal

PAY SALARY MODAL:
- Title: "Pay Salary — Md. Rahim (May 2025)"
- Net payable: ৳7,000 (large Fira Code sage green)
- Amount (pre-filled ৳7,000, editable for partial)
- Pay From Account (select)
- Payment Date (date picker)
- Note (optional)
- "Confirm Payment" primary button

MOBILE LAYOUT (375px):
- Summary bar: horizontal scroll stats
- Table becomes card list per worker
- Compact: name, net payable large, status chip, Pay button
```

---

## SCREEN 19 — Accounts: Account Overview

```
SCREEN TO DESIGN: Accounts Overview (/accounts)

All cash and bank accounts with live balances. Financial control center.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Accounts" | right: "+ Add Account" secondary button

TOP — Account Cards (horizontal row, one card per account):
Each card (white surface, soft shadow, 24px padding, 8px radius):
  Account Name: "Cash" in Plus Jakarta Sans 18px semibold
  Type chip: "CASH" or "BANK" (4px 12px, uppercase, navy fill)
  Balance: Fira Code 32px bold #0F172A (large and prominent)
  Small label: "Available Balance"
  Bottom: "View Transactions →" sage green link

Sample cards:
  Cash → ৳42,000
  Dutch Bangla Bank → ৳1,85,000
  bKash Business → ৳23,500

TOTAL BAR below cards:
- "Total Across All Accounts: ৳2,50,500" — Fira Code 24px bold, centered,
  #0F172A, full-width light strip

TRANSFER SECTION:
- Card: "Transfer Between Accounts"
- Inline form: From (select) → To (select) | Amount | Date | "Transfer" primary button

RECENT TRANSACTIONS TABLE (below):
- Title: "Recent Transactions — All Accounts"
- Columns: Date | Account | Type | Amount | Reference | Note
  19 May | Cash              | Credit (green ↑) | ৳45,600  | Sale #SAL-0091       | Rahim Traders payment
  18 May | Dutch Bangla Bank | Credit (green ↑) | ৳64,000  | Sale #SAL-0090       | Karim partial
  17 May | Cash              | Debit (red ↓)   | ৳50,000  | Purchase #PUR-0024   | Chattogram payment
  16 May | Cash              | Debit (red ↓)   | ৳5,000   | Advance — Md. Rahim  | May advance

- Credit rows: amount in #22C55E, up arrow icon
- Debit rows: amount in #EF4444, down arrow icon
- Reference: clickable sage green link

MOBILE LAYOUT (375px):
- Account cards: horizontal scrollable row (snap scroll)
- Total bar below
- Transfer form collapses behind a "Transfer" button
- Transaction list as cards below
```

---

## SCREEN 20 — Reports: Generate Report

```
SCREEN TO DESIGN: Generate Period Report (/reports/generate)

The most important feature. Owner selects a period and gets full P&L.

DESKTOP LAYOUT:

PAGE HEADER:
- Title: "Period Report" | back to reports list

TWO-STEP LAYOUT:

STEP 1 — Select Period (card, left 40%):
- "Select Report Period" Plus Jakarta Sans 18px semibold
- 3 large period option cards stacked:
  [This Month — May 2025] — selected, navy border
  [This Year — 2025]
  [Custom Date Range] — when selected, shows From/To date pickers
- "Generate Report" primary full-width button below options
- Note: "Report will be saved automatically after generation"

STEP 2 — Report Preview (right 60%, shown after generation):
Large results card with all sections:

HEADER:
- "Period Report — May 2025" Plus Jakarta Sans 24px bold
- Generated: 19 May 2025 | Status: PROFIT ✅ (large sage green chip)

SECTION A — VOLUME ANALYSIS:
Table with 2 columns (Metric | Value):
Total Purchased      | 18,400 kg
Sold (Fabricated)    | 9,200 kg
Sold (Raw)           | 4,800 kg
Scrap Sold           | 1,200 kg
Current Stock        | 2,960 kg
Burnout (Gap)        | 240 kg (1.3%) ← amber

SECTION B — INCOME:
Fabricated Sales Revenue  | ৳8,74,000
Raw Pass-through Sales    | ৳4,56,000
Scrap Sales Revenue       | ৳60,000
TOTAL INCOME              | ৳13,90,000  ← Plus Jakarta Sans bold, sage green

SECTION C — COSTS:
Raw Material Cost         | ৳11,20,000
Consumables               | ৳45,000
Worker Salaries           | ৳75,000
Other Expenses            | ৳15,000
Burnout Loss (est.)       | ৳19,200
TOTAL COST                | ৳12,74,200  ← bold

RESULT BOX (highlighted card, sage green left border):
Net Profit: ৳1,15,800 — Fira Code 32px bold sage green
Per KG: ৳6.29/kg — Fira Code 18px
STATUS: PROFIT ✅

Bottom: "Export PDF" primary button | "Save & Close" secondary button

MOBILE LAYOUT (375px):
- Period selector takes full screen as step 1
- Report shown as scrollable sections after generation
- Sticky "Export PDF" button at bottom
```

---

## SCREEN 21 — Reports: Saved Report View

```
SCREEN TO DESIGN: Saved Report View (/reports/[id])

Viewing a previously generated and saved report. Read-only.
Same layout as the right panel of Screen 20 (Generate Report),
but full-width and standalone.

DESKTOP LAYOUT:
- Page title: "Period Report — April 2025" | "Export PDF" primary button right
- Status chip "PROFIT" green (or "LOSS" red) next to title
- Generated date: DM Sans 12px #64748B

Full-width version of the report content from Screen 20:
- All sections (Volume, Income, Cost, Result) in clean card layout
- All numbers in Fira Code
- Result box prominent at top (not bottom) for quick scanning

REPORTS LIST (shown when at /reports):
- Page title: "Reports"
- "+ Generate New Report" primary button
- Table:
  Columns: Period | Type | Net Result | Status | Generated | Actions
  May 2025    | Monthly | ৳+1,15,800 | PROFIT (green chip) | 19 May 2025 | View | Export PDF
  April 2025  | Monthly | ৳+98,400   | PROFIT (green chip) | 1 May 2025  | View | Export PDF
  March 2025  | Monthly | ৳-22,000   | LOSS (red chip)     | 2 Apr 2025  | View | Export PDF
  2024 Annual | Yearly  | ৳+8,40,000 | PROFIT (green chip) | 3 Jan 2025  | View | Export PDF

- Net Result: Fira Code, green if profit, red if loss, + or - prefix

MOBILE LAYOUT (375px):
- Reports list as card stack: period, type chip, result large Fira Code
  colored by profit/loss, View/Export buttons
```

---

## SCREEN 22 — Settings: General & Team

```
SCREEN TO DESIGN: Settings (/settings and /settings/team)

Business settings and team member management.

DESKTOP LAYOUT:

LEFT SIDEBAR within settings (secondary nav, 220px):
- General
- Team Members  ← active
- Accounts (links to /accounts)
- Security

MAIN CONTENT — Team Members tab:

PAGE HEADER:
- "Team Members" | "+ Invite Member" primary button

TEAM TABLE:
Columns: Name | Email | Role | Status | Joined | Actions
Md. Rahim Uddin | rahim@company.com | Owner (navy chip)   | Active (green) | 1 Jan 2025 | —
Salim Mia       | salim@company.com | Manager (slate chip)| Active (green) | 15 Jan 2025| Edit | Deactivate
Jamal           | jamal@company.com | Worker (light chip) | Active (green) | 20 Jan 2025| Edit | Deactivate

INVITE MODAL:
- Title: "Invite Team Member"
- Full Name, Email Address
- Role (select: Manager / Worker — Owner cannot be invited, only one owner)
- "Send Invite" primary button

GENERAL SETTINGS card (shown when General tab active):
- Organization Name (editable input, save button)
- Phone, Address (editable)
- "Save Changes" primary button
- Danger Zone card (red left border): "Delete Organization" destructive button
  with confirmation text: "This will permanently delete all data."

MOBILE LAYOUT (375px):
- Secondary sidebar becomes horizontal pill tabs at top
- Team table becomes card list
- Modals become bottom sheets
```

---

## SCREEN 23 — Inventory: Consumables Log

```
SCREEN TO DESIGN: Consumables Log (/inventory/consumables)

Tracks small operational purchases: welding rods, grinding paper, etc.
Same tab nav as inventory, "Consumables" tab active.

DESKTOP LAYOUT:

TOP — 3 stat cards:
- This Month Spent: ৳12,400 (amber)
- Total Items Logged: 38
- Most Used: Welding Rod (info chip)

RIGHT SIDE — "Log Consumable" form card (300px wide, fixed right):
- Item Name (text input with suggestions: Welding Rod, Grinding Paper,
  Cutting Paper, Gas Cylinder, Other)
- Quantity + Unit (number + select: pcs / box / kg / roll)
- Unit Price (৳)
- Total (auto-calculated, Fira Code read-only)
- Vendor Name (optional)
- Pay From Account (select)
- Date (date picker)
- "+ Log Item" primary button

LEFT — Consumables Table (fills remaining width):
Columns: Date | Item | Qty | Unit Price | Total | Vendor | Account | Note
18 May | Welding Rod     | 2 box  | ৳850  | ৳1,700 | Karim Hardware  | Cash | —
17 May | Grinding Paper  | 10 pcs | ৳45   | ৳450   | Local market    | Cash | —
15 May | Gas Cylinder    | 1 pcs  | ৳3,200| ৳3,200 | Rahim Gas       | Cash | May refill
14 May | Cutting Paper   | 5 pcs  | ৳120  | ৳600   | —               | Cash | —

- Totals: Fira Code
- Monthly total footer row at bottom of table

MOBILE LAYOUT (375px):
- "Log Item" as floating + button bottom right, opens bottom sheet form
- Table as card list
```

---

*End of PROMPTS.md — YardFlow ERP — 23 Screens*
*Always attach DESIGN.md when using these prompts in Google Stitch.*
