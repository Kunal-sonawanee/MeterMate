# MeterMate - Development Plan

## Project Overview

MeterMate is a Progressive Web Application (PWA) that helps landlords manage electricity meter readings for rented rooms.

Current use case:

- 3 rented rooms (each has one sub meter)
- 1 main meter for the entire property
- Every month, the landlord records current readings
- The system automatically calculates:
  - Units consumed
  - Electricity bill
  - Monthly history
  - Dashboard summary

The application should eliminate manual calculations and notebook-based record keeping.

---

# Primary Goal

Build a clean, production-quality full-stack application using Java Spring Boot and React.

The application should be:

- Mobile-first
- Easy to use every month
- Secure
- Easily extendable
- Fully free to host

---

# Tech Stack

## Backend

- Java 21
- Spring Boot 3
- Spring Data JPA
- PostgreSQL
- Maven Wrapper

## Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- PWA support

## Database

PostgreSQL

Development:
Local PostgreSQL

Production:
Supabase PostgreSQL

## Deployment

Frontend
- Vercel

Backend
- Render

Database
- Supabase

---

# Important Development Rules

## NEVER hardcode

The application should NOT assume there are only 3 rooms.

Instead design the system like:

Property

↓

Meters

↓

Monthly Readings

A property can have any number of meters.

Each meter has a type:

- MAIN
- SUB

Current property contains:

Room 1
Room 2
Room 3
Main Meter

Tomorrow another room may be added without changing code.

---

## Keep business logic inside Service layer

Controllers should only:

- Validate request
- Call Service
- Return response

Never calculate bills inside controllers.

---

## Never use System.out.println()

Use SLF4J logging.

---

## Use DTOs

Never expose entities directly from REST APIs.

---

## Follow layered architecture

controller

↓

service

↓

repository

↓

database

---

# Folder Structure

backend/

src/main/java/com/metermate

config/

controller/

dto/

entity/

exception/

mapper/

repository/

service/

util/

frontend/

docs/

---

# Database Design

## Entity: Property

Fields

- id
- name
- address
- active

Initially there will be only one property.

Still create the entity because future versions may support multiple buildings.

---

## Entity: Meter

Fields

- id
- property
- meterName
- meterType

meterType

- MAIN
- SUB

tenantName

phone

active

Examples

Room 1

Room 2

Room 3

Main Meter

---

## Entity: MonthlyReading

Fields

- id
- meter
- month
- year
- previousReading
- currentReading
- unitsConsumed
- billAmount
- createdAt

---

## Entity: Settings

Fields

- id
- ratePerUnit
- fixedCharge

---

# Business Rules

When saving a monthly reading:

Find previous month's reading.

Units Consumed

currentReading - previousReading

Bill Amount

(unitsConsumed × ratePerUnit) + fixedCharge

Validation

Current reading cannot be smaller than previous reading.

Only one reading per meter per month.

---

# REST APIs

## Property

GET /api/properties

POST /api/properties

---

## Meter

GET /api/meters

GET /api/meters/{id}

POST /api/meters

PUT /api/meters/{id}

DELETE /api/meters/{id}

---

## Reading

POST /api/readings

GET /api/readings

GET /api/readings/{meterId}

PUT /api/readings/{id}

DELETE /api/readings/{id}

---

## Dashboard

GET /api/dashboard

Should return

Main meter units

Total tenant units

My own usage

Total collection

---

# Code Standards

- Use constructor injection
- No field injection
- Use Lombok where appropriate
- Keep methods small
- Follow SOLID principles
- Write readable code over clever code
- Use meaningful variable names
- Use ResponseEntity
- Add validation annotations
- Create custom exceptions

---

# Git Standards

Commit using Conventional Commits.

Examples

feat: add meter entity

feat: implement reading calculation

fix: prevent duplicate monthly readings

docs: update architecture

---

# Documentation

Every major component should be documented.

README.md

Should eventually include

Project setup

Architecture

How to run

API overview

Deployment guide

---

# Today's Goal (Milestone 1)

Complete the backend foundation.

## Create Spring Boot project

Use

Java 21

Spring Boot 3

Dependencies

- Spring Web
- Spring Data JPA
- PostgreSQL Driver
- Validation
- Lombok
- Spring Boot DevTools

---

## Create project structure

Create all required packages.

---

## Create entities

- Property
- Meter
- MonthlyReading
- Settings

---

## Create repositories

JpaRepository for every entity.

---

## Configure PostgreSQL

Use application.yml.

Configuration should support environment variables.

Do NOT hardcode credentials.

---

## Add global exception handling

Create GlobalExceptionHandler.

---

## Add DTO package

Prepare DTOs for future APIs.

---

## Create README.md

Include:

- Project overview
- Tech stack
- Folder structure
- Setup instructions

---

# Out of Scope Today

Do NOT build:

- Authentication
- React frontend
- PDF generation
- OCR
- WhatsApp integration
- Deployment
- Charts
- Payment tracking

Focus only on establishing a clean backend foundation.

---

# Definition of Done

Today's work is complete when:

- Spring Boot project builds successfully
- Project follows clean architecture
- PostgreSQL configuration is ready
- All entities exist
- All repositories exist
- README is created
- Application starts without errors
- Project is ready for implementing business logic tomorrow

No shortcuts.

Prefer maintainability over speed.

The code should be written as if it will be maintained for the next five years.