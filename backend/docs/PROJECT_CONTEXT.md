# CampusFlow Backend Project Context

> **Version:** 1.0
>
> **Last Updated:** June 2026
>
> **Project Status:** Active Development
>
> **Current Phase:** Phase 2 - Module 3 (Utilities)

---

# Project Overview

CampusFlow is a Student Productivity Platform developed for the CampusAI Hackathon 2025.

The objective of the backend is to provide a centralized REST API that communicates with:

- Next.js Frontend
- Supabase PostgreSQL
- Python AI Service
- n8n Automation

The backend is the only component allowed to access the database and external integrations.

---

# Team Structure

This project is divided among multiple team members.

## Backend (My Responsibility)

Responsible for:

- Express REST API
- Supabase Integration
- Authentication
- Database Operations
- API Validation
- n8n Webhook Communication
- Python AI Integration (HTTP only)
- Deployment

---

## Frontend

Technology

- Next.js 15
- App Router
- TypeScript
- Tailwind CSS

Responsibilities

- User Interface
- API Consumption
- Authentication Flow
- Dashboard
- Forms
- Task Management

The frontend NEVER accesses the database directly.

---

## Python AI Service

Owned by another teammate.

Responsibilities

- Notice Summarization
- Flashcard Generation
- AI Processing

The backend communicates through HTTP requests only.

The backend never contains AI logic.

---

## n8n Automation

Owned by another teammate.

Responsibilities

- WhatsApp Notifications
- Google Calendar Integration
- Reminder Scheduling

The backend only sends webhook requests and receives callback updates.

---

# Project Architecture

Next.js Frontend

↓

Express Backend

↓

Supabase PostgreSQL

↓

Python AI Service

↓

n8n Automation

↓

WhatsApp

↓

Google Calendar

The backend is the central communication layer.

---

# Repository Structure

All backend code must remain inside:

backend/

Documentation remains inside:

docs/

Frontend files must never be modified by backend development.

---

# Technology Stack

Backend

- Node.js
- Express.js

Database

- Supabase PostgreSQL

Authentication

- Supabase Auth

Validation

- Zod

Logging

- Pino

Documentation

- Swagger / OpenAPI

Deployment

- Render

Environment

- dotenv

Security

- Helmet
- CORS
- Rate Limiting

---

# Development Principles

The backend must be:

- Modular
- Readable
- Easy to integrate
- API-first
- Well documented
- Hackathon friendly

Avoid unnecessary abstractions.

Avoid overengineering.

Prioritize a stable MVP.

---

# Current Progress

Completed

✅ Backend Integration Specification

✅ Module 1

- package.json
- .env.example
- environment.md

✅ Module 2

- src/config/env.js
- src/config/supabase.js
- src/config/swagger.js

Current Module

➡ Module 3

Utilities

Pending

- Logger
- Response Helper
- HTTP Client

No later modules have been generated.

---

# Important Rules

- Never regenerate completed modules.
- Never redesign the architecture.
- Never change API contracts.
- Never rename files.
- Never modify the folder structure.
- Always continue from the current module.
- All new code must remain compatible with previous modules.

---

# Folder Structure

The backend follows the structure below. Future modules must strictly follow this layout.

```text
backend/
│
├── package.json
├── .env.example
├── environment.md
│
└── src/
    ├── config/
    │   ├── env.js
    │   ├── supabase.js
    │   └── swagger.js
    │
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── validators/
    ├── services/
    ├── repositories/
    ├── database/
    ├── webhooks/
    ├── callbacks/
    ├── utils/
    ├── types/
    ├── docs/
    ├── tests/
    │
    ├── app.js
    └── server.js
```

This folder structure must not be changed.

No files should be moved or renamed unless explicitly approved.

---

# Module Roadmap

The backend is being developed module-by-module.

Each module must be completed, reviewed, and approved before the next begins.

## Module 1 — Foundation Files

Status

✅ Completed

Files

- package.json
- .env.example
- environment.md

---

## Module 2 — Configuration

Status

✅ Completed

Files

- src/config/env.js
- src/config/supabase.js
- src/config/swagger.js

---

## Module 3 — Utilities

Status

⏳ Pending

Files to generate

- src/utils/logger.js
- src/utils/response.js
- src/utils/httpClient.js

---

## Module 4 — Middleware

Pending

Expected files

- authMiddleware.js
- errorHandler.js
- validationMiddleware.js
- rateLimiter.js

---

## Module 5 — Validators

Pending

Expected files

- auth.validator.js
- task.validator.js
- notice.validator.js

---

## Module 6 — Database Layer

Pending

Expected files

- SQL schema
- RLS policies
- Seed data
- Database initialization

---

## Module 7 — Repositories

Pending

Repository layer for database access.

---

## Module 8 — Services

Pending

Business logic layer.

---

## Module 9 — Controllers

Pending

Request handling layer.

---

## Module 10 — Routes

Pending

REST API routing.

---

## Module 11 — Authentication

Pending

Supabase authentication integration.

---

## Module 12 — Webhooks

Pending

n8n integration.

---

## Module 13 — Callback Endpoints

Pending

Automation callback handling.

---

## Module 14 — Health Check

Pending

GET /health

---

## Module 15 — API Documentation

Pending

Swagger configuration completion.

---

## Module 16 — Deployment

Pending

Render deployment configuration.

---

## Module 17 — Final Review

Pending

Final testing

Postman collection

README updates

Integration verification

---

# Continuation Rules

When another AI continues this project:

- Never regenerate completed modules.
- Continue only from the next pending module.
- Preserve the folder structure.
- Preserve naming conventions.
- Preserve API contracts.
- Preserve integration rules.
- Never overwrite previously generated files unless explicitly instructed.