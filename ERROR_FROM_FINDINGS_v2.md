## Error NO: 1

## Error Type
Console Error

## Error Message
In HTML, <a> cannot be a descendant of <a>.
This will cause a hydration error.

  ...
    <LoadingBoundary loading={null}>
      <HTTPAccessFallbackBoundary notFound={undefined} forbidden={undefined} unauthorized={undefined}>
        <RedirectBoundary>
          <RedirectErrorBoundary router={{...}}>
            <InnerLayoutRouter url="/hr/workers" tree={[...]} cacheNode={{lazyData:null, ...}} segmentPath={[...]}>
              <SegmentViewNode type="page" pagePath="(dashboard...">
                <SegmentTrieNode>
                <ClientPageRoot Component={function WorkersPage} searchParams={{}} params={{}}>
                  <WorkersPage params={Promise} searchParams={Promise}>
                    <div className="p-4 md:p-8">
                      <nav>
                      <div>
                      <div>
                      <div>
                      <div>
                      <div>
                      <div className="md:hidden ...">
                        <div>
                        <LinkComponent href="/hr/worker..." className="block bg-w...">
>                         <a
>                           className="block bg-white rounded-lg p-4 shadow-sm border border-[#c6c6cd]/20"
>                           ref={function}
>                           onClick={function onClick}
>                           onMouseEnter={function onMouseEnter}
>                           onTouchStart={function onTouchStart}
>                           href="/hr/workers/a401bffc-412c-4449-adc5-e2a9dd32a184"
>                         >
                            <div>
                            <div>
                            <div className="flex gap-2...">
                              <LinkComponent href="/hr/worker..." className="flex-1 py-...">
>                               <a
>                                 className="flex-1 py-2 text-[#059669] font-bold text-sm bg-[#059669]/5 rounded-lg te..."
>                                 ref={function}
>                                 onClick={function onClick}
>                                 onMouseEnter={function onMouseEnter}
>                                 onTouchStart={function onTouchStart}
>                                 href="/hr/workers/a401bffc-412c-4449-adc5-e2a9dd32a184"
>                               >
                              ...
                        ...
              ...
            ...



    at a (<anonymous>:null:null)
    at eval (src/app/(dashboard)/hr/workers/page.tsx:358:17)
    at Array.map (<anonymous>:null:null)
    at WorkersPage (src/app/(dashboard)/hr/workers/page.tsx:319:21)

## Code Frame
  356 |               </div>
  357 |               <div className="flex gap-2 mt-3 pt-3 border-t border-[#c6c6cd]/30">
> 358 |                 <Link
      |                 ^
  359 |                   href={`/hr/workers/${w.id}`}
  360 |                   className="flex-1 py-2 text-[#059669] font-bold text-sm bg-[#059669]/5 rounded-lg text-center"
  361 |                 >

Next.js version: 15.5.18 (Webpack)


## Error NO: 2
## Error NO: 3

## Error NO: 4
## Error NO: 5
## Error NO: 6
## Error NO: 7
## Error NO: 8
## Error NO: 9
## Error NO: 10
## Error NO: 11
## Error NO: 12
