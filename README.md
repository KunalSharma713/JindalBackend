# Store-Plate Backend

This is the official backend for the Store-Plate application, a robust inventory and warehouse management system built with Node.js, Express, and MongoDB. It provides a secure and scalable foundation for managing users, roles, warehouses, and locations with custom business logic.

## Deployment

[![Deploy to Vercel](https://vercel.com/button)](https://api.vercel.com/v1/integrations/deploy/prj_BJ7n30m1oi9X54HWS5FOG6hm3BcU/ta06l6PHr9)

## Features

- **Secure Authentication**: JWT-based authentication (Access & Refresh Tokens) with endpoints for registration, login, logout, and password updates.
- **Role-Based Access Control**: Full CRUD functionality for managing user roles with built-in safety checks.
- **User Management**: Comprehensive user management system with support for filtering, pagination, and sorting.
- **Warehouse Management**: Create, read, update, and delete warehouses with a custom, auto-generated 4-character `code` based on the warehouse name.
- **Location Management**: Full CRUD for locations, featuring an auto-generated `barcode_key` that is unique to each parent warehouse.
- **Flexible API Endpoints**: Includes specialized endpoints for finding specific locations and retrieving all barcodes for printing.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- [MongoDB](https://www.mongodb.com/try/download/community) (running on your local machine or a cloud instance)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/Store-Plate-backend.git
    cd Store-Plate-backend
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Create an environment file:**
    -   Rename the `.env.example` file to `.env`.
    -   Update the variables in the `.env` file with your specific configuration (database URL, JWT secrets, etc.).

    ```
    # .env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/store-plate-db
    ACCESS_TOKEN_SECRET=your_super_secret_access_token
    REFRESH_TOKEN_SECRET=your_super_secret_refresh_token
    ```

4.  **Run the server:**
    ```sh
    npm start
    ```
    The server will start on the port specified in your `.env` file (e.g., `http://localhost:3000`).

## API Documentation

All protected routes require a valid JWT Bearer token in the `Authorization` header.

### Authentication (`/api/auth`)

| Method | Endpoint             | Description                               |
| :----- | :------------------- | :---------------------------------------- |
| `POST` | `/register`          | Register a new user.                      |
| `POST` | `/login`             | Log in to get access and refresh tokens.  |
| `POST` | `/refresh-token`     | Get a new access token using a refresh token. |
| `POST` | `/logout`            | Invalidate the current session.           |
| `PUT`  | `/update-password`   | Update the logged-in user's password.     |

### Warehouse Management (`/api/warehouse`)

| Method | Endpoint    | Description                                      |
| :----- | :---------- | :----------------------------------------------- |
| `POST` | `/`         | Create a new warehouse.                          |
| `GET`  | `/`         | Get a paginated list of all warehouses.          |
| `GET`  | `/:id`      | Get a single warehouse by its ID.                |
| `PUT`  | `/:id`      | Update a warehouse's details.                    |
| `DELETE`| `/:id`      | Delete a warehouse (fails if locations exist).   |

### Location Management (`/api/location`)

| Method | Endpoint           | Description                                                        |
| :----- | :----------------- | :----------------------------------------------------------------- |
| `POST` | `/`                | Create a new location for a warehouse.                             |
| `GET`  | `/`                | Get a paginated list of all locations (can filter by warehouse).   |
| `GET`  | `/find`            | Find a location by `name`, `barcode`, or `warehouseCode`.          |
| `GET`  | `/print-barcodes`  | Get a list of all location names and their barcodes.               |
| `GET`  | `/:id`             | Get a single location by its ID.                                   |
| `PUT`  | `/:id`             | Update a location's details.                                       |
| `DELETE`| `/:id`             | Delete a location.                                                 |

### User & Role Management

-   **User Routes**: `/api/user` (Full CRUD)
-   **Role Routes**: `/api/role` (Full CRUD)

## Technology Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB with Mongoose
-   **Authentication**: JSON Web Tokens (JWT)
-   **Validation**: Mongoose Validators
