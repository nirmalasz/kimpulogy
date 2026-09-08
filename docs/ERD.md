# Entity Relationship Diagram

```mermaid
erDiagram
    SHOPS ||--o{ USERS : owns
    SHOPS ||--o{ PRODUCTS : contains
    SHOPS ||--o{ SALES : records
    SHOPS ||--o{ PURCHASES : records
    SHOPS ||--o{ TRANSACTIONS : records
    SHOPS ||--o{ ORDERS : receives
    SHOPS ||--o{ NOTIFICATION_STATES : scopes
    USERS ||--o{ NOTIFICATION_STATES : updates
    PRODUCTS ||--o{ SALES : sold
    PRODUCTS ||--o{ PURCHASES : bought

    SHOPS {
        int id PK
        string name
        string address
        datetime created_at
    }

    USERS {
        int id PK
        int shop_id FK
        string name
        string email UK
        string password_hash
        string role
        string avatar_url
        datetime created_at
    }

    PRODUCTS {
        int id PK
        int shop_id FK
        string name
        string category
        float price
        float cost
        float stock
        string unit
        float min_stock
        string sku
        string barcode
        date expiry_date
        datetime created_at
        datetime updated_at
    }

    SALES {
        int id PK
        int shop_id FK
        int product_id FK
        float quantity
        float unit_price
        float total_nominal
        date sale_date
        datetime created_at
    }

    PURCHASES {
        int id PK
        int shop_id FK
        int product_id FK
        float quantity
        date purchase_date
        datetime created_at
    }

    TRANSACTIONS {
        int id PK
        int shop_id FK
        string type
        string category
        float amount
        string description
        string date
        datetime created_at
    }

    ORDERS {
        string id PK
        int shop_id FK
        string item
        int qty
        float total_amount
        string status
        datetime created_at
    }

    NOTIFICATION_STATES {
        int shop_id PK, FK
        int user_id PK, FK
        string notification_id PK
        string state
        datetime read_at
        datetime dismissed_at
        datetime updated_at
    }
```

## Quantity Rules

- Discrete units: `pcs`, `pack`, `box`, `bottle` use whole quantities.
- Continuous units: `kg`, `g`, `liter`, `ml` support two decimals.
- Existing products default to `pcs`.
- `shop_id` is the primary tenant boundary for application queries.

## Persistence Notes

- SQLite is initialized by `backend/internal/database/db.go`.
- Additive migrations run during startup.
- Seed data is intended for prototype/demo use.
- SQLite is currently stored on a Kubernetes PVC.
- Historical sale cost is not yet snapshotted; changing product cost can affect historical HPP.
