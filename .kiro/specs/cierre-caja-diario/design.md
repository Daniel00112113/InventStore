# Design Document: Cierre de Caja Diario

## Overview

The Daily Cash Register Closing feature provides a complete solution for Colombian neighborhood stores to reconcile cash at the end of each business day. The system integrates with existing sales data to calculate expected cash, compares it with actual counted cash, and maintains a historical record of all closings for audit purposes.

The implementation follows the existing InvenStore architecture:
- Node.js/Express backend with RESTful API endpoints
- SQLite database using better-sqlite3 for synchronous operations
- Multi-tenant architecture with store_id isolation
- JWT authentication for security
- Vanilla JavaScript frontend with modern UI patterns
- Spanish language throughout the interface
- Colombian currency formatting

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Cierre Modal    │  │  Historial View  │                │
│  │  - Input form    │  │  - Table display │                │
│  │  - Calculations  │  │  - Export button │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API Layer                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/cash-register/close        (POST)             │  │
│  │  /api/cash-register/summary      (GET)              │  │
│  │  /api/cash-register/history      (GET)              │  │
│  │  /api/cash-register/export/:id   (GET)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Authentication Middleware                     │  │
│  │         - JWT validation                              │  │
│  │         - store_id extraction                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  cash_register_closings table                        │  │
│  │  - Stores closing records                            │  │
│  │  - Foreign keys to stores and users                  │  │
│  │  - Unique constraint on (store_id, closing_date)     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  sales table (existing)                              │  │
│  │  - Source of truth for daily transactions            │  │
│  │  - Used to calculate expected cash                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Creating a Closing**:
   - User clicks "Cerrar Caja" button
   - Frontend requests daily summary from backend
   - Backend queries sales table for today's transactions
   - Backend calculates expected cash (efectivo + cash_amount from mixto)
   - Frontend displays summary in modal
   - User enters actual cash counted
   - Frontend calculates difference and displays with color coding
   - User submits with optional notes
   - Backend validates and inserts into cash_register_closings
   - Frontend shows confirmation and refreshes view

2. **Viewing History**:
   - User navigates to history section
   - Frontend requests closings from backend with pagination
   - Backend queries cash_register_closings with JOIN to users table
   - Backend returns formatted data with user names
   - Frontend renders table with Colombian currency formatting
   - User can click row to see details or export

3. **Exporting Report**:
   - User clicks export button for specific closing
   - Backend retrieves closing details with related data
   - Backend queries store information and sales breakdown
   - Backend generates comprehensive JSON report
   - Frontend triggers download or print dialog

## Components and Interfaces

### Backend Components

#### 1. Database Schema Extension

New table: `cash_register_closings`

```sql
CREATE TABLE IF NOT EXISTS cash_register_closings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  closing_date DATE NOT NULL,
  expected_cash REAL NOT NULL,
  actual_cash REAL NOT NULL,
  difference REAL NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(store_id, closing_date)
);

CREATE INDEX IF NOT EXISTS idx_closings_store_date 
  ON cash_register_closings(store_id, closing_date DESC);
```

#### 2. API Endpoints

**POST /api/cash-register/close**
- Purpose: Create a new cash register closing
- Authentication: Required (JWT)
- Request Body:
  ```json
  {
    "actual_cash": 450000,
    "notes": "Todo cuadrado hoy"
  }
  ```
- Response (201):
  ```json
  {
    "id": 15,
    "closing_date": "2024-01-15",
    "expected_cash": 450000,
    "actual_cash": 450000,
    "difference": 0,
    "notes": "Todo cuadrado hoy"
  }
  ```
- Error Cases:
  - 400: Invalid actual_cash (not a number or negative)
  - 400: Notes exceed 500 characters
  - 409: Closing already exists for today
  - 500: Database error

**GET /api/cash-register/summary**
- Purpose: Get daily sales summary for closing preparation
- Authentication: Required (JWT)
- Query Parameters: None (uses current date)
- Response (200):
  ```json
  {
    "date": "2024-01-15",
    "expected_cash": 450000,
    "credit_sales": 120000,
    "total_transactions": 45,
    "cash_transactions": 38,
    "credit_transactions": 7
  }
  ```

**GET /api/cash-register/history**
- Purpose: Retrieve closing history with pagination
- Authentication: Required (JWT)
- Query Parameters:
  - `limit` (optional, default: 50)
  - `offset` (optional, default: 0)
  - `start_date` (optional, ISO format)
  - `end_date` (optional, ISO format)
- Response (200):
  ```json
  {
    "closings": [
      {
        "id": 15,
        "closing_date": "2024-01-15",
        "user_name": "Juan Pérez",
        "expected_cash": 450000,
        "actual_cash": 450000,
        "difference": 0,
        "notes": "Todo cuadrado hoy",
        "created_at": "2024-01-15T22:30:00Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
  ```

