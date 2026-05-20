## Error NO: 01

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


## Error NO: 02

page.tsx:152  POST http://localhost:3000/api/sales 400 (Bad Request)
handleSubmit @ page.tsx:152
executeDispatch @ react-dom-client.development.js:16971
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:17021
eval @ react-dom-client.development.js:17622
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17175
dispatchEvent @ react-dom-client.development.js:21358
dispatchDiscreteEvent @ react-dom-client.development.js:21326


## Error NO: 03

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



## Error NO: 04

## Error Type
Runtime TypeError

## Error Message
Cannot read properties of undefined (reading 'split')


    at getInitials (src/app/(dashboard)/hr/workers/[id]/page.tsx:43:6)
    at WorkerDetailPage (src/app/(dashboard)/hr/workers/[id]/page.tsx:126:16)

## Code Frame
  41 | function getInitials(name: string) {
  42 |   return name
> 43 |     .split(" ")
     |      ^
  44 |     .map((w) => w[0])
  45 |     .join("")
  46 |     .toUpperCase()

Next.js version: 15.5.18 (Webpack)




## Error NO: 05

hot-reloader-app.js:197 [Fast Refresh] rebuilding
report-hmr-latency.js:14 [Fast Refresh] done in 1116ms
content.js:236 Is Medium site: false
hot-reloader-app.js:197 [Fast Refresh] rebuilding
report-hmr-latency.js:14 [Fast Refresh] done in 357ms
content.js:236 Is Medium site: false
page.tsx:43 Uncaught TypeError: Cannot read properties of undefined (reading 'split')
    at getInitials (page.tsx:43:6)
    at WorkerDetailPage (page.tsx:126:16)
    at Object.react_stack_bottom_frame (react-dom-client.development.js:23584:20)
    at renderWithHooks (react-dom-client.development.js:6793:22)
    at updateFunctionComponent (react-dom-client.development.js:9247:19)
    at beginWork (react-dom-client.development.js:10858:18)
    at runWithFiberInDEV (react-dom-client.development.js:872:30)
    at performUnitOfWork (react-dom-client.development.js:15727:22)
    at workLoopSync (react-dom-client.development.js:15547:41)
    at renderRootSync (react-dom-client.development.js:15527:11)
    at performWorkOnRoot (react-dom-client.development.js:15034:44)
    at performWorkOnRootViaSchedulerTask (react-dom-client.development.js:16816:7)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:45:48)
getInitials @ page.tsx:43
WorkerDetailPage @ page.tsx:126
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooks @ react-dom-client.development.js:6793
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10858
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopSync @ react-dom-client.development.js:15547
renderRootSync @ react-dom-client.development.js:15527
performWorkOnRoot @ react-dom-client.development.js:15034
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
<WorkerDetailPage>
exports.jsx @ react-jsx-runtime.development.js:323
ClientPageRoot @ client-page.js:20
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooksAgain @ react-dom-client.development.js:6893
renderWithHooks @ react-dom-client.development.js:6805
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10807
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopConcurrentByScheduler @ react-dom-client.development.js:15721
renderRootConcurrent @ react-dom-client.development.js:15696
performWorkOnRoot @ react-dom-client.development.js:14990
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
"use client"
Function.all @ VM7466 <anonymous>:1
Function.all @ VM7466 <anonymous>:1
initializeElement @ react-server-dom-webpack-client.browser.development.js:1376
"use server"
ResponseInstance @ react-server-dom-webpack-client.browser.development.js:2091
createResponseFromOptions @ react-server-dom-webpack-client.browser.development.js:3155
exports.createFromReadableStream @ react-server-dom-webpack-client.browser.development.js:3540
createFromNextReadableStream @ fetch-server-response.js:209
fetchServerResponse @ fetch-server-response.js:116
await in fetchServerResponse
eval @ prefetch-cache-utils.js:197
task @ promise-queue.js:30
processNext @ promise-queue.js:81
enqueue @ promise-queue.js:45
createLazyPrefetchEntry @ prefetch-cache-utils.js:197
getOrCreatePrefetchCacheEntry @ prefetch-cache-utils.js:144
navigateReducer @ navigate-reducer.js:166
clientReducer @ router-reducer.js:25
action @ app-router-instance.js:156
runAction @ app-router-instance.js:66
dispatchAction @ app-router-instance.js:120
dispatch @ app-router-instance.js:154
eval @ use-action-queue.js:55
startTransition @ react-dom-client.development.js:7968
dispatch @ use-action-queue.js:54
dispatchAppRouterAction @ use-action-queue.js:37
dispatchNavigateAction @ app-router-instance.js:207
eval @ app-router-instance.js:260
exports.startTransition @ react.development.js:1150
push @ app-router-instance.js:258
handleSubmit @ page.tsx:122
await in handleSubmit
executeDispatch @ react-dom-client.development.js:16971
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:17021
eval @ react-dom-client.development.js:17622
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17175
dispatchEvent @ react-dom-client.development.js:21358
dispatchDiscreteEvent @ react-dom-client.development.js:21326




## Error NO: 06

## Error Type
Runtime TypeError

## Error Message
Cannot read properties of undefined (reading 'split')


    at getInitials (src/app/(dashboard)/hr/payroll/page.tsx:38:6)
    at eval (src/app/(dashboard)/hr/payroll/page.tsx:357:26)
    at Array.map (<anonymous>:null:null)
    at PayrollPage (src/app/(dashboard)/hr/payroll/page.tsx:349:32)

## Code Frame
  36 | function getInitials(name: string) {
  37 |   return name
> 38 |     .split(" ")
     |      ^
  39 |     .map((w) => w[0])
  40 |     .join("")
  41 |     .toUpperCase()

Next.js version: 15.5.18 (Webpack)



## Error NO: 07

## Error NO: 08
## Error NO: 09
## Error NO: 10
## Error NO: 11
