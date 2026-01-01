# XOOM - Comprehensive Test Checklist

This document provides a systematic testing guide for all XOOM features from both rider and driver perspectives.

## Pre-Testing Setup

Before running tests, ensure:
- [ ] Backend server is running (`npm start` in backend/)
- [ ] Frontend dev server is running (`npm run dev` in frontend/)
- [ ] Database is connected and migrations are applied
- [ ] Check backend logs for any startup errors

---

## 1. Authentication Tests

### 1.1 Rider Registration
- [ ] Navigate to registration page
- [ ] Enter valid name, phone (03XX XXXXXXX format), password (6+ chars)
- [ ] Submit registration
- [ ] **Expected**: Success toast, redirect to login
- [ ] **API**: `POST /api/auth/signup` returns 200

### 1.2 Driver Registration
- [ ] Navigate to driver registration
- [ ] Enter valid details with role=driver
- [ ] Submit registration
- [ ] **Expected**: Success toast, redirect to login
- [ ] **API**: `POST /api/auth/signup` with role=driver

### 1.3 Login
- [ ] Enter valid phone and password
- [ ] Click login
- [ ] **Expected**: JWT token stored, redirect to appropriate view
- [ ] **API**: `POST /api/auth/login` returns token

### 1.4 Guest Mode
- [ ] Click "Continue as Guest"
- [ ] Enter name and contact only
- [ ] Submit
- [ ] **Expected**: Access to ride booking (limited features)

---

## 2. Location Selection Tests

### 2.1 Address Search (Pickup)
- [ ] Type address in pickup field (min 3 chars)
- [ ] Wait for autocomplete suggestions
- [ ] Select a suggestion
- [ ] **Expected**: Address fills in, coordinates set
- [ ] **API**: `GET /api/maps/autocomplete`

### 2.2 Address Search (Drop)
- [ ] Type address in drop field
- [ ] Select suggestion
- [ ] **Expected**: Route appears on map, fare calculated
- [ ] **API**: `POST /api/maps/route`

### 2.3 Map Tap to Set Location
- [ ] Tap on map without any location set
- [ ] **Expected**: Pickup location set and locked
- [ ] Tap again on different spot
- [ ] **Expected**: Drop location set and locked

### 2.4 Current Location Button
- [ ] Tap "Current Location" button
- [ ] Allow geolocation permission if prompted
- [ ] **Expected**: Dialog appears with address
- [ ] Choose "Use as Pickup" or "Use as Drop"
- [ ] **Expected**: Location set and locked

### 2.5 Location Locking
- [ ] Set pickup location
- [ ] **Expected**: Lock icon appears, input disabled
- [ ] Tap X button to clear
- [ ] **Expected**: Location cleared, input enabled again

### 2.6 Saved Locations (Home/Work)
- [ ] If home/work saved, quick buttons appear
- [ ] Tap Home button
- [ ] **Expected**: Home address fills pickup or drop

---

## 3. Vehicle Selection Tests

### 3.1 Vehicle Order
- [ ] View vehicle selector
- [ ] **Expected Order**: Car, AC Car, Rikshaw, Bike, Chinchi

### 3.2 Passenger-Based Filtering
- [ ] Set passengers to 1
- [ ] **Expected**: All vehicles available
- [ ] Set passengers to 2
- [ ] **Expected**: Bike disabled (capacity 1)
- [ ] Set passengers to 4
- [ ] **Expected**: Bike and Rikshaw disabled
- [ ] Set passengers to 6
- [ ] **Expected**: Only Chinchi available

### 3.3 Auto-Deselect on Filter
- [ ] Select Bike
- [ ] Increase passengers to 2
- [ ] **Expected**: Bike deselected automatically

---

## 4. Ride Request Tests

### 4.1 Create Ride (Authenticated)
- [ ] Login as rider
- [ ] Set pickup and drop locations
- [ ] Select vehicle type
- [ ] Set passenger count
- [ ] Tap "Request Ride"
- [ ] **Expected**: Success toast, ride created
- [ ] **API**: `POST /api/rides` returns ride object
- [ ] **Check DB**: Ride record with vehicle_type saved

### 4.2 Create Ride (Guest)
- [ ] Continue as guest with name and contact
- [ ] Set pickup, drop, vehicle, passengers
- [ ] Request ride
- [ ] **Expected**: Ride created with guest_name and guest_contact
- [ ] **Check DB**: Ride has guest info, rider_id is NULL

### 4.3 Schedule Ride
- [ ] Tap "Schedule" button
- [ ] Select future date/time
- [ ] Request ride
- [ ] **Expected**: Scheduled ride created with status='scheduled'

### 4.4 Cancel Ride
- [ ] With active ride, tap cancel
- [ ] Confirm cancellation
- [ ] **Expected**: Ride status='cancelled'
- [ ] **API**: `POST /api/rides/:id/cancel`

---

## 5. Driver View Tests

### 5.1 View Available Rides
- [ ] Login as driver
- [ ] Navigate to driver view
- [ ] **Expected**: List of available ride requests