**GET /api/cash-register/export/:id**
- Purpose: Export detailed closing report
- Authentication: Required (JWT)
- Path Parameters: `id` - closing ID
- Response (200):
  ```json
  {
    "store": {
      "name": "Tienda Don José",
      "address": "Calle 45 #12-34",
      "phone": "3001234567"
    },
    "closing": {
      "id": 15,
      "date": "2024-01-15",
      "user": "Juan Pérez",
      "expected_cash": 450000,
      "actual_cash": 450000,
      "difference": 0,
      "notes": "Todo cuadrado hoy"
    },
    "daily_summary": {
      "cash_sales": 450000,
      "credit_sales": 120000,
      "total_sales": 570000,
      "total_transactions": 45
    },
    "generated_at": "2024-01-15T22:35:00Z"
  }
  ```
- Error Cases:
  - 404: Closing not found
  - 403: Closing belongs to different store

#### 3. Route Handler Implementation

File: `server/routes/cash-register.js`

Key functions:
- `calculateDailySummary(storeId, date)`: Queries sales table and calculates totals
- `createClosing(storeId, userId, actualCash, notes)`: Validates and inserts closing
- `getClosingHistory(storeId, filters)`: Retrieves paginated history with user names
- `exportClosing(storeId, closingId)`: Generates comprehensive report

Validation logic:
- Actual cash must be >= 0
- Notes max length: 500 characters
- Date format validation for filters
- Store ID isolation enforced on all queries

#### 4. Database Migration

File: `server/db/migrations/add-cash-register-closings.js`

Migration steps:
1. Create cash_register_closings table
2. Create indexes for performance
3. Add unique constraint on (store_id, closing_date)

Rollback steps:
1. Drop indexes
2. Drop table

### Frontend Components

#### 1. Cash Register Closing Modal

File: `client/components/cash-register-modal.js` (to be created)

