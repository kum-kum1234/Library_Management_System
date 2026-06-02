# Library Management System

This repository is a full-stack library management system built from your existing C++ console backend and extended into a modern REST API + React frontend.

## Project Structure

- `backend/`
  - `existing_cpp_code/`: refactored legacy C++ library logic from the old console app.
  - `api/`: Crow routes and REST API handlers.
  - `database/`: MySQL connection and database schema.
  - `models/`: API models for books and transactions.
  - `utils/`: helper utilities such as JWT token generation.
  - `server.cpp`: application entrypoint.
  - `CMakeLists.txt`: backend build configuration.

- `frontend/`
  - React + Vite app with login, dashboard, book management, issue/return, and transaction pages.

## Backend Setup

The backend is implemented entirely in C++ using the Crow framework. There is no Node.js or Express backend in this project.

1. Install MySQL and MySQL Connector/C++.
2. Run the SQL script `backend/database/schema.sql` to create `library_db` and seed users/books.
3. Configure database credentials in `backend/database/db.cpp` or provide environment variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, and `DB_NAME`.
4. Build the backend using CMake:

```bash
cd backend
mkdir build && cd build
cmake ..
cmake --build .
```

5. Run the API server:

```bash
./library-api
```

The backend API should be available at `http://localhost:18080`.

## Frontend Setup

The frontend is a React app and uses Vite only for development and static build output. The backend remains the Crow-based C++ API.

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the app in your browser at the local Vite URL.

## Authentication

The backend is designed to use dynamic database data only. There are no hardcoded users or books in the SQL schema.

Create users dynamically using the registration API or by inserting records directly into the `users` table.

- Register endpoint: `POST /api/register`
  - body: `{ "username": "admin", "password": "1234", "role": "admin" }`

## Notes

- The API uses Crow and MySQL Connector/C++.
- The React frontend uses Axios and React Router.
- Legacy file persistence logic is preserved in `backend/existing_cpp_code` for reference, but the API routes are designed to use MySQL.
- Current dynamic features include:
  - user registration via `POST /api/register`
  - login via `POST /api/login`
  - add books, search books, delete books
  - issue / return operations
  - transaction history
  - live dashboard stats
=======
# Library_Management_System
Library_Management_System