### 5.2 Accept Ride
- [ ] Tap on a ride request
- [ ] Tap "Accept"
- [ ] **Expected**: Ride assigned to driver
- [ ] **API**: `POST /api/rides/:id/accept`

### 5.3 Ride Status Updates
- [ ] Mark as "Arrived"
- [ ] **Expected**: Status updates, rider notified
- [ ] Mark as "Start Trip"
- [ ] **Expected**: Trip in progress

### 5.4 Complete Ride
- [ ] Finish trip
- [ ] Enter final fare and distance
- [ ] **Expected**: Ride completed
- [ ] **API**: `POST /api/rides/:id/complete`

---

## 6. Public Driver View Tests

### 6.1 Access Without Login
- [ ] Navigate to `/driver-requests`
- [ ] **Expected**: Page loads without auth

### 6.2 View Sanitized Requests
- [ ] View ride requests
- [ ] **Expected**: Names masked (e.g., "H***")
- [ ] **Expected**: No exact addresses shown
- [ ] **Expected**: Countdown timer visible

### 6.3 Register Prompt
- [ ] Tap on any request
- [ ] **Expected**: Redirect to driver registration

---

## 7. Map API Tests

### 7.1 Reverse Geocode
```bash
curl -X POST https://xoomrides.com/api/maps/reverse-geocode \
  -H "Content-Type: application/json" \
  -d '{"lat": 24.8607, "lng": 67.0011}'
```
- [ ] **Expected**: Returns address object

### 7.2 Autocomplete
```bash
curl "https://xoomrides.com/api/maps/autocomplete?query=Karachi&lat=24.8&lng=67"
```
- [ ] **Expected**: Returns array of suggestions

### 7.3 Route Calculation
```bash
curl -X POST https://xoomrides.com/api/maps/route \
  -H "Content-Type: application/json" \
  -d '{"origin": {"lat": 24.86, "lng": 67.0}, "destination": {"lat": 24.9, "lng": 67.1}}'
```
- [ ] **Expected**: Returns route with distance, duration, geometry

---

## 8. Saved Locations Tests

### 8.1 Create Saved Location
- [ ] Login as user
- [ ] Navigate to profile/saved locations
- [ ] Tap "Add Location"
- [ ] Enter label, address, coordinates
- [ ] Save
- [ ] **Expected**: Location appears in list
- [ ] **API**: `POST /api/locations`

### 8.2 Edit Saved Location
- [ ] Tap edit on existing location
- [ ] Change label
- [ ] Save
- [ ] **Expected**: Label updated

### 8.3 Delete Saved Location
- [ ] Tap delete on location
- [ ] Confirm
- [ ] **Expected**: Location removed

### 8.4 Set Default Pickup/Drop
- [ ] Set location as default pickup
- [ ] **Expected**: Badge shows "Default Pickup"
- [ ] Start new ride
- [ ] **Expected**: Location pre-filled

---

## 9. Real-Time Tests (Socket.IO)

### 9.1 Driver Location Updates
- [ ] Driver app sends location
- [ ] **Expected**: Rider sees driver marker move

### 9.2 Ride Status Notifications
- [ ] Driver changes ride status
- [ ] **Expected**: Rider receives instant notification

### 9.3 New Ride Broadcast
- [ ] Rider creates ride
- [ ] **Expected**: Available drivers see it immediately

---

## 10. Currency & Data Tests

### 10.1 Currency Display
- [ ] View fare estimates
- [ ] **Expected**: Shows "PKR" or "Rs." prefix
- [ ] Check driver earnings
- [ ] **Expected**: Currency is PKR throughout

### 10.2 No Dummy Data
- [ ] Check driver stats on main menu
- [ ] **Expected**: Real data from API, not hardcoded
- [ ] **API**: `GET /api/driver/stats`

---

## 11. Error Handling Tests

### 11.1 Network Error
- [ ] Disconnect internet
- [ ] Try action
- [ ] **Expected**: Graceful error message

### 11.2 Invalid Input
- [ ] Submit form with invalid data
- [ ] **Expected**: Validation error shown

### 11.3 Session Expired
- [ ] Wait for token to expire
- [ ] Try action
- [ ] **Expected**: Redirect to login

---

## Backend Logs to Check

During testing, monitor backend logs for:
- [ ] Request logging working (shows method, path, status, duration)
- [ ] Errors logged with stack traces
- [ ] Slow requests (>1000ms) flagged
- [ ] No sensitive data (passwords) in logs

---

## Test Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Auth | | | |
| Location | | | |
| Vehicles | | | |
| Rides | | | |
| Driver | | | |
| Public View | | | |
| Map APIs | | | |
| Saved Locations | | | |
| Real-time | | | |
| Currency | | | |
| Errors | | | |

---

## Post-Testing

After completing tests:
1. Document any failed tests with screenshots
2. Check backend logs for errors
3. Report bugs with reproduction steps
4. Re-test after fixes

---

Last Updated: 2026-01-01

