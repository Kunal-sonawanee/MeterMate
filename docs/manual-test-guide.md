# MeterMate Manual Test Guide

This guide helps you manually verify the current backend features in the workspace.

## Scope

Current project state:

- Spring Boot backend is implemented
- REST APIs exist for meters, readings, settings, and dashboard
- Default seed data is created on startup
- No frontend app is present yet

## Before You Start

Run the backend from the `backend/` folder:

```powershell
mvn spring-boot:run
```

Expected local defaults:

- App URL: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- H2 console: `http://localhost:8080/h2-console`

Local profile details:

- Database: in-memory H2
- JDBC URL: `jdbc:h2:mem:metermate;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE`
- Username: `sa`
- Password: empty

## Seeded Data

On startup, the app seeds:

- One active property called `Default Property`
- One main meter called `Main Meter`
- Three sub meters called `Room 1`, `Room 2`, and `Room 3`
- Default settings with rate per unit `7.5` and fixed charge `0`

## Current API Surface

### Dashboard

- `GET /api/dashboard`

### Meters

- `GET /api/meters`
- `GET /api/meters/{id}`
- `POST /api/meters`
- `PUT /api/meters/{id}`
- `DELETE /api/meters/{id}`

### Readings

- `POST /api/readings`
- `GET /api/readings`
- `GET /api/readings/history`
- `GET /api/readings/history?meterId={id}`

### Settings

- `GET /api/settings`
- `PUT /api/settings`

## Request Shapes

### Create or Update Meter

```json
{
  "propertyId": 1,
  "meterName": "Room 4",
  "meterType": "SUB",
  "tenantName": "New Tenant",
  "phone": "9999999999"
}
```

Valid `meterType` values:

- `MAIN`
- `SUB`

### Save Monthly Reading

```json
{
  "meterId": 1,
  "month": 7,
  "year": 2026,
  "currentReading": 2500
}
```

### Update Settings

```json
{
  "ratePerUnit": 8.0,
  "fixedCharge": 50
}
```

## Expected Response Shapes

### Error Response

When validation or business rules fail, the API returns:

```json
{
  "timestamp": "2026-07-17T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human readable error message",
  "path": "/api/..."
}
```

## Manual Test Scenarios

### 1. App Starts Cleanly

Check:

- Application starts without errors
- Swagger UI opens
- H2 console opens

Expected:

- Backend is reachable on port `8080`
- Default seed data is created in the local database

### 2. View Dashboard

Call:

- `GET /api/dashboard`

Expected:

- Response status `200`
- JSON contains `mainMeterUnits`, `tenantUnits`, `ownerUnits`, and `totalCollection`

### 3. List Meters

Call:

- `GET /api/meters`

Expected:

- Response status `200`
- At least the seeded meters are returned
- Each meter includes `id`, `propertyId`, `meterName`, `meterType`, `tenantName`, `phone`, and `active`

### 4. Get One Meter

Call:

- `GET /api/meters/{id}`

Use one ID from the `GET /api/meters` response.

Expected:

- Response status `200`
- Meter details match the selected record

### 5. Create a New Sub Meter

Call:

- `POST /api/meters`

Sample payload:

```json
{
  "propertyId": 1,
  "meterName": "Room 4",
  "meterType": "SUB",
  "tenantName": "Asha",
  "phone": "9876543210"
}
```

Expected:

- Response status `201`
- `Location` header points to the new meter
- Response body contains the created meter

Note:

- In a fresh database, `propertyId` is typically `1` because the app seeds one property on startup.

### 6. Reject Duplicate Meter Name

Call:

- `POST /api/meters`

Use a meter name that already exists for the same property.

Expected:

- Response status `400`
- Error message says the meter name already exists for the property

### 7. Reject Second Main Meter

Call:

- `POST /api/meters`

Use payload with `meterType: "MAIN"` for the same property.

Expected:

- Response status `400`
- Error message says only one MAIN meter is allowed per property

### 8. Update a Meter

Call:

- `PUT /api/meters/{id}`

Sample payload:

```json
{
  "propertyId": 1,
  "meterName": "Room 4 Updated",
  "meterType": "SUB",
  "tenantName": "Asha R",
  "phone": "9123456780"
}
```

Expected:

- Response status `200`
- Returned meter reflects the updated values

### 9. Delete a Meter Without Readings

Call:

- `DELETE /api/meters/{id}`

Expected:

- Response status `204`
- Meter no longer appears in `GET /api/meters`

### 10. Prevent Deleting a Meter With Readings

Steps:

1. Create a new meter or use an existing one without readings.
2. Save one monthly reading for it.
3. Call `DELETE /api/meters/{id}`.

Expected:

- Response status `400`
- Error message says the meter cannot be deleted because it has existing readings

### 11. Get Settings

Call:

- `GET /api/settings`

Expected:

- Response status `200`
- Response includes `id`, `ratePerUnit`, and `fixedCharge`

### 12. Update Settings

Call:

- `PUT /api/settings`

Sample payload:

```json
{
  "ratePerUnit": 8.5,
  "fixedCharge": 25
}
```

Expected:

- Response status `200`
- Settings are updated and returned

### 13. Save Monthly Reading

Call:

- `POST /api/readings`

Sample payload:

```json
{
  "meterId": 1,
  "month": 7,
  "year": 2026,
  "currentReading": 2500
}
```

Expected:

- Response status `200`
- Response includes `previousReading`, `currentReading`, `unitsConsumed`, `billAmount`, and `createdAt`

### 14. Reject Duplicate Reading for Same Month

Call:

- `POST /api/readings`

Use the same `meterId`, `month`, and `year` as an existing reading.

Expected:

- Response status `400`
- Error message says a duplicate monthly reading exists

### 15. Reject Lower Current Reading

Call:

- `POST /api/readings`

Use a `currentReading` lower than the previous stored reading for that meter.

Expected:

- Response status `400`
- Error message says the current reading cannot be smaller than the previous reading

### 16. View Reading History

Call:

- `GET /api/readings`
- `GET /api/readings/history`
- `GET /api/readings/history?meterId={id}`

Expected:

- Response status `200`
- Results are sorted by newest first
- `meterId` filter returns only readings for that meter

## Quick Validation Checklist

- Backend starts successfully
- Swagger UI loads
- Seeded meters exist
- Settings can be read and updated
- A new meter can be created
- Duplicate meter names are rejected
- Only one MAIN meter is allowed per property
- Monthly readings can be saved
- Duplicate readings are rejected
- Lower readings are rejected
- Dashboard returns a summary

## Notes

- There is no authentication yet, so all endpoints are open in local development.
- The project currently focuses on backend behavior; there is no frontend UI to test in this workspace yet.