## FIXED - 2026-05-20

### Bug: Sales API 500 Error on GET /api/sales

**Root cause 1**: Raw SQL field `total_kg` in subquery missing `.as('alias')` — drizzle-orm requires explicit alias on raw SQL fields referenced from outer queries.

**Root cause 2**: `Date` object passed into `sql` template literal — drizzle-orm throws `TypeError: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date`. Fixed by calling `.toISOString()` and using the string directly.

**Root cause 3**: GET handler lacked try-catch — any error (auth, DB, query) resulted in generic 500 with empty body instead of JSON error.

### Files changed
- `src/app/api/sales/route.ts`
  1. Added `.as('total_kg')` to `sql<number>`COALESCE(...)` in weightSubquery
  2. Changed `firstOfMonth` (Date) → `firstOfMonthStr` (ISO string from `.toISOString()`)
  3. Wrapped entire handler in try-catch — returns `{error: "Failed to fetch sales"}` with status 500
<button>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:323
SalesPage @ page.tsx:481
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooksAgain @ react-dom-client.development.js:6893
renderWithHooks @ react-dom-client.development.js:6805
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10858
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopSync @ react-dom-client.development.js:15547
renderRootSync @ react-dom-client.development.js:15527
performWorkOnRoot @ react-dom-client.development.js:14991
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
<SalesPage>
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
eval @ link.js:82
exports.startTransition @ react.development.js:1150
linkClicked @ link.js:81
onClick @ link.js:316
executeDispatch @ react-dom-client.development.js:16971
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:17021
eval @ react-dom-client.development.js:17622
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17175
dispatchEvent @ react-dom-client.development.js:21358
dispatchDiscreteEvent @ react-dom-client.development.js:21326
<a>
exports.jsx @ react-jsx-runtime.development.js:323
LinkComponent @ link.js:366
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooksAgain @ react-dom-client.development.js:6893
renderWithHooks @ react-dom-client.development.js:6805
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10858
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopConcurrentByScheduler @ react-dom-client.development.js:15721
renderRootConcurrent @ react-dom-client.development.js:15696
performWorkOnRoot @ react-dom-client.development.js:14990
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
<LinkComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:323
ScrapSalePage @ page.tsx:118
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooksAgain @ react-dom-client.development.js:6893
renderWithHooks @ react-dom-client.development.js:6805
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10858
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopConcurrentByScheduler @ react-dom-client.development.js:15721
renderRootConcurrent @ react-dom-client.development.js:15696
performWorkOnRoot @ react-dom-client.development.js:14990
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
<ScrapSalePage>
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
Function.all @ VM5577 <anonymous>:1
Function.all @ VM5577 <anonymous>:1
Function.all @ VM5577 <anonymous>:1
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
eval @ link.js:82
exports.startTransition @ react.development.js:1150
linkClicked @ link.js:81
onClick @ link.js:316
executeDispatch @ react-dom-client.development.js:16971
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:17021
eval @ react-dom-client.development.js:17622
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17175
dispatchEvent @ react-dom-client.development.js:21358
dispatchDiscreteEvent @ react-dom-client.development.js:21326
<a>
exports.jsx @ react-jsx-runtime.development.js:323
LinkComponent @ link.js:366
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooksAgain @ react-dom-client.development.js:6893
renderWithHooks @ react-dom-client.development.js:6805
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10858
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopSync @ react-dom-client.development.js:15547
renderRootSync @ react-dom-client.development.js:15527
performWorkOnRoot @ react-dom-client.development.js:14991
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
<LinkComponent>
exports.jsxDEV @ react-jsx-dev-runtime.development.js:323
ScrapPoolPage @ page.tsx:480
react_stack_bottom_frame @ react-dom-client.development.js:23584
renderWithHooksAgain @ react-dom-client.development.js:6893
renderWithHooks @ react-dom-client.development.js:6805
updateFunctionComponent @ react-dom-client.development.js:9247
beginWork @ react-dom-client.development.js:10858
runWithFiberInDEV @ react-dom-client.development.js:872
performUnitOfWork @ react-dom-client.development.js:15727
workLoopSync @ react-dom-client.development.js:15547
renderRootSync @ react-dom-client.development.js:15527
performWorkOnRoot @ react-dom-client.development.js:14991
performWorkOnRootViaSchedulerTask @ react-dom-client.development.js:16816
performWorkUntilDeadline @ scheduler.development.js:45
<ScrapPoolPage>
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
Function.all @ VM5577 <anonymous>:1
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
eval @ link.js:82
exports.startTransition @ react.development.js:1150
linkClicked @ link.js:81
onClick @ link.js:316
executeDispatch @ react-dom-client.development.js:16971
runWithFiberInDEV @ react-dom-client.development.js:872
processDispatchQueue @ react-dom-client.development.js:17021
eval @ react-dom-client.development.js:17622
batchedUpdates$1 @ react-dom-client.development.js:3312
dispatchEventForPluginEventSystem @ react-dom-client.development.js:17175
dispatchEvent @ react-dom-client.development.js:21358
dispatchDiscreteEvent @ react-dom-client.development.js:21326
