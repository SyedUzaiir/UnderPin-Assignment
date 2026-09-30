# Bug Report

## Bug 1: 1-Based Pagination Offset Error
- **Location**: `src/services/taskService.js`, `getPaginated` function
- **Expected behavior**: `getPaginated(1, 10)` should return the first page of results (indices 0 through 9).
- **Actual behavior**: Calculated `offset = page * limit`, giving an offset of 10 for page 1 and skipping the first 10 items.
- **Root cause**: The offset formula did not subtract 1 from the 1-based `page` parameter.
- **How it was discovered**: Discovered when writing unit tests for `getPaginated` and integration tests for `GET /tasks?page=1&limit=2`.
- **Resolution**: Changed offset calculation to `const offset = (page - 1) * limit;`.
- **Fixed or not fixed**: Fixed

## Bug 2: Priority Overwritten on Task Completion
- **Location**: `src/services/taskService.js`, `completeTask` function
- **Expected behavior**: Marking a task as completed should set `status` to `done` and record `completedAt` while preserving the existing priority.
- **Actual behavior**: `completeTask` hardcoded `priority: 'medium'`, resetting high or low priority tasks to medium.
- **Root cause**: Explicit `priority: 'medium'` property in `completeTask`.
- **How it was discovered**: Inspected `taskService.js` and confirmed with unit tests.
- **Resolution**: Removed `priority: 'medium'` from `completeTask` so task priority remains untouched.
- **Fixed or not fixed**: Fixed

## Bug 3: Substring Matching in Status Filter
- **Location**: `src/services/taskService.js`, `getByStatus` function
- **Expected behavior**: Filtering by status should only match tasks with that exact status.
- **Actual behavior**: Used `t.status.includes(status)`. A search for `status=do` returns tasks with status `todo` and `done`.
- **Root cause**: String `.includes()` was used instead of exact equality (`===`).
- **How it was discovered**: Inspected `taskService.js`.
- **Resolution**: Replace `includes` with strict equality check `t.status === status`.
- **Fixed or not fixed**: Not fixed

## Bug 4: Pagination Parameters Ignored When Status Filter Provided
- **Location**: `src/routes/tasks.js`, `GET /tasks` route handler
- **Expected behavior**: Passing both status and pagination params (`GET /tasks?status=todo&page=1&limit=5`) should return paginated tasks matching the status.
- **Actual behavior**: The route returns early inside `if (status)` without checking `page` or `limit`.
- **Root cause**: Unchained `if` branches in the route handler.
- **How it was discovered**: Inspected `src/routes/tasks.js`.
- **Resolution**: Chain query processing so status filter runs before applying offset and limit.
- **Fixed or not fixed**: Not fixed
