# CSV to JSON Converter API

A production-ready Node.js API that converts CSV files to JSON and stores data in PostgreSQL with custom parsing logic.

## Features

- Custom CSV Parser - Hand-built parser without external CSV libraries
- Dot Notation Support - Converts `name.firstName` to nested objects
- PostgreSQL Integration - Efficient batch inserts for 50,000+ records
- Age Distribution Analytics - Automatic calculation and reporting
- Production-Ready Code - Transaction support, error handling, comprehensive logging
- RESTful API - Multiple endpoints for different operations

## Project Structure

```
csv-to-json-api/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── services/
│   │   ├── csvParser.js         # Custom CSV parsing (no libraries)
│   │   └── userService.js       # Database operations with transactions
│   ├── utils/
│   │   ├── objectBuilder.js     # Dot notation to nested objects
│   │   └── ageDistribution.js   # Age group calculations
│   ├── routes/
│   │   └── upload.routes.js     # API endpoints
│   └── app.js                   # Express app entry point
├── uploads/                      # CSV files directory
├── .env                          # Environment configuration
├── package.json
├── sample.csv                    # Test data
└── README.md
```


## Installation

### Step 1: Clone and Install Dependencies

```bash

mkdir csv-to-json-api
cd csv-to-json-api

npm install
```

### Step 2: Set Up PostgreSQL

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

Run the following SQL commands:

```sql

CREATE DATABASE csv_converter_db;

\c csv_converter_db

CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    age INT NOT NULL,
    address JSONB NULL,
    additional_info JSONB NULL
);

\dt

\q
```

### Step 3: Configure Environment

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csv_converter_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Application Configuration
PORT=3000
CSV_FILE_PATH=./sample.csv
```

### Step 4: Run the Application

```bash

npm run dev

npm start
```

You should see output confirming the server is running and connected to the database.

## API Endpoints

### 1. Process CSV File

**Endpoint:** `POST /api/upload/process`

Reads CSV file, converts to JSON, uploads to database, and prints age distribution.

```bash
curl -X POST http://localhost:3000/api/upload/process
```

**Response:**
```json
{
  "success": true,
  "message": "CSV processed and uploaded successfully",
  "statistics": {
    "totalRecords": 20,
    "inserted": 20,
    "failed": 0,
    "processingTime": "0.45s"
  },
  "ageDistribution": {
    "counts": { "<20": 2, "20-40": 9, "40-60": 6, ">60": 3 },
    "percentages": { "<20": "10.00", "20-40": "45.00", "40-60": "30.00", ">60": "15.00" },
    "total": 20
  }
}
```

**Console Output:**
```
==================================================
AGE DISTRIBUTION REPORT
==================================================
Total Users: 20

Age Group     | Count    | % Distribution
--------------------------------------------------
<20           | 2        | 10.00%
20-40         | 9        | 45.00%
40-60         | 6        | 30.00%
>60           | 3        | 15.00%
==================================================
```

### 2. Get Age Distribution

**Endpoint:** `GET /api/upload/distribution`

Returns current age distribution from database.

```bash
curl http://localhost:3000/api/upload/distribution
```

### 3. Get All Users

**Endpoint:** `GET /api/upload/users`

Returns all users from the database.

```bash
curl http://localhost:3000/api/upload/users
```

### 4. Delete All Users

**Endpoint:** `DELETE /api/upload/users`

Clears all user records from the database.

```bash
curl -X DELETE http://localhost:3000/api/upload/users
```

### 5. Get Statistics

**Endpoint:** `GET /api/upload/stats`

Returns database statistics.

```bash
curl http://localhost:3000/api/upload/stats
```

### 6. Health Check

**Endpoint:** `GET /health`

Returns server health status.

```bash
curl http://localhost:3000/health
```

## CSV File Format

### Requirements

- First line must contain headers
- Mandatory fields: `name.firstName`, `name.lastName`, `age`
- Use dot notation for nested properties
- Sub-properties of complex properties must be adjacent
- Comma-separated values
- UTF-8 encoding

### Example CSV

```csv
name.firstName,name.lastName,age,address.line1,address.city,address.state,gender
Rohit,Prasad,35,A-563 Rakshak Society,Pune,Maharashtra,male
Priya,Sharma,28,B-201 Green Valley,Mumbai,Maharashtra,female
```

## Database Schema

```sql
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,              -- Auto-increment ID
    name VARCHAR NOT NULL,              -- firstName + lastName
    age INT NOT NULL,                   -- User age
    address JSONB NULL,                 -- Nested address object
    additional_info JSONB NULL          -- Any extra fields
);
```

**Field Mapping:**
- `name.firstName` + `name.lastName` maps to `name` (VARCHAR)
- `age` maps to `age` (INT)
- `address.*` maps to `address` (JSONB)
- All other fields map to `additional_info` (JSONB)

## How It Works

### 1. CSV Parsing

The custom CSV parser reads files without external libraries:
- Handles quoted values containing commas
- Supports escaped quotes
- Works with different line endings (Windows, Unix, Mac)
- Validates header and value counts

### 2. Object Building

Converts flat CSV records with dot notation to nested objects:

**Input:**
```javascript
{
  "name.firstName": "John",
  "name.lastName": "Doe",
  "age": "25",
  "address.city": "New York"
}
```

**Output:**
```javascript
{
  name: { firstName: "John", lastName: "Doe" },
  age: 25,
  address: { city: "New York" }
}
```

### 3. Database Operations

- Uses PostgreSQL connection pooling
- Batch inserts with transactions for data integrity
- Optimized UNNEST operation for datasets exceeding 5,000 records
- Handles up to 50,000+ records efficiently

### 4. Age Distribution

Calculates users by age group:
- Less than 20 years
- 20 to 40 years
- 40 to 60 years
- Over 60 years

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | csv_converter_db |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | (required) |
| PORT | Application port | 3000 |
| CSV_FILE_PATH | Path to CSV file | ./sample.csv |

## Dependencies

- **express**: Web framework for building REST APIs
- **pg**: PostgreSQL client for Node.js
- **dotenv**: Environment variable management
- **nodemon**: Development auto-restart (dev dependency)

## Key Technical Decisions
### Why JSONB for Nested Data?

- Flexible schema for any nesting depth
- Efficient indexing and querying
- Better performance than VARCHAR for structured data
- Native support for JSON operations

## Assumptions

1. First line in CSV always contains headers
2. Mandatory fields are always present
3. Sub-properties of complex properties are adjacent in CSV
4. Age values are valid integers
5. CSV uses comma as delimiter
6. Files are UTF-8 encoded




