## Error Type
Runtime TypeError

## Error Message
Cannot read properties of undefined (reading 'split')


    at getInitials (src/app/(dashboard)/hr/workers/[id]/page.tsx:44:6)
    at WorkerDetailPage (src/app/(dashboard)/hr/workers/[id]/page.tsx:118:16)

## Code Frame
  42 | function getInitials(name: string) {
  43 |   return name
> 44 |     .split(" ")
     |      ^
  45 |     .map((w) => w[0])
  46 |     .join("")
  47 |     .toUpperCase()

Next.js version: 15.5.18 (Webpack)
