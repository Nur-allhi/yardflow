## Error No: 1

## Error Type
Console Error

## Error Message
Encountered two children with the same key, `2`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version.


    at div (<anonymous>:null:null)
    at eval (src/app/(dashboard)/purchases/new/page.tsx:351:23)
    at Array.map (<anonymous>:null:null)
    at NewPurchasePage (src/app/(dashboard)/purchases/new/page.tsx:350:36)

## Code Frame
  349 |                   <div className="space-y-3">
  350 |                     {otherExpenses.map((exp) => (
> 351 |                       <div
      |                       ^
  352 |                         key={exp.key}
  353 |                         className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-[#c6c6cd]/50 rounded-lg bg-[#f2f4f6]/30"
  354 |                       >

Next.js version: 15.5.18 (Webpack)


## Error No: 2