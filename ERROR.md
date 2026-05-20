## FIXED - 2026-05-20

### Bug 5: Payroll page crash — `Cannot read properties of undefined (reading 'length')`
- **Root cause**: API returns `{ workers: [...] }` but client expected `{ rows: [...] }` (`PayrollData.rows` is undefined, `.length` crashes)
- **Fix**: Changed `PayrollData.rows` → `PayrollData.workers` to match API response shape
