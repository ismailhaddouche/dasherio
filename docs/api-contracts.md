# API Reference

**Base URL:** `/api`

All protected endpoints require a valid session. Authentication is cookie-based: the server sets an `auth_token` HttpOnly cookie on login. Browsers send it automatically. Non-browser clients may fall back to an `Authorization: Bearer <token>` header.

Rate limiting applies globally (100 req / 15 min per IP). Auth endpoints have a stricter limit (10 req / 15 min). Public QR endpoints are limited to 30 req / min.

---

## Authentication

### POST /auth/login

Login with username and password.

**Request**

```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response 200**

Sets `auth_token` HttpOnly cookie. Returns the user object.

```json
{
  "user": {
    "staffId": "64a...",
    "restaurantId": "64b...",
    "role": "Admin",
    "permissions": ["ADMIN"],
    "name": "Administrador"
  }
}
```

**Errors**

| Code | Reason |
|------|--------|
| 400 | Validation error (missing fields) |
| 401 | Invalid credentials |
| 429 | Too many attempts |

---

### POST /auth/pin

Login with a 4-digit PIN code.

**Request**

```json
{
  "pin_code": "1234",
  "restaurant_id": "64b..."
}
```

**Response 200** — same as `/auth/login`

---

### POST /auth/logout

Clear the session cookie.

**Response 200**

```json
{ "message": "Logged out" }
```

---

## Dishes

### GET /dishes

List all dishes and categories for the authenticated staff's restaurant.

**Auth:** Required

**Response 200**

```json
{
  "categories": [
    { "_id": "...", "category_name": { "es": "Entrantes" } }
  ],
  "dishes": [
    {
      "_id": "...",
      "dish_name": { "es": "Ensalada", "en": "Salad" },
      "dish_base_price": 8.5,
      "category_id": "...",
      "variants": [],
      "extras": [],
      "allergens": []
    }
  ]
}
```

---

### POST /dishes/categories

Create a category.

**Auth:** Required (ADMIN)

**Request**

```json
{
  "category_name": { "es": "Postres", "en": "Desserts" }
}
```

**Response 201** — created category object

---

### POST /dishes

Create a dish.

**Auth:** Required (ADMIN)

**Request** — validated by Zod dish schema

---

## Orders

### POST /orders

Create a new order linked to a totem session.

**Auth:** Required

**Request**

```json
{
  "session_id": "64c...",
  "customer_id": "64d..."
}
```

**Response 201** — order object

---

### POST /orders/items

Add an item to an existing order.

**Auth:** Required

**Request**

```json
{
  "order_id": "64e...",
  "dish_id": "64f...",
  "item_quantity": 2,
  "item_base_price": 8.5,
  "item_name_snapshot": { "es": "Ensalada" },
  "variant_id": null,
  "extras": []
}
```

**Response 201** — created item order object

---

### PATCH /orders/items/:id/state

Advance the state of an order item.

**Auth:** Required

**Item state machine**

```
ORDERED -> ON_PREPARE -> SERVED
                      -> CANCELED (from any state)
