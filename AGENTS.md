# CRITICAL RULES - MUST FOLLOW

## RESPONSES

- Keep responses concise and to the point — unless the user asks otherwise
- Never explain what you are about to do, just do it
- When referencing business logic or schema, always check `CONTEXT.md` first

---

## PLANNING MODE

- Always ask clarifying questions before starting any feature
- Never assume design, tech stack, or business rules — this is a real business app
- Use deep-dive sub-agents to research unfamiliar patterns before presenting a plan
- Use deep-dive sub-agents to review different aspects of your plan before presenting to the user
- Reference `CONTEXT.md` for all business rules, module specs, and schema decisions

---

## CHANGE / EDIT MODE

- Never implement features yourself when possible — use sub-agents!
- Identify changes that can be implemented in parallel and assign to sub-agents
- When using sub-agents to implement features, act as a coordinator only
- Use premium models for complex tasks (coding, schema, calculations) and mid-tier for simpler tasks (documentation, comments)
- After completing any feature (large or small), always run the following checks:

```bash
npx tsc --noEmit        # TypeScript — zero errors required
npx eslint .            # Lint — zero errors required
npx next build          # Build — must succeed before task is considered done
```
- Update session log.
- commit the changes.

---

## MULTI-TENANCY — NEVER VIOLATE

- Every database query MUST filter by `organization_id`
- `organization_id` is read from the **server-side session cookie only** — never from the client request body, params, or query string
- A query that returns data without an `organization_id` filter is a **critical security bug** — fix immediately
- Every SELECT query must also filter `deleted_at IS NULL` (soft delete)

---

## DATABASE SCHEMA CHANGES

- Whenever you make changes to the database schema in `schema.ts`, ALWAYS run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

- **NEVER run `drizzle push`**
- Never manually edit files inside `src/lib/db/migrations/`
- Never delete or rename existing columns in production — add new columns instead

---

## TRANSACTIONS

- Any operation that writes to more than one table MUST use `db.transaction()`
- If one write fails, all writes must roll back — no partial data allowed
- This applies to: new purchases, new sales, payments, salary advances, salary payments, account transfers

---

## BUSINESS LOGIC

- Never invent business logic — all rules are defined in `CONTEXT.md` Section 7
- Burnout is **never** calculated per order — period-end reconciliation only
- Scrap is **never** tracked per order — it accumulates in the scrap pool
- WAC (Weighted Average Cost) must recalculate on every new purchase for that subtype
- `net_payable` for salary can be negative if advances exceed base salary — handle this in UI with a warning, never crash

---

## TESTING

- Use any testing tools or scripts available in the project to verify your changes
- Never assume your changes simply work — always test
- For each completed feature, manually walk through the full workflow (create → read → update → pay/delete)
- If no testing tools are available, ask the user whether testing should be skipped

---

## UI DESIGN

- Always follow the design system when creating or reviewing components and pages
- Design System: `@DESIGN.md`
- Status badge colors: green = paid/profit · amber = partial/pending · red = due/loss · gray = inactive
- Money format: `1,25,000 tk` (Bengali lakh format, tk suffix)
- Weight format: `1,250.500 kg` (3 decimal places, kg suffix)
- Every page must handle 3 states: **loading**, **empty**, and **error**
