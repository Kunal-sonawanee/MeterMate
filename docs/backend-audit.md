# MeterMate Backend Audit

This document tracks the current backend progress against the project requirements.

## Current Status

The backend is in a working foundation state. Core CRUD flows, monthly reading capture, bill calculation, dashboard aggregation, validation, and local startup seeding are implemented and testable.

### Implemented

- Spring Boot 3.3.5 backend on Java 21
- JPA entities for `Property`, `Meter`, `MonthlyReading`, and `Settings`
- Repositories for all four entities
- REST APIs for meters, readings, settings, and dashboard
- Service-layer business rules for meter uniqueness, single MAIN meter, duplicate reading prevention, and reading validation
- Bill calculation through the service/util layer
- Structured error responses through a global exception handler
- Local H2 profile and PostgreSQL profile configuration
- Default seed data for one property, four meters, and settings
- Swagger/OpenAPI setup
- Basic context-load test

## Requirements Audit

### Property and Meter Model

Requirement:

- Support any number of meters per property
- Do not hardcode room count
- Use `MAIN` and `SUB` meter types

Status:

- Implemented

Evidence:

- `Property` and `Meter` entities exist
- `MeterType` enum contains `MAIN` and `SUB`
- `MeterService` enforces one MAIN meter per property

### Meter Management

Requirement:

- Create, update, list, get, and delete meters
- Prevent duplicate meter names inside a property
- Prevent deleting meters that already have readings

Status:

- Implemented

Evidence:

- `GET /api/meters`
- `GET /api/meters/{id}`
- `POST /api/meters`
- `PUT /api/meters/{id}`
- `DELETE /api/meters/{id}`

### Monthly Readings

Requirement:

- Capture monthly readings
- Prevent duplicate month/year entries for the same meter
- Calculate units consumed and bill amount

Status:

- Implemented

Evidence:

- `POST /api/readings`
- `GET /api/readings`
- `GET /api/readings/history`
- Duplicate month/year is blocked at service and database levels

### Dashboard Summary

Requirement:

- Show main meter usage
- Show tenant usage
- Show owner usage
- Show total collection

Status:

- Implemented

Evidence:

- `GET /api/dashboard`

### Settings

Requirement:

- Store rate per unit and fixed charge
- Allow updating settings

Status:

- Implemented

Evidence:

- `GET /api/settings`
- `PUT /api/settings`

### API Safety and Error Handling

Requirement:

- Use DTOs, not entities, in API responses
- Use a shared error response shape
- Use service-layer business logic

Status:

- Implemented

### Local Development and Startup

Requirement:

- App should start locally without PostgreSQL
- Use H2 in local profile
- Seed starter data automatically

Status:

- Implemented

## Remaining Backend Work

The main gaps left in the backend are product-completeness items rather than basic stability issues.

### 1. Property Management APIs

What is missing:

- No controller/service layer for creating, listing, updating, or deactivating properties

Why it matters:

- The data model supports multiple properties, but the API only exposes meter, reading, settings, and dashboard endpoints

### 2. Validation Hardening

What is missing:

- `month` in `ReadingRequest` is only validated with `@Min(1)` and not `@Max(12)` at the request level
- `year` has no explicit range check
- `phone` format is not validated beyond max length

Why it matters:

- Invalid payloads can reach deeper layers before being rejected

### 3. Broader Test Coverage

What is missing:

- Service-level tests for meter, reading, settings, and dashboard logic
- Controller/API tests for success and failure cases

Why it matters:

- Right now the test suite proves the application boots, but not that each business rule stays correct after changes

### 4. Production Readiness Extras

What is missing:

- Authentication and authorization
- Pagination/filtering for larger datasets
- Health/readiness endpoints if you want deployment monitoring beyond the root redirect

## Practical Summary

If you are testing the backend today, the highest-value flows are ready:

- Start app
- Open Swagger UI
- Read/update settings
- List and manage meters
- Save readings
- Confirm dashboard totals

The most important remaining backend gap is property management APIs. The most important quality gap is stronger automated test coverage around the service layer and request validation.