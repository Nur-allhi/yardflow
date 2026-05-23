# Activity Log System — Implementation Plan

## Goal
Add a full audit trail that auto-records all key events across the ERP and surfaces them under Organization Settings.

---

## 1. Database — `activity_logs` table

New table in `src/lib/db/schema.ts`:

```typescript
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organization_id: uuid("organization_id").notNull().references(() => organizations.id),
  user_id: uuid("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),       // "create" | "update" | "delete" | "payment" | "transfer" | "login"
  entity_type: text("entity_type").notNull(), // "purchase", "sale", "worker", "account", etc.
  entity_id: uuid("entity_id"),
  description: text("description").notNull(),
  changes: jsonb("changes"),               // before/after diff of changed fields
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  deleted_at: timestamp("deleted_at", { withTimezone: true }),
});
```

Requires:
- `npx drizzle-kit generate`
- `npx drizzle-kit migrate`

---

## 2. Logging utility — `src/lib/activity-log.ts`

```typescript
export async function logActivity(params: {
  orgId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  changes?: Record<string, any>;
}): Promise<void>
```

Thin wrapper around `db.insert(activityLogs)`. Importable by any API route.

---

## 3. API — `GET /api/settings/logs`

Return paginated logs for the organization with:
- `page` / `limit` query params (default 50)
- `entity_type` filter
- `action` filter
- `start_date` / `end_date` filter
- `search` (matches against `description`)
- Joins `users` to include `user_name`

Response shape:
```json
{
  "logs": [{ "id", "action", "entity_type", "description", "changes", "created_at", "user_name" }],
  "total": number,
  "page": number,
  "totalPages": number
}
```

---

## 4. Page — `/settings/logs`

File: `src/app/(dashboard)/settings/logs/page.tsx`

- Breadcrumb: Dashboard → Settings → Activity Logs
- Pill nav: **General | Team Members | Activity Logs**
- Search bar + Entity type dropdown filter + Date range
- Desktop table: Timestamp | User | Action | Entity | Description
- Mobile card list
- Pagination controls
- States: loading (skeleton), empty ("No activity recorded yet"), error (retry)

---

## 5. Wire logging into API routes

Inject `logActivity()` into existing POST/PUT/DELETE handlers. This is the bulk of the work (~25 routes).

### Auth (2)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/auth/login` | `login` | "User {email} logged in" |
| `POST /api/auth/register` | `create` | "Registered organization {name}" |

### Purchases (3)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/purchases` | `create` | "Created purchase for {vendor}" |
| `POST /api/purchases/[id]/payments` | `payment` | "Recorded payment of {amount} for purchase #{id}" |
| `DELETE /api/purchases/[id]` | `delete` | "Deleted purchase #{id}" |

### Sales (3)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/sales` | `create` | "Created sale for {customer}" |
| `POST /api/sales/[id]/payments` | `payment` | "Recorded payment of {amount} for sale #{id}" |
| `DELETE /api/sales/[id]` | `delete` | "Deleted sale #{id}" |

### Inventory (6)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/inventory/categories` | `create` | "Created category {name}" |
| `PUT /api/inventory/categories/[id]` | `update` | "Updated category {name}" |
| `POST /api/inventory/subtypes` | `create` | "Created subtype {name}" |
| `PUT /api/inventory/subtypes/[id]` | `update` | "Updated subtype {name}" |
| `POST /api/inventory/consumables` | `create` | "Added consumable {name}" |
| `POST /api/inventory/consumables/use` | `update` | "Used {qty} of {consumable}" |
| `POST /api/inventory/scrap` | `create` | "Recorded {qty} kg scrap" |

### HR (4)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/hr/workers` | `create` | "Added worker {name}" |
| `POST /api/hr/advances` | `create` | "Recorded advance of {amount} for {worker}" |
| `POST /api/hr/payroll` | `create` | "Generated payroll for {month} {year}" |
| `POST /api/hr/payroll/pay` | `payment` | "Paid salaries for {month} {year}" |

### Accounts (3)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/api/accounts` | `create` | "Created account {name}" |
| `POST /api/accounts/deposit` | `create` | "Deposited {amount} to {account}" |
| `POST /api/accounts/transfer` | `transfer` | "Transferred {amount} from {from} to {to}" |

### Settings (4)
| Route | Action | Description |
|-------|--------|-------------|
| `PUT /api/settings` | `update` | "Updated organization settings" |
| `POST /api/settings/team` | `create` | "Invited {name} as {role}" |
| `PUT /api/settings/team/[id]` | `update` | "{Activated/Deactivated} {name}" |
| `DELETE /api/settings/team/[id]` | `delete` | "Removed {name} from team" |

### Reports (1)
| Route | Action | Description |
|-------|--------|-------------|
| `POST /api/reports` | `create` | "Generated {type} report" |

---

## 6. Files to create/modify

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `activityLogs` table |
| `src/lib/db/migrations/` | Auto-generated by drizzle-kit |
| `src/lib/activity-log.ts` | NEW — logging helper |
| `src/app/api/settings/logs/route.ts` | NEW — logs API |
| `src/app/(dashboard)/settings/logs/page.tsx` | NEW — logs page |
| `src/app/(dashboard)/settings/page.tsx` | Add "Activity Logs" to pill nav |
| `src/app/(dashboard)/settings/team/page.tsx` | Add "Activity Logs" to pill nav |
| ~25 API route files | Add `logActivity()` call |

---

## 7. Execution order

1. Schema + migration
2. `logActivity()` utility
3. Logs API route
4. Logs page + pill nav updates
5. Wire logging into all API routes (parallel via sub-agents)
6. TypeScript + ESLint + Build verification
7. Commit
