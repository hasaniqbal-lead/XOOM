# NawaRide API Documentation

Complete API reference for NawaRide platform.

## Base URL

```
Production: https://nawaride.com/api
Development: http://localhost:3000
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Authentication Endpoints

### POST /auth/signup

Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+923001234567",
  "password": "password123",
  "role": "rider"
}
```

**Response (201):**
```json
{
  "message": "User created",
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "+923001234567",
    "role": "rider",
    "is_verified": false
  }
}
```

### POST /auth/login

Authenticate and receive JWT token.

**Request:**
```json
{
  "phone": "+923001234567",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "phone": "+923001234567",
    "role": "rider",
    "is_verified": true
  }
}
```

## Ride Endpoints

### POST /rides

Create a new ride request (Rider only).

**Request:**
```json
{
  "pickup_lat": 31.5204,
  "pickup_lng": 74.3587,
  "pickup_address": "Liberty Market, Lahore",
  "drop_lat": 31.5497,
  "drop_lng": 74.3436,
  "drop_address": "Packages Mall, Lahore"
}
```

**Response (201):**
```json
{
  "id": 123,
  "rider_id": 1,
  "pickup_lat": 31.5204,
  "pickup_lng": 74.3587,
  "drop_lat": 31.5497,
  "drop_lng": 74.3436,
  "distance_km": 4.5,
  "estimated_fare": 117.50,
  "status": "requested",
  "created_at": "2025-11-22T10:30:00Z"
}
```

### POST /rides/:id/accept

Driver accepts a ride.

**Response (200):**
```json
{
  "id": 123,
  "driver_id": 2,
  "status": "assigned",
  "updated_at": "2025-11-22T10:31:00Z"
}
```

### POST /rides/:id/arrived

Driver marks arrival at pickup.

### POST /rides/:id/start

Driver starts the trip.

### POST /rides/:id/complete

Driver completes the ride.

**Request:**
```json
{
  "distance_km": 4.5,
  "fare": 120.00
}
```

### POST /rides/:id/cancel

Cancel a ride.

**Request:**
```json
{
  "reason": "Customer no-show"
}
```

### GET /rides/:id

Get ride details.

### GET /rides/history/me

Get user's ride history.

## Driver Endpoints

### POST /driver/location

Update driver's current location.

**Request:**
```json
{
  "lat": 31.5204,
  "lng": 74.3587,
  "is_online": true
}
```

### POST /driver/status

Set online/offline status.

**Request:**
```json
{
  "is_online": true
}
```

### POST /driver/documents

Upload driver documents (multipart/form-data).

**Form Fields:**
- cnic_front (file)
- cnic_back (file)
- license_front (file)
- license_back (file)
- vehicle_number (string)
- vehicle_type (string: "bike", "car", "auto")

### GET /driver/documents

Get driver's documents.

### GET /driver/warnings

Get driver warnings.

## Admin Endpoints

All admin endpoints require admin role.

### GET /admin/dashboard

Get dashboard statistics.

**Response:**
```json
{
  "total_riders": 245,
  "total_drivers": 52,
  "rides_today": 38,
  "active_drivers": 15,
  "revenue_today": 5240.00
}
```

### GET /admin/riders

Get all riders.

### GET /admin/drivers

Get all drivers with verification status.

### POST /admin/users/:id/block

Block a user.

### POST /admin/users/:id/unblock

Unblock a user.

### POST /admin/drivers/:id/verify

Verify or reject driver documents.

**Request:**
```json
{
  "status": "verified",
  "rejection_reason": null
}
```

### GET /admin/fare

Get current fare settings.

### POST /admin/fare

Update fare settings.

**Request:**
```json
{
  "base_fare": 50.00,
  "per_km": 18.00,
  "minimum_fare": 80.00,
  "surge_multiplier": 1.0
}
```

### POST /admin/credits

Grant credit to a rider.

**Request:**
```json
{
  "rider_id": 1,
  "amount": 100.00,
  "reason": "Promotional credit"
}
```

### POST /admin/drivers/:id/points

Add points to driver.

**Request:**
```json
{
  "points": 10
}
```

### POST /admin/drivers/:id/warnings

Issue warning to driver.

**Request:**
```json
{
  "message": "Multiple ride cancellations",
  "warning_type": "cancellation",
  "severity": "medium"
}
```

### POST /admin/announcements

Create announcement.

**Request:**
```json
{
  "title": "System Maintenance",
  "body": "Scheduled maintenance on Sunday 2am-4am",
  "type": "popup",
  "target_role": "all",
  "priority": 1
}
```

### GET /admin/rides/active

Get all active rides.

### POST /admin/settings/ridelimit

Set ride limits.

**Request:**
```json
{
  "role": "rider",
  "daily_limit": 5,
  "weekly_limit": 30
}
```

## Public Endpoints

### GET /announcements

Get active announcements.

### GET /health

Health check endpoint.

## Socket.IO Events

### Client → Server

**driver_location**
```json
{
  "lat": 31.5204,
  "lng": 74.3587,
  "timestamp": "2025-11-22T10:30:00Z"
}
```

**accept_ride**
```json
{
  "ride_id": 123
}
```

**decline_ride**
```json
{
  "ride_id": 123,
  "reason": "Too far"
}
```

**track_driver**
```json
{
  "ride_id": 123
}
```

### Server → Client

**new_ride**
```json
{
  "ride": {
    "id": 123,
    "pickup_lat": 31.5204,
    "pickup_lng": 74.3587,
    "drop_lat": 31.5497,
    "drop_lng": 74.3436,
    "estimated_fare": 120.00
  }
}
```

**ride_assigned**
```json
{
  "ride_id": 123,
  "driver": {
    "id": 2,
    "name": "Ahmed Khan",
    "phone": "+923001234568"
  }
}
```

**ride_update**
```json
{
  "ride_id": 123,
  "status": "on_trip",
  "timestamp": "2025-11-22T10:35:00Z"
}
```

**ride_completed**
```json
{
  "ride_id": 123,
  "fare": 120.00,
  "completed_at": "2025-11-22T10:45:00Z"
}
```

**announcement**
```json
{
  "title": "New Feature",
  "body": "Check out our new rewards program!",
  "type": "popup"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error
