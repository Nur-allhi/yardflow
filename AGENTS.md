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
- **UX DESIGNS**: Before building any UI page, check `designs/` folder for the matching design (look for `{page_name}_desktop/` and `{page_name}_mobile/` directories, read `code.html` and `screen.png` for reference)
- Status badge colors: green = paid/profit · amber = partial/pending · red = due/loss · gray = inactive
- Money format: `1,25,000 tk` (Bengali lakh format, tk suffix)
- Weight format: `1,250.500 kg` (3 decimal places, kg suffix)
- Every page must handle 3 states: **loading**, **empty**, and **error**

---

## REMAINING WORK — IMPLEMENTATION PLAN

All remaining work is defined in `Fixes_implementation.md`. The plan covers **36 fix items** organized by priority:

| Priority | Count |
|----------|-------|
| P0 — CRASHES | 6 |
| P1 — FUNCTIONALITY BUGS | 7 |
| P2 — MISSING UI & NAVIGATION | 10 |
| P3 — UI POLISH | 13 |

Execute in P0 → P1 → P2 → P3 order. Items at the same priority can be parallelized.

---

## AUTONOMOUS WORKFLOW

The agent works **autonomously, fix by fix** without being asked for each step.

### Per-Fix Process

1. **Read `Fixes_implementation.md`** to get the current priority's task list
2. **Read all files listed** for the fix before making changes
3. **Implement each fix** using sub-agents for parallel work where possible
4. **After each fix** (not after the entire priority), run:
   ```bash
   npx tsc --noEmit        # TypeScript — zero errors required
   npx eslint .            # Lint — zero errors required
   npx next build          # Build — must succeed
   ```
5. **After each fix**, commit the changes with a descriptive message:
   ```bash
   git add -A && git commit -m "[P# - fix #] description"
   ```
6. **Update the session log** after each commit
7. **When a priority level is complete**, update `Fixes_implementation.md` by marking completed items with `[x]`
8. **Proceed to the next priority** automatically — do not wait for confirmation
9. **If blocked** (e.g., missing dependency, unexpected error), fix the blocker and continue. If unable to resolve, stop and report to user.

### Key Rules

- Never ask the user for permission to proceed between fixes — work autonomously
- Each commit should represent one complete, tested fix
- If a fix is too large, break it into sub-tasks and commit each one
- `Fixes_implementation.md` is the source of truth for what's left — keep it updated
- After all 4 priority levels are done, run the full test suite once more and report completion

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **yardflow** (1911 symbols, 2747 relationships, 70 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/yardflow/context` | Codebase overview, check index freshness |
| `gitnexus://repo/yardflow/clusters` | All functional areas |
| `gitnexus://repo/yardflow/processes` | All execution flows |
| `gitnexus://repo/yardflow/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