Responsibilities:
- Fetch daily summary on open
- Display expected cash, credit sales, transaction counts
- Accept actual cash input with real-time validation
- Calculate and display difference with color coding:
  - Red (#dc3545) for faltante (negative)
  - Green (#28a745) for sobrante (positive)
  - Blue (#007bff) for cuadrado (zero)
- Accept optional notes (max 500 chars with counter)
- Submit closing and handle success/error responses
- Close modal and trigger refresh on success

UI Elements:
- Modal header: "Cerrar Caja - [Fecha]"
- Summary section: Read-only fields for expected cash, credit sales, transactions
- Input section: Actual cash input (number, min=0)
- Difference display: Large, color-coded text
- Notes textarea: Optional, with character counter
- Action buttons: "Cancelar" and "Cerrar Caja"

#### 2. Closing History View

File: `client/components/cash-register-history.js` (to be created)

Responsibilities:
- Fetch and display closing history
- Implement pagination controls
- Format currency values using Colombian format
- Apply color coding to difference column
- Handle row click to show details modal
- Provide export functionality per closing

UI Elements:
- Header with "Historial de Cierres" title
- Filter controls: Date range picker
- Table with columns: Fecha, Usuario, Efectivo Esperado, Efectivo Real, Diferencia, Acciones
- Pagination controls: Previous, Next, page indicator
- Empty state message when no closings exist

#### 3. Closing Details Modal

Responsibilities:
- Display full closing information
- Show daily sales breakdown
- Provide export button
- Format all monetary values

UI Elements:
- Modal header: "Detalles del Cierre - [Fecha]"
- Sections: Información General, Resumen del Día, Notas
- Export button: Downloads JSON report
- Close button

#### 4. Integration with Main App

File: `client/app.js` (modifications)

Changes needed:
- Add navigation item for "Cierre de Caja"
- Register route handler for cash register section
- Import and initialize cash register components
- Add "Cerrar Caja" button to dashboard or sales section

## Data Models

### CashRegisterClosing

```javascript
{
  id: Integer,                    // Primary key
  store_id: Integer,              // Foreign key to stores
  user_id: Integer,               // Foreign key to users
  closing_date: String,           // ISO date format (YYYY-MM-DD)
  expected_cash: Number,          // Calculated from sales
  actual_cash: Number,            // User input
  difference: Number,             // actual_cash - expected_cash
  notes: String | null,           // Optional notes (max 500 chars)
  created_at: String              // ISO datetime
}
```

### DailySummary

```javascript
{
  date: String,                   // ISO date format
  expected_cash: Number,          // Sum of cash sales
  credit_sales: Number,           // Sum of credit sales
  total_transactions: Integer,    // Count of all sales
  cash_transactions: Integer,     // Count of cash/mixto sales
  credit_transactions: Integer    // Count of fiado sales
}
```

### ClosingExport

```javascript
{
  store: {
    name: String,
    address: String,
    phone: String
  },
  closing: {
    id: Integer,
    date: String,
    user: String,                 // User full name
    expected_cash: Number,
    actual_cash: Number,
    difference: Number,
    notes: String | null
  },
  daily_summary: {
    cash_sales: Number,
    credit_sales: Number,
    total_sales: Number,
    total_transactions: Integer
  },
  generated_at: String            // ISO datetime
}
```

### Calculation Logic

**Expected Cash Calculation**:
```javascript
// Pseudocode
expected_cash = SUM(
  CASE 
    WHEN payment_type = 'efectivo' THEN total
    WHEN payment_type = 'mixto' THEN cash_amount
    ELSE 0
  END
)
WHERE store_id = user.store_id
  AND DATE(created_at) = CURRENT_DATE
  AND status = 'completed'
```

**Credit Sales Calculation**:
```javascript
// Pseudocode
credit_sales = SUM(
  CASE 
    WHEN payment_type = 'fiado' THEN total
    WHEN payment_type = 'mixto' THEN credit_amount
    ELSE 0
  END
)
WHERE store_id = user.store_id
  AND DATE(created_at) = CURRENT_DATE
  AND status = 'completed'
```

**Difference Calculation**:
```javascript
difference = actual_cash - expected_cash
```

**Difference Classification**:
```javascript
if (difference < 0) {
  type = 'faltante'
  color = '#dc3545'  // red
  label = `Faltante: ${Math.abs(difference).toLocaleString('es-CO')}`
} else if (difference > 0) {
  type = 'sobrante'
  color = '#28a745'  // green
  label = `Sobrante: ${difference.toLocaleString('es-CO')}`
} else {
  type = 'cuadrado'
  color = '#007bff'  // blue
  label = 'Cuadrado'
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Expected Cash Calculation Correctness

*For any* set of sales records for a given store and date, the calculated expected cash should equal the sum of all 'efectivo' payment totals plus all 'mixto' payment cash_amounts, excluding sales with status other than 'completed'.

**Validates: Requirements 1.1, 1.2**

### Property 2: Difference Calculation Accuracy

*For any* pair of actual_cash and expected_cash values, the calculated difference should equal (actual_cash - expected_cash).

**Validates: Requirements 1.3**

### Property 3: Closing Persistence Round-Trip

*For any* valid closing record created with store_id, user_id, actual_cash, and optional notes, querying the database immediately after insertion should return a record with all fields matching the input values, plus system-generated id and timestamps.

**Validates: Requirements 1.4, 1.5**

### Property 4: Daily Summary Calculation Completeness

*For any* set of sales records for a given store and date, the daily summary should correctly calculate:
- Cash sales (efectivo + cash_amount from mixto)
- Credit sales (fiado + credit_amount from mixto)
- Total transaction count
- Only including sales with status 'completed'
- Only including sales for the specified store_id
- Only including sales from the specified date

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 5: History Ordering and Date Filtering

*For any* set of closing records for a store, when querying history with optional date range filters, the results should:
- Include only closings within the specified date range (if provided)
- Be ordered by closing_date in descending order
- Include only closings for the specified store_id

**Validates: Requirements 3.1, 3.4**

### Property 6: Complete Closing Records with User Information

*For any* closing record retrieved from history, the record should include all required fields: id, closing_date, expected_cash, actual_cash, difference, notes, created_at, and the full_name of the user who created the closing.

**Validates: Requirements 3.2, 3.3**

### Property 7: Pagination Correctness

*For any* set of closing records and pagination parameters (limit, offset), the paginated results should:
- Return at most 'limit' records
- Skip the first 'offset' records
- Maintain the correct ordering
- Return the correct total count

**Validates: Requirements 3.5**

### Property 8: Complete Export Report Structure

*For any* valid closing record, the exported report should include all required sections:
- Store information (name, address, phone)
- Closing details (id, date, user name, expected_cash, actual_cash, difference, notes)
- Daily summary (cash_sales, credit_sales, total_sales, total_transactions)
- Generation timestamp

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

## Error Handling

### Input Validation Errors

1. **Negative Actual Cash**:
   - Validation: `actual_cash >= 0`
   - Response: 400 Bad Request
   - Message: "El efectivo real debe ser un número positivo o cero"

2. **Notes Too Long**:
   - Validation: `notes.length <= 500`
   - Response: 400 Bad Request
   - Message: "Las notas no pueden exceder 500 caracteres"

3. **Invalid Date Format**:
   - Validation: ISO date format (YYYY-MM-DD)
   - Response: 400 Bad Request
   - Message: "Formato de fecha inválido. Use YYYY-MM-DD"

### Business Logic Errors

1. **Duplicate Closing**:
   - Condition: Closing already exists for store on given date
   - Response: 409 Conflict
   - Message: "Ya existe un cierre de caja para esta fecha"
   - Detection: UNIQUE constraint violation on (store_id, closing_date)

2. **Closing Not Found**:
   - Condition: Requested closing ID doesn't exist
   - Response: 404 Not Found
   - Message: "Cierre de caja no encontrado"

3. **Unauthorized Access**:
   - Condition: User attempts to access closing from different store
   - Response: 403 Forbidden
   - Message: "No tiene permiso para acceder a este cierre"

### Database Errors

1. **Connection Failure**:
   - Response: 500 Internal Server Error
   - Message: "Error de conexión con la base de datos"
   - Logging: Full error details logged server-side

2. **Transaction Failure**:
   - Response: 500 Internal Server Error
   - Message: "Error al procesar la transacción"
   - Behavior: Automatic rollback of partial changes

3. **Foreign Key Violation**:
   - Response: 400 Bad Request
   - Message: "Datos de referencia inválidos"
   - Logging: Log which foreign key constraint failed

### Error Response Format

All errors follow consistent JSON structure:

```json
{
  "error": true,
  "message": "Mensaje descriptivo en español",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T22:30:00Z"
}
```

### Error Handling Strategy

1. **Validation Layer**: Catch and return 400 errors before database operations
2. **Business Logic Layer**: Check business rules and return appropriate 4xx errors
3. **Database Layer**: Wrap operations in try-catch, log details, return generic 500 errors
4. **Never Expose**: Internal stack traces, database schema details, or SQL queries
5. **Always Log**: Full error details server-side for debugging

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs and validate specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: fast-check (JavaScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: cierre-caja-diario, Property {number}: {property_text}`

**Property Test Coverage**:

Each correctness property defined above must be implemented as a single property-based test:

1. **Property 1 Test**: Generate random sales data with various payment types and verify expected cash calculation
2. **Property 2 Test**: Generate random actual_cash and expected_cash values and verify difference calculation
3. **Property 3 Test**: Generate random closing data, insert, query back, and verify round-trip
4. **Property 4 Test**: Generate random sales data and verify all daily summary calculations
5. **Property 5 Test**: Generate random closings with various dates and verify ordering and filtering
6. **Property 6 Test**: Generate random closings and verify all fields are present in retrieved records
7. **Property 7 Test**: Generate random closings and verify pagination with various limit/offset values
8. **Property 8 Test**: Generate random closings and verify export report contains all required sections

### Unit Testing

**Focus Areas**:

1. **Edge Cases**:
   - Empty sales data (no transactions for the day)
   - Duplicate closing attempt (409 error)
   - Negative actual_cash input (400 error)
   - Notes exceeding 500 characters (400 error)
   - Cross-tenant access attempt (403 error)

2. **Specific Examples**:
   - Closing with zero difference (cuadrado)
   - Closing with negative difference (faltante)
   - Closing with positive difference (sobrante)
   - Mixed payment types in daily summary
   - Date range filtering with various ranges

3. **Integration Points**:
   - Authentication middleware integration
   - Database transaction handling
   - Error response formatting
   - Currency formatting in responses

4. **Error Conditions**:
   - Database connection failures
   - Invalid JWT tokens
   - Malformed request bodies
   - Missing required fields

### Testing Balance

- Avoid writing too many unit tests for scenarios covered by property tests
- Property tests handle comprehensive input coverage through randomization
- Unit tests should focus on specific examples that demonstrate correct behavior and edge cases
- Integration tests should verify component interactions and end-to-end flows

### Test Organization

```
tests/
  unit/
    cash-register/
      calculations.test.js       # Unit tests for calculation functions
      validation.test.js         # Unit tests for input validation
      error-handling.test.js     # Unit tests for error scenarios
  
  property/
    cash-register/
      expected-cash.property.js  # Property 1
      difference.property.js     # Property 2
      persistence.property.js    # Property 3
      daily-summary.property.js  # Property 4
      history.property.js        # Properties 5, 6, 7
      export.property.js         # Property 8
  
  integration/
    cash-register/
      api-endpoints.test.js      # End-to-end API tests
      auth-integration.test.js   # Authentication integration
```

### Test Data Generation

For property-based tests, generators should produce:

- **Sales records**: Random payment types, amounts, dates, store IDs
- **Closing records**: Random actual_cash values, notes, dates
- **User records**: Random user IDs, store IDs, names
- **Date ranges**: Random start and end dates
- **Pagination parameters**: Random limit and offset values

Generators should respect constraints:
- Amounts >= 0
- Valid payment types: 'efectivo', 'fiado', 'mixto'
- Valid status values: 'completed', 'pending'
- Notes <= 500 characters
- Valid date formats
