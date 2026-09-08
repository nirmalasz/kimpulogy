# LARISIN API

Base URL:

```text
/api/v1
```

Protected endpoints require:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

All protected queries are scoped to the shop in the authenticated JWT.

## Health

### `GET /health`

Authentication: none.

Example response:

```json
{
  "status": "ok",
  "app": "LARISIN Go Backend"
}
```

## Authentication

### `POST /auth/register`

Creates a user and shop.

```json
{
  "name": "Zafran",
  "email": "zafran@example.com",
  "password": "secret123",
  "shop_name": "Warung Zafran"
}
```

Returns `201` with `token`, `user`, and `shop`.

### `POST /auth/login`

```json
{
  "email": "zafran@example.com",
  "password": "secret123"
}
```

Returns `200` with `token`, `user`, and `shop`.

### `GET /auth/me`

Returns current authenticated user and shop, including role and avatar URL.

### `PUT /auth/profile`

```json
{
  "name": "Zafran",
  "email": "zafran@example.com",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

Returns canonical updated `user`.

### `PUT /auth/password`

```json
{
  "old_password": "secret123",
  "new_password": "newsecret123"
}
```

Returns `{ "status": "updated" }`.

## Shops

### `PUT /shops`

```json
{
  "name": "Warung Baru"
}
```

Returns canonical updated `shop`.

## Products

### `GET /products`

Returns shop products.

Product shape:

```json
{
  "id": 1,
  "name": "Minyak Goreng",
  "category": "Sembako",
  "price": 35000,
  "cost": 31000,
  "stock": 3,
  "unit": "pcs",
  "sku": "MGB-001",
  "barcode": "899000000001",
  "expiry_date": "2026-12-31",
  "min_stock": 10
}
```

Supported units: `pcs`, `pack`, `box`, `bottle`, `kg`, `g`, `liter`, `ml`.

### `POST /products`

Creates a product. `unit` defaults to `pcs`.

### `GET /products/sku/{sku-or-barcode}`

Looks up a product by SKU or barcode.

### `GET /products/{id}`

Returns one shop-scoped product.

### `PUT /products/{id}`

Full product replacement. Fields are validated according to `unit`.

### `PATCH /products/{id}`

Current backend accepts the same full product payload. Omitted unit preserves the existing unit.

### `DELETE /products/{id}`

Deletes a shop-scoped product.

## Sales and Purchases

### `POST /sales`

```json
{
  "items": [
    { "product_id": 1, "qty": 2 }
  ]
}
```

Sales reject invalid unit precision and insufficient stock. Successful sales update stock,
create sale records, and add an income transaction atomically.

### `POST /purchases`

```json
{
  "product_id": 1,
  "qty": 5,
  "cost": 31000
}
```

Purchases update stock and create an expense transaction atomically.

## Finance

### `GET /finance/summary`

Returns income, expense, revenue, net profit, and trends.

### `GET /finance/components`

Returns Omset, HPP, gross profit, operating expenses, and net profit.

### `GET /finance/transactions`

Returns shop transactions ordered newest first.

### `POST /finance/transactions`

```json
{
  "type": "Keluar",
  "category": "Operasional",
  "amount": 50000,
  "desc": "Beli gas"
}
```

Supported types: `Masuk`, `Keluar`.

## Dashboard

### `GET /dashboard/metrics`

Returns all-time totals, today income/expense/orders/sales, low-stock count, and recent orders.

### `GET /dashboard/analytics`

Returns weekly mix, current/previous week sales points, top products, reminders, and today values.

### `GET /dashboard/insights`

Returns structured Gemini insight:

```json
{
  "summary": "Penjualan minggu ini meningkat.",
  "observations": ["Es Teh Manis menjadi produk terlaris."],
  "actions": ["Pertimbangkan restock Es Teh Manis."],
  "confidence": "medium",
  "period": "current_week",
  "generated_at": "2026-09-08T10:00:00Z"
}
```

## Forecast

### `GET /forecast/restock`

Returns stock, unit, average demand, seven-day forecast, recommendation, urgency, and confidence.

## Notifications

### `GET /notifications`

Returns current low-stock, expiry, order, and transaction notifications plus unread count.

### `PATCH /notifications/{id}`

Marks a notification read or dismissed.

```json
{
  "state": "read"
}
```

Supported states: `read`, `dismissed`.

## Chatbot

### `POST /chatbot/message`

```json
{
  "message": "stok minyak berapa?",
  "session_id": "optional-uuid",
  "scope": "private_shop"
}
```

Market responses use `scope: public_market` and may include public source citations.
Private responses use shop-scoped tools only.

## Error Format

Typical error:

```json
{
  "error": "product not found"
}
```

Common status codes: `400` validation, `401` authentication, `404` missing resource,
`409` conflict or insufficient stock, `502` AI provider failure, `503` unavailable service.