```

**Request**

```json
{ "state": "ON_PREPARE" }
```

**Response 200** — updated item order object

**Errors**

| Code | Reason |
|------|--------|
| 400 | Invalid state transition |
| 404 | Item not found |

---

### GET /orders/kitchen

List all active kitchen items (state `ORDERED` or `ON_PREPARE`) for the restaurant.

**Auth:** Required (KTS)

**Response 200** — array of item order objects

---

### POST /orders/payments

Record a payment for an order.

**Auth:** Required (POS)

**Request**

```json
{
  "order_id": "64e...",
  "payment_method": "CASH",
  "amount_paid": 20.00
}
```

**Response 201** — payment object

---

## Totems

### GET /totems

List all totems for the restaurant.

**Auth:** Required (ADMIN)

---

### POST /totems

Create a totem. A unique QR token is generated automatically.

**Auth:** Required (ADMIN)

**Request**

```json
{
  "totem_name": "Table 5"
}
```

**Response 201** — totem object including `totem_qr`

---

### PATCH /totems/:id

Update a totem.

**Auth:** Required (ADMIN)

---

### DELETE /totems/:id

Delete a totem. All active sessions are closed before deletion.

**Auth:** Required (ADMIN)

**Response 204**

---

### POST /totems/:id/regenerate-qr

Generate a new QR token, invalidating the previous one.

**Auth:** Required (ADMIN)

**Response 200**

```json
{ "qr": "new-uuid-token" }
```

---

### POST /totems/:totemId/session

Start a totem session. If an active session already exists it is returned.

**Auth:** Required

**Response 201** — session object

---

### GET /totems/menu/:qr

Get totem info by QR token. Public, no auth required.

**Rate limit:** 10 req / 15 min per IP (brute-force protection)

**Response 200** — totem object

**Errors**

| Code | Reason |
|------|--------|
| 404 | QR token not found |
| 429 | Too many requests |

---

### GET /totems/menu/:qr/dishes

Get the full menu (categories + dishes) for the restaurant linked to a QR token. Public, no auth required.

**Rate limit:** 30 req / min per IP

**Response 200**

```json
{
  "categories": [...],
  "dishes": [...]
}
```

---

## Restaurant

### GET /restaurant

Get the restaurant configuration for the authenticated user's restaurant.

**Auth:** Required

---

### POST /restaurant

Update restaurant configuration.

**Auth:** Required (ADMIN)

---

## Staff

### GET /staff

List staff members.

**Auth:** Required (ADMIN)

---

### POST /staff

Create a staff member.

**Auth:** Required (ADMIN)

**Request**

```json
{
  "staff_name": "Maria",
  "username": "maria",
  "password": "secure-password",
  "pin_code": "5678",
  "role_id": "64a..."
}
```

**Response 201** — staff object (password fields omitted)

---

## Dashboard

### GET /dashboard

Returns revenue, order counts, and top dishes for the restaurant.

**Auth:** Required (ADMIN)

---

## Uploads

### POST /uploads

Upload an image file. Accepted formats: JPEG, PNG, WebP. The file is resized and stored under `/uploads/`.

**Auth:** Required

**Content-Type:** `multipart/form-data`

**Response 200**

```json
{ "url": "/uploads/abc123.webp" }
```

---

## Health

### GET /health

Returns the server status. Does not require auth.

**Response 200**

```json
{ "status": "ok" }
```

---

## Global Error Format

All errors follow this structure:

```json
{
  "error": "Human-readable message"
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 400 | Validation error |
| 401 | Not authenticated or token expired |
| 403 | Authenticated but insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## WebSocket — KDS

Connect to Socket.IO with `withCredentials: true`. The `auth_token` cookie is sent automatically during the handshake.

The KDS namespace requires the `KTS` permission.

### Client-to-server events

| Event | Payload | Description |
|-------|---------|-------------|
| `kds:join` | `sessionId: string` | Subscribe to a session room |
| `kds:item_prepare` | `{ itemId: string }` | Transition item to `ON_PREPARE` |
| `kds:item_serve` | `{ itemId: string }` | Transition item to `SERVED` |

### Server-to-client events

| Event | Payload | Description |
|-------|---------|-------------|
| `kds:joined` | `{ sessionId }` | Room join confirmed |
| `kds:new_item` | item object | New item entered the kitchen |
| `item:state_changed` | `{ itemId, newState }` | An item's state changed |
| `kds:error` | `{ message, ... }` | Error from a previous action |

### POS client-to-server events

| Event | Payload | Description |
|-------|---------|-------------|
| `pos:join` | `sessionId: string` | Subscribe to session updates |
| `pos:leave` | `sessionId: string` | Unsubscribe |

---

## WebSocket — Totem (Customer)

For customers using totems or mobile devices to place orders.

### Client-to-server events

| Event | Payload | Description |
|-------|---------|-------------|
| `totem:join_session` | `{ sessionId: string, customerName?: string, customerId?: string }` | Join session after QR scan |
| `totem:leave_session` | - | Leave current session |
| `totem:place_order` | `{ sessionId, orderId, items: Array, customerId?, customerName?, notes? }` | Place complete order |
| `totem:add_item` | `{ sessionId, orderId, item, customerId?, customerName? }` | Add single item |
| `totem:call_waiter` | `{ sessionId, customerName?, customerId?, message? }` | Request help |
| `totem:request_bill` | `{ sessionId, customerName?, customerId?, splitType? }` | Request bill |
| `totem:subscribe_items` | `{ sessionId: string }` | Subscribe to item state updates |
| `totem:get_table_info` | `{ sessionId: string }` | Get info about who's at the table |
| `totem:get_my_orders` | `{ sessionId: string }` | Get orders placed by this customer |

### Server-to-client events

| Event | Payload | Description |
|-------|---------|-------------|
| `totem:session_joined` | `{ sessionId, customerName?, customerId?, otherCustomersAtTable[], timestamp }` | Successfully joined session |
| `totem:session_left` | `{ sessionId }` | Left session |
| `totem:order_placed` | `{ success, sessionId, itemCount, customerName?, customerId?, timestamp }` | Order confirmed |
| `totem:item_added` | `{ success, sessionId, timestamp }` | Item added |
| `totem:help_request_sent` | `{ success, message, timestamp }` | Help request sent |
| `totem:bill_request_sent` | `{ success, message, timestamp }` | Bill request sent |
| `totem:items_subscribed` | `{ sessionId }` | Subscribed to updates |
| `totem:table_info` | `{ sessionId, customersAtTable[], totalCustomers, myCustomerId?, myCustomerName?, timestamp }` | Table info with all customers |
| `totem:customer_joined_table` | `{ sessionId, customerId?, customerName, joinedAt }` | Another customer joined |
| `totem:customer_left_table` | `{ sessionId, customerId?, customerName, leftAt }` | A customer left |
| `totem:table_order_update` | `{ type, items[], orderedBy, orderedByCustomerId?, totalItemsAtTable, timestamp }` | Any customer at table ordered |
| `totem:session_closed` | `{ sessionId, closedBy, closedByName?, totalAmount?, reason?, message, timestamp }` | Session closed (bill requested) |
| `totem:force_disconnect` | `{ reason, message }` | Force disconnect after session closed |
| `order:item_update` | `{ itemId, newState, itemName?, timestamp }` | Item state changed |
| `order:items_added` | `{ items[], addedBy, addedByCustomerId?, timestamp }` | New items added to order |
| `item:state_changed` | `{ itemId, newState }` | Item state changed (generic) |
| `notification:from_waiter` | `{ message, from, type, timestamp }` | Message from waiter |
| `totem:error` | `{ message, details?, closedBy?, closedAt? }` | Error occurred (includes SESSION_CLOSED) |

---

## WebSocket — TAS (Table Assistance Service)

Requires the `TAS` permission.

### Client-to-server events

| Event | Payload | Description |
|-------|---------|-------------|
| `tas:join` | `sessionId: string` | Join TAS session room |
| `tas:leave` | `sessionId: string` | Leave TAS session room |
| `tas:add_item` | `{ sessionId, orderId, dishId, customerId?, variantId?, extras?, itemData }` | Add item to order |
| `tas:serve_service_item` | `{ itemId: string }` | Mark SERVICE item as served |
| `tas:cancel_item` | `{ itemId: string, reason?: string }` | Cancel an item |
| `tas:request_bill` | `{ sessionId, requestedBy, customerId?, splitType? }` | Request bill |
| `tas:bill_paid` | `{ sessionId, paymentTotal, paymentType, tickets }` | Mark bill as paid |
| `tas:call_waiter_response` | `{ sessionId, acknowledged, message? }` | Acknowledge customer call |
| `tas:notify_customers` | `{ sessionId, message, type? }` | Notify customers at table |

### Server-to-client events (TAS)

| Event | Payload | Description |
|-------|---------|-------------|
| `tas:joined` | `{ sessionId, timestamp }` | Room join confirmed |
| `tas:item_added` | `{ item, addedBy, addedByName, timestamp }` | Item added by TAS |
| `tas:service_item_served` | `{ itemId, sessionId, servedBy, timestamp }` | SERVICE item served |
| `tas:item_canceled` | `{ itemId, sessionId, canceledBy, canceledByName, reason, timestamp }` | Item canceled |
| `tas:bill_requested` | `{ sessionId, requestedBy, customerId?, splitType?, timestamp }` | Bill requested |
| `tas:bill_paid` | `{ sessionId, paidBy, paymentTotal, timestamp }` | Bill marked as paid |
| `tas:new_customer_order` | `{ item, sessionId, timestamp }` | New order from customer |
| `tas:customer_bill_request` | `{ sessionId, customerName?, timestamp }` | Customer requests bill |
| `tas:help_requested` | `{ sessionId, customerName?, tableId?, timestamp }` | Customer requests help |

### Server-to-client events (from KDS to TAS)

| Event | Payload | Description |
|-------|---------|-------------|
| `tas:kitchen_item_update` | `{ itemId, itemName, newState, updatedBy, updatedByName, timestamp }` | Kitchen item state changed |
| `kds:new_item` | item object | New kitchen item (broadcast) |
| `item:state_changed` | `{ itemId, newState, updatedBy?, updatedByStaffId? }` | Item state changed |

### Server-to-client events (from POS to TAS)

| Event | Payload | Description |
|-------|---------|-------------|
| `tas:session_closed` | `{ sessionId, closedBy?, timestamp }` | Session closed by POS |
| `tas:session_paid` | `{ sessionId, paymentTotal, paymentType, paidBy?, paidByName?, timestamp }` | Payment received |
| `tas:session_fully_paid` | `{ sessionId, paymentTotal, paymentType, closedBy?, closedByName?, timestamp }` | Session fully paid and closed |
| `tas:ticket_paid` | `{ sessionId, ticketPart, ticketAmount, paidBy?, remainingAmount?, timestamp }` | Partial payment (ticket paid) |
| `pos:item_added` | `{ item, addedBy, waiterName, timestamp }` | Item added by POS/waiter |
| `pos:item_canceled` | `{ itemId, itemName, itemType, canceledBy, canceledByName, reason, timestamp }` | Item canceled by POS/waiter |
| `pos:bill_requested` | `{ sessionId, requestedBy, customerId?, splitType?, timestamp }` | Bill requested |
| `pos:bill_paid` | `{ sessionId, paidBy?, timestamp }` | Bill paid |
