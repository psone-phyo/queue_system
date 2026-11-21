# queue_system
Real-time web queue system for a dental clinic. Patients scan a QR code to get a queue number, a public display shows who is being served, and receptionists manage the queue from a dashboard. Built with Node.js, TypeScript, React, MongoDB and Redis.

# Clinic Queue System

A real-time, web-based queue management system for a dental clinic, built
as a client-focused digital transformation project.

Patients scan a QR code and instantly receive a queue number, with no
account or login needed. A public display screen shows the number currently
being served and any missed numbers, while receptionists call the next
patient and assign rooms from a dashboard. Managers can create receptionist
accounts and view queue statistics.

## Features

- **Patient side:** QR scan, automatic queue number, live status, and the
  same ticket restored when the browser is reopened
- **Public display:** now serving, upcoming and missed numbers, updated in
  real time
- **Receptionist dashboard:** call next, skip, mark missed, assign room
- **Admin / manager:** staff accounts, role-based access, queue statistics

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express, MVC structure |
| Database | MongoDB (Mongoose) |
| Cache / counters | Redis |
| Realtime | WebSockets |
| Auth | JWT with refresh tokens for staff, cookie session for patients |
| Frontend | React |

## Repository structure

- `backend/`: REST API and realtime server
- `frontend/`: React web app
- `docs/`: user stories, diagrams and design notes

## Getting started

Setup instructions for running the prototype locally are coming soon.