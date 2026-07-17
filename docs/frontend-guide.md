# MeterMate Frontend Guide

This document is the frontend handoff for the current backend. It maps the available APIs, supported features, page-level behavior, and current backend constraints so the frontend can be built in parallel.

## Product Direction

Build the MeterMate frontend as a highly crafted, interactive, mobile-first experience.

Primary goals:

- Mobile usability first, since this app will mostly be used on phones after hosting
- Excellent responsiveness on tablets and desktops as well
- Clear, fast monthly workflows for meter reading and bill tracking
- A polished UI that feels intentional rather than generic
- Smooth interaction states, good spacing, and touch-friendly controls

Design expectations:

- Prioritize one-handed mobile use
- Use strong hierarchy and readable typography
- Keep forms short, focused, and easy to complete on small screens
- Use cards, sheets, drawers, or bottom actions where they improve mobile ergonomics
- Make tables adapt gracefully on smaller screens instead of breaking layout
- Ensure desktop and tablet layouts still feel complete and professional

Application name:

- MeterMate

## Backend Snapshot

Current backend capabilities:

- Spring Boot backend on Java 21
- REST APIs for dashboard, meters, readings, and settings
- H2 local profile and PostgreSQL profile support
- Seed data on startup for one property, one main meter, and three sub meters
- Swagger/OpenAPI available
- Structured error responses

Current backend limitations:

- No property management API yet
- No authentication or authorization yet
- No pagination/filtering yet

## Base URLs

Local development:

- API base URL: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Seeded Data Assumptions

On startup, the backend seeds:

- One active property
- One `MAIN` meter named `Main Meter`
- Three `SUB` meters named `Room 1`, `Room 2`, and `Room 3`
- Default settings with rate per unit `7.5` and fixed charge `0`

Frontend implication:

- The UI can assume there is at least one property in local development, but it should not assume there will always be exactly three rooms.
- At the moment, property selection is not user-managed because property CRUD endpoints do not exist yet.

## Core Business Rules

Frontend should reflect these backend rules in form validation and messaging:

- A property can have any number of meters
- Only one `MAIN` meter is allowed per property
- Meter names must be unique within a property
- Monthly readings cannot be duplicated for the same meter, month, and year
- Current reading cannot be lower than the previous reading for that meter
- Settings must have positive `ratePerUnit` and non-negative `fixedCharge`

## Suggested Frontend Pages

### 1. Dashboard Page

Suggested route:

- `/dashboard`

Backend API:

- `GET /api/dashboard`

UI should show:

- Main meter units
- Total tenant units
- Owner units
- Total collection

Suggested components:

- Summary cards
- Small status note for the active property
- Recent reading summary or chart placeholder if you want to expand later

### 2. Meters Page

Suggested route:

- `/meters`

Backend APIs:

- `GET /api/meters`
- `GET /api/meters/{id}`
- `POST /api/meters`
- `PUT /api/meters/{id}`
- `DELETE /api/meters/{id}`

UI should show:

- List of meters with type, tenant, phone, active state
- Add meter button
- Edit meter action
- Delete meter action

Recommended form fields:

- Property ID
- Meter name
- Meter type (`MAIN` or `SUB`)
- Tenant name
- Phone

Frontend notes:

- Because property CRUD is missing, property ID can be hidden or prefilled as `1` in the current build.
- Prevent the user from trying to add a second `MAIN` meter if one already exists in the list.
- Meter names should be validated for uniqueness in the UI, but the backend still enforces the rule.

### 3. Reading Entry Page

Suggested route:

- `/readings/new`

Backend API:

- `POST /api/readings`

UI should show:

- Meter selector
- Month selector
- Year input
- Current reading input

Recommended form fields:

- Meter ID
- Month
- Year
- Current reading

Frontend notes:

- When a meter is selected, show the latest previous reading if available by querying history.
- Disable or warn when the current reading is lower than the last stored reading.
- The backend calculates units consumed and bill amount.

### 4. Reading History Page

Suggested route:

- `/readings`

Backend APIs:

- `GET /api/readings`
- `GET /api/readings/history`
- `GET /api/readings/history?meterId={id}`

UI should show:

- Table of reading records
- Filter by meter
- Sort newest first

Suggested columns:

- Meter name
- Month
- Year
- Previous reading
- Current reading
- Units consumed
- Bill amount
- Created at

### 5. Settings Page

Suggested route:

- `/settings`

Backend APIs:

- `GET /api/settings`
- `PUT /api/settings`

UI should show:

- Rate per unit
- Fixed charge

Recommended form fields:

- Rate per unit
- Fixed charge

Frontend notes:

- This page should load the current settings on mount and allow save/update in place.

## API Contracts

### Dashboard Response

`GET /api/dashboard`

Example response:

```json
{
  "mainMeterUnits": 1200,
  "tenantUnits": 950,
  "ownerUnits": 250,
  "totalCollection": 6840
}
```

### Meter DTOs

`POST /api/meters` and `PUT /api/meters/{id}` request body:

```json
{
  "propertyId": 1,
  "meterName": "Room 4",
  "meterType": "SUB",
  "tenantName": "Asha",
  "phone": "9876543210"
}
```

`GET /api/meters` and `GET /api/meters/{id}` response body:

```json
{
  "id": 1,
  "propertyId": 1,
  "meterName": "Room 1",
  "meterType": "SUB",
  "tenantName": "Asha",
  "phone": "9876543210",
  "active": true
}
```

### Reading DTOs

`POST /api/readings` request body:

```json
{
  "meterId": 1,
  "month": 7,
  "year": 2026,
  "currentReading": 2500
}
```

`POST /api/readings` response body:

```json
{
  "id": 1,
  "meterId": 1,
  "month": 7,
  "year": 2026,
  "previousReading": 2000,
  "currentReading": 2500,
  "unitsConsumed": 500,
  "billAmount": 3750,
  "createdAt": "2026-07-17T06:23:24.272081700Z"
}
```

### Settings DTOs

`GET /api/settings` and `PUT /api/settings` response body:

```json
{
  "id": 1,
  "ratePerUnit": 7.5,
  "fixedCharge": 0
}
```

`PUT /api/settings` request body:

```json
{
  "ratePerUnit": 8.5,
  "fixedCharge": 25
}
```

### Error Response

All validation and business-rule failures follow the same structure:

```json
{
  "timestamp": "2026-07-17T06:23:24.272081700Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human readable error message",
  "path": "/api/readings"
}
```

## Frontend Validation Suggestions

Mirror these checks in the UI before sending to the backend:

- Meter name required
- Meter type required
- Property ID required for now
- Month between 1 and 12
- Year required
- Current reading required and numeric
- Rate per unit required and greater than 0
- Fixed charge required and zero or greater
- Phone length should be capped at 20 characters

Important:

- Even if the frontend validates everything, the backend still enforces the rules, so keep error handling in the UI.

## Recommended API Flow Per Page

### Dashboard

1. Call `GET /api/dashboard`
2. Render summary cards

### Meters

1. Call `GET /api/meters`
2. Render table/list
3. Open create/edit form using existing meter data if editing
4. Submit to `POST /api/meters` or `PUT /api/meters/{id}`
5. Refresh list after success

### Readings

1. Call `GET /api/meters` to populate meter selector
2. Optionally call `GET /api/readings/history?meterId={id}` when a meter is selected
3. Submit new reading using `POST /api/readings`
4. Refresh history after success

### Settings

1. Call `GET /api/settings`
2. Populate form
3. Submit updates with `PUT /api/settings`

## Backend Gaps the Frontend Should Know About

These are not frontend bugs, but they affect UI design:

- No property management screens yet
- No login/auth screens yet
- No pagination, so long lists will need manual handling later
- No dedicated health endpoint was required before, though `/` now redirects to Swagger UI

## Suggested UI Priorities

If you want the frontend to match the backend most quickly, build in this order:

1. Dashboard
2. Meters list and meter form
3. Reading entry form
4. Reading history table
5. Settings page

## Handoff Summary

The backend is ready for a frontend to consume these four feature areas now:

- Dashboard summary
- Meter CRUD
- Monthly reading capture and history
- Settings management

The only major backend area not yet exposed for UI work is property management. For now, the frontend should assume one seeded property and use `propertyId = 1` until property APIs are added.

## Developer Prompt

Use this prompt when starting the frontend implementation:

```text
Build the MeterMate frontend as a polished, mobile-first, highly interactive web app.

The app name is MeterMate. It will be used mostly on mobile after hosting, so the UI must be optimized for one-handed phone usage, but it must also look and work well on tablets and desktops.

Requirements:

- Use a crafted, modern, intentional UI rather than a generic dashboard layout
- Prioritize mobile ergonomics, touch-friendly controls, short forms, and fast monthly workflows
- Ensure full responsiveness across phone, tablet, and desktop screen sizes
- Make the experience feel smooth, readable, and easy to use for monthly meter entry and bill review
- Align pages directly with the current backend APIs
- Handle backend validation and error responses gracefully in the UI

Build these pages first:

1. Dashboard
2. Meters
3. Reading Entry
4. Reading History
5. Settings

Current backend APIs:

- GET /api/dashboard
- GET /api/meters
- GET /api/meters/{id}
- POST /api/meters
- PUT /api/meters/{id}
- DELETE /api/meters/{id}
- POST /api/readings
- GET /api/readings
- GET /api/readings/history
- GET /api/readings/history?meterId={id}
- GET /api/settings
- PUT /api/settings

Current backend constraints:

- No property management APIs yet
- Assume propertyId = 1 for now
- Only one MAIN meter is allowed per property
- Reading month/year duplicates are rejected
- Current reading cannot be lower than the previous reading

Visual direction:

- Focus on excellent mobile layouts first
- Use clear spacing, strong visual hierarchy, and responsive components
- Prefer elegant cards, bottom sheets, compact forms, and adaptive tables
- Make the app feel premium, not boilerplate

Deliver a frontend that feels ready for real-world use on mobile while still looking strong on larger screens.
```