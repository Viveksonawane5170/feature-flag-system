# Feature Flag Management System

A professional-grade system for managing feature flags across multiple deployment environments. This application allows teams to decouple code deployment from feature release, enabling safer rollouts and dynamic control over application behavior.

## 🚀 Project Overview

The system manages **Feature Flags** (toggles) that are associated with specific **Environments** (e.g., Development, Staging, Production). 

- **Environments**: Define where a feature is being tested or released.
- **Feature Flags**: Define the logic (Boolean, String, or Number) and the default state of a feature.
- **Control**: Admins can create, update, and enable/disable flags per environment to control feature visibility in real-time.

## 🛠 Technology Stack

### Backend
- **Language**: Python 3.12+
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **Validation**: Pydantic
- **Security**: JWT (JSON Web Tokens), `pwdlib` for password hashing

### Frontend
- **Language**: TypeScript
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: CSS3

## 📂 Project Structure

```text
.
├── backend/
│   ├── app/
│   │   ├── database/      # DB connection and auth dependencies
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── routers/       # API endpoints (Auth, Flags, Environments)
│   │   ├── schemas/       # Pydantic request/response models
│   │   └── services/      # Business logic and DB operations
│   ├── migrations/        # Alembic migration scripts
│   ├── alembic.ini        # Alembic configuration
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── src/               # React components and application logic
    ├── public/            # Static assets
    ├── package.json       # Node.js dependencies and scripts
    └── vite.config.ts     # Vite configuration
```

## 📋 Prerequisites

- **Python**: 3.12 or higher
- **Node.js**: 20.x or higher
- **PostgreSQL**: 15.x or higher
- **Git**: Installed and configured

## ⚙️ Setup Instructions

### Backend Setup (Windows)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend` folder with the following placeholders:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/db_name
   JWT_SECRET_KEY=your_super_secret_random_key_here
   ```

5. **Apply Database Migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Start the FastAPI Server**:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://127.0.0.1:8000`.

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## 🌐 API Documentation

### 🔑 Authentication
- `POST /api/auth/register`: Create a new user account.
- `POST /api/auth/login`: Authenticate user and receive a JWT access token.

### 🚩 Feature Flags (Admin only)
- `POST /api/v1/flags`: Create a new feature flag.
- `GET /api/v1/flags`: List all feature flags.
- `GET /api/v1/flags/{flag_id}`: Retrieve a specific flag by ID.
- `PUT /api/v1/flags/{flag_id}`: Update an existing flag.
- `DELETE /api/v1/flags/{flag_id}`: Remove a feature flag.

### ▦ Environments (Admin only)
- `POST /api/v1/environments`: Create a new environment.
- `GET /api/v1/environments`: List all environments.
- `GET /api/v1/environments/{environment_id}`: Retrieve a specific environment.
- `PUT /api/v1/environments/{environment_id}`: Update an environment.
- `DELETE /api/v1/environments/{environment_id}`: Remove an environment.
- `GET /api/v1/environments/{environment_id}/flags`: List all flags associated with a specific environment.

## 🛡 Authentication & Authorization

- **JWT Bearer Token**: All protected endpoints require an `Authorization: Bearer <token>` header.
- **Role-Based Access Control (RBAC)**:
    - **User**: Can log in and view their profile.
    - **Admin**: Can manage feature flags and environments.
- **Swagger UI**: Access the interactive API docs at `http://127.0.0.1:8000/docs`. Use the **Authorize** button at the top right to enter your JWT token.

## 🗄 Database & Migrations

- **PostgreSQL**: Used as the primary relational store.
- **SQLAlchemy**: Provides the ORM layer to interact with the database.
- **Alembic**: Handles schema versioning and migrations.
- **Relationships**: Each `Flag` must be linked to exactly one `Environment` and one creating `User`.

## ⚠️ Validation & Error Handling

- **Duplicate Keys**: The system prevents creating two flags with the same key within the same environment.
- **Referential Integrity**: An environment cannot be deleted if it still has associated feature flags.
- **HTTP Status Codes**:
    - `201 Created`: Successfully created resource.
    - `400 Bad Request`: Validation or processing error.
    - `404 Not Found`: Resource does not exist.
    - `409 Conflict`: Duplicate entry or linked-resource restriction.
    - `403 Forbidden`: Insufficient permissions (User attempting Admin action).

## 🧪 Testing & Quality

- **Frontend Build**: Run `npm run build` in the `/frontend` directory to verify TypeScript types and build the production bundle.
- **API Testing**: Use the built-in Swagger UI (`/docs`) for manual endpoint verification.

## 🛠 Troubleshooting

- **Database Connection Error**: Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.
- **CORS Error**: Ensure the frontend is running on `http://localhost:5173` as specified in the backend's CORS middleware.
- **Migration Errors**: If migrations fail, ensure you are using a clean database or that the migration history in the `alembic_version` table is consistent.
