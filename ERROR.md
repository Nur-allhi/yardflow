## Error Type
Runtime TypeError

## Error Message
Cannot read properties of undefined (reading 'totalPages')


    at ConsumablesPage (src/app/(dashboard)/inventory/consumables/page.tsx:606:34)

## Code Frame
  604 |
  605 |         {/* Mobile Pagination */}
> 606 |         {data && data.pagination.totalPages > 1 && (
      |                                  ^
  607 |           <div className="flex justify-center gap-4 mt-6">
  608 |             <button
  609 |               disabled={page <= 1}

Next.js version: 15.5.18 (Webpack)


