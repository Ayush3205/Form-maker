# Dynamic Form Builder

A full-stack web application for creating and managing dynamic forms with various field types.

## Features

- Create, edit, and delete forms
- Multiple field types: text, textarea, number, email, date, checkbox, radio, select
- Conditional nested fields for radio/select options
- Field validation (min/max, length, regex)
- Drag-and-drop field reordering
- Form submissions with pagination
- CSV export
- Server-side validation

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React, TypeScript

## Installation

```bash
npm run install:all
```

## Configuration

Create `server/.env`:

```
MONGODB_URI=your_mongodb_connection_string
PORT=5001
ADMIN_TOKEN=your_admin_token
NODE_ENV=development
```

## Running

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Usage

1. Access admin panel at `/admin`
2. Create forms and add fields
3. View submissions and export CSV
