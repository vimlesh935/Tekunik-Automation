# Order Status Flow - Complete Testing Guide

## PHASE 1: Database Verification ✅
- orders table exists with columns:
  - id, user_id, order_number, invoice_number, tracking_number
  - status (pending, confirmed, processing, packed, shipped, out_for_delivery, delivered, cancelled)
  - payment_status (pending, paid, failed, refunded)
  - guest_name, guest_email, guest_phone
  - delivery_address, admin_notes
  - created_at, updated_at

- order_tracking table for timeline:
  - id, order_id, status, label, description, timestamp

## PHASE 2: Admin Status Update System ✅

### Backend (`/backend/src/controllers/orderController.js`)
- `updateOrderStatus()` - Line 649-743
  - Validates status against enum
  - Updates orders table with new status
  - Creates entry in order_tracking table
  - Returns updated order

### Admin Panel (`/frontend/src/pages/AdminPanel.jsx`)
- `updateOrderStatus()` - Line 1431-1444
  - Calls PATCH /api/admin/orders/:id/status
  - Updates local state
  - Refreshes order list

### Admin UI
- Status dropdown select on Orders tab
- Options: pending, confirmed, processing, packed, shipped, out_for_delivery, delivered, cancelled

## PHASE 3: User Status Display System ✅

### Homepage (`/frontend/src/pages/Home.jsx`)
- **Recent Orders Section** (Lines 459-520)
  - Shows last 5 orders if user logged in
  - Displays order number, tracking number, status
  - **NEW: Manual refresh button** - Refreshes orders on click
  - **NEW: Auto-refresh** - Every 30 seconds if logged in

### OrderHistory (`/frontend/src/pages/OrderHistory.jsx`)
- Shows all user orders with pagination
- **Auto-refresh** - Every 30 seconds (Line 26)
- **Visibility change** - Refetch when tab becomes visible (Lines 22-23)
- Status badges with color coding

### OrderDetails (`/frontend/src/pages/OrderDetails.jsx`)
- Shows full order with timeline
- **Auto-refresh** - Every 30 seconds (Line 48)
- **Visibility change** - Refetch when tab becomes visible (Lines 42-44)
- Tracking timeline with all status updates

## PHASE 4: Guest Tracking System ✅

### TrackOrder (`/frontend/src/pages/TrackOrder.jsx`)
- Search by:
  - Tracking Number (Line 63)
  - Order Number + Email/Phone (Line 64)
- **Manual refresh button** - Updates order status on click (Line 80-96)
- Shows order details with timeline
- Displays tracking number and status

### Backend (`/backend/src/routes/orderRoutes.js`)
- POST /api/guest/orders/track - No auth required (Line 26)
- GET /api/guest/orders/download-invoice - No auth required (Line 27)

## PHASE 5: Status Sync Verification

### Real-time Sync Points
1. ✅ Admin updates status in AdminPanel
2. ✅ PATCH request sent to backend
3. ✅ Database updated with new status
4. ✅ order_tracking entry created
5. ✅ Homepage refreshes every 30 seconds (auto-sync)
6. ✅ OrderHistory refreshes every 30 seconds (auto-sync)
7. ✅ OrderDetails refreshes every 30 seconds (auto-sync)
8. ✅ Guest can manually refresh on TrackOrder page

### Manual Refresh Points
- Homepage Recent Orders - Refresh button
- TrackOrder page - Refresh button
- OrderHistory - Tab visibility triggers refresh
- OrderDetails - Tab visibility triggers refresh

## PHASE 6: Invoice & Tracking Numbers

### Invoice Generation (`/backend/src/controllers/orderController.js`)
- Line 191: Invoice number generated at order creation
- Line 192: Tracking number generated at order creation
- Format: `INV-` + timestamp-based
- Stored in orders.invoice_number and orders.tracking_number

### Invoice Download
- POST /api/admin/orders/:id/invoice - Admin regenerate invoice
- GET /api/guest/orders/download-invoice - Guest download by order/email
- GET /api/user/orders/:id/download-invoice - User download

## TESTING WORKFLOW

### Test 1: Create Order
```
1. Go to shop, add product to cart
2. Checkout as guest or logged-in user
3. Verify tracking number and invoice number generated
4. Note order_number for testing
```

### Test 2: Admin Updates Status
```
1. Login to Admin Panel (/admin-login)
2. Go to Orders tab
3. Select order from dropdown
4. Change status from "pending" to "confirmed"
5. Click Update button
6. Verify toast notification shows success
```

### Test 3: Homepage Real-time Sync
```
1. Open homepage in logged-in state
2. Observe "My Recent Orders" section
3. Leave page open for 30 seconds
4. Status should update automatically
5. Click refresh button for immediate update
```

### Test 4: OrderHistory Auto-Refresh
```
1. Go to /orders page
2. Leave page open for 30 seconds
3. Order status should update automatically
4. Switch to another tab and back
5. Status should refresh immediately
```

### Test 5: OrderDetails Auto-Refresh
```
1. Click on order card to view details
2. Leave page open for 30 seconds
3. Status should update automatically
4. Timeline should show new status entry
5. Switch to another tab and back
6. Status should refresh immediately
```

### Test 6: Guest Tracking
```
1. Go to /track-order page
2. Search by tracking number
3. Click refresh button
4. Status should update
5. Try search by order number + email
6. Verify timeline shows all status updates
```

### Test 7: Invoice Tracking Number
```
1. View order details
2. Verify tracking_number displayed
3. Download invoice
4. Verify PDF contains tracking_number
5. Invoice number also shown in order
```

## Status Timeline Mapping

When admin changes status, order_tracking entry created:

```
pending → (no entry, initial state)
confirmed → "Confirmed" - "Your order has been confirmed and is being processed"
processing → "Processing" - "Your order is being processed"
packed → "Packed" - "Your items are packed and ready for shipping"
shipped → "Shipped" - "Your package has been shipped and is on its way"
out_for_delivery → "Out for Delivery" - "Your package is out for delivery today"
delivered → "Delivered" - "Your package has been delivered successfully"
cancelled → "Cancelled" - "Your order has been cancelled"
```

## Performance Notes

- Auto-refresh interval: 30 seconds (prevents excessive API calls)
- Homepage refresh only triggers if user is logged in
- All pages have visibility change detection (refresh on tab return)
- Manual refresh buttons available for immediate updates
- Backend endpoints are protected with appropriate middleware:
  - Admin routes: requireAdmin middleware
  - User routes: requireAuth middleware
  - Guest routes: No auth required

## Potential Issues & Solutions

### Issue: Status not updating
- Solution: Manual refresh button available
- Check: Browser console for API errors
- Verify: Admin PATCH request successful

### Issue: Slow refresh
- Solution: Manual refresh button for immediate update
- Note: 30-second interval balances responsiveness and performance

### Issue: Guest tracking not showing status
- Solution: Use exact order number and email
- Verify: Order created as guest (guest_email field populated)

## Files Modified in This Phase

1. **frontend/src/pages/Home.jsx**
   - Added ordersRefreshing state
   - Added 30-second auto-refresh interval for logged-in users
   - Added manual refresh button to Recent Orders section
   - Added cleanup hook for interval

2. **No backend changes needed** - All endpoints already implement required functionality

## Verification Checklist

- [x] Database has tracking_number and status columns
- [x] Admin can update status via dropdown
- [x] Backend creates order_tracking entries
- [x] Homepage displays recent orders
- [x] Homepage has auto-refresh (30 seconds)
- [x] Homepage has manual refresh button
- [x] OrderHistory has auto-refresh
- [x] OrderDetails has auto-refresh
- [x] TrackOrder has manual refresh
- [x] Guest tracking works without login
- [x] Status updates visible across all pages
- [x] Invoice includes tracking number
- [x] Timeline shows all status changes
