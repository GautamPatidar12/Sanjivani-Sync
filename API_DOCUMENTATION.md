# Sanjivani Sync - Backend API Documentation

This documentation serves as a guide for the frontend team and IDE agents connecting to the Sanjivani Sync backend.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Interactive OpenAPI/Swagger**: `http://localhost:5000/docs`

## OpenAPI Spec (JSON)

An auto-generated Swagger JSON schema is available in the root folder at `API_DOCUMENTATION.json`. You can feed this `.json` file to your IDE Agent (e.g. Cursor, GitHub Copilot) or a frontend generator (like Orval or OpenAPI Generator) to automatically generate API clients, hooks, and TypeScript types.

## Authentication

We use **JWT (JSON Web Tokens)** for authentication. Protected routes require the token to be sent in the `Authorization` header.
Format: `Authorization: Bearer <your_jwt_token>`

> **Note**: For hackathon testing, the `POST /api/auth/login` endpoint is currently configured to be a **dummy login**. It will accept any email/password combination and always return a successful response with a valid JWT token.

## Main Endpoints

### 1. Authentication (`/api/auth`)
- `POST /auth/register` - Register a new user (helper, requester, organization)
- `POST /auth/login` - Dummy login (bypass DB, returns mock token)
- `GET /auth/profile` - Get logged in user profile (Protected)
- `PUT /auth/profile` - Update profile (Protected)
- `DELETE /auth/profile` - Delete account (Protected)

### 2. Users (`/api/users`)
- *(See `API_DOCUMENTATION.json` for details on User endpoints. Commonly includes `GET /users`, `GET /users/:id`, etc.)*

### 3. Help Requests (`/api/help-requests`)
- *(See `API_DOCUMENTATION.json` for details on Help Request endpoints. Used by requesters to post their emergency needs.)*

### 4. Marketplace (`/api/marketplace`)
- `GET /marketplace/categories` - Returns available resource categories (`blood`, `shelter`, `food`, `transport`) and the count of available helpers/organizations for each.
- `GET /marketplace/:category` - Returns users offering a specific category. Supports geo-sorting via `lat`, `lng`, and `radiusInKm` query parameters.

## Feeding this to an IDE Agent

If you are using Cursor or GitHub Copilot in the frontend repo:
1. Copy the `API_DOCUMENTATION.json` file into your frontend directory.
2. Ask your agent: *"Read `API_DOCUMENTATION.json` and generate the TypeScript interfaces and React Query hooks for the `/api/marketplace` and `/api/auth` endpoints."*

If you just need to know the payload shapes, please open `http://localhost:5000/docs` in your browser where all models and request/response examples are fully documented interactively!
