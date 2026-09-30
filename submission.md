# Submission Documentation

## Overview
This task manager API solution includes a Jest + Supertest test suite, bug identification and resolution, and a new `PATCH /tasks/:id/assign` endpoint with full input validation.

## Testing
The test suite consists of unit tests for validators and service logic, as well as integration tests for every Express endpoint using Supertest.

- **Total Test Suites**: 3 (`validators.test.js`, `taskService.test.js`, `routes.test.js`)
- **Total Test Cases**: 77 (All 77 passing)
- **Coverage Statistics**:
  - Statements: **97.51%**
  - Branches: **96.7%**
  - Functions: **93.33%**
  - Lines: **97.27%**

Tests cover happy path execution, invalid inputs (missing title, non-string parameters, invalid enum statuses/priorities, malformed date strings, empty/whitespace strings), non-existent task IDs (404 checks), and boundary conditions.

## Bug Fix
Primary bug fixed:
- **Pagination Offset Error in `taskService.getPaginated`**:
  `getPaginated(1, 10)` calculated an offset of `1 * 10 = 10`, skipping the first 10 tasks when fetching page 1. Fixed by adjusting the formula to `(page - 1) * limit`.

Secondary bug fixed:
- **Task Priority Overwrite on Completion**:
  `completeTask` unconditionally reset `priority` to `'medium'`. Fixed by removing the hardcoded priority mutation so the original task priority is preserved upon completion.

## New Feature
Implemented `PATCH /tasks/:id/assign` to assign a task to a user.

- **Request Body**: `{ "assignee": "string" }`
- **Validation Rules**:
  - `assignee` is required.
  - `assignee` must be a string.
  - Empty strings or whitespace-only strings are rejected with status 400 (`assignee must be a non-empty string`).
  - Leading and trailing whitespace is automatically trimmed before storing.
- **Task Not Found**: Returns status 404 with `{ "error": "Task not found" }` if the task ID does not exist.
- **Reassignment Decision**: Reassigning an already assigned task is supported. Subsequent valid `PATCH /tasks/:id/assign` calls overwrite the current assignee string with the new assignee name.

## What I Would Test Next
1. **Concurrent Request Handling**: Race conditions when multiple PATCH requests complete or assign the same task simultaneously.
2. **Extreme Payload Boundaries**: Very large payloads, nested non-primitive values, or special character handling in title and assignee.
3. **Combined Filter & Pagination Queries**: Testing combinations of status filtering and page offset/limit simultaneously once route logic is refactored.

## What Surprised Me
1. **Status Enum Discrepancy**: The README listed statuses as `pending | in-progress | completed`, while `validators.js` and `taskService.js` enforced `todo | in_progress | done`.
2. **Substring Matching in Status Filter**: `getByStatus` used `.includes()`, meaning querying for status `do` returned both `todo` and `done` tasks.
3. **Priority Reset**: Completing a task explicitly overwrote its priority to `medium`.

## Questions Before Production
1. **Persistence & Data Safety**: Since the store is currently in-memory, what database engine (PostgreSQL, MongoDB) should be integrated, and what migration strategy should be used?
2. **Auth & Ownership**: Should assignment and status updates be restricted to authenticated users or specific task owners?
3. **Status Enum Standard**: Should status names adhere to `todo/in_progress/done` or `pending/in-progress/completed` as described in external client documentation?
4. **Rate Limiting & Input Sanitization**: What rate limits and HTML/XSS sanitization policies should be applied to title, description, and assignee text fields?
