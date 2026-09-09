# 🏢 Ascendion Office Seat Booking — MEAN Stack Web App
## Complete Build Specification (v3 — MEAN Stack, Multi-Location, Ascendion)

---

## 📌 Project Overview

Build a **fully responsive, progressive web app (PWA)** for an office seat booking system serving **Ascendion** employees across **5 office locations** (Hyderabad, Bangalore, Chennai, Pune, Vadodara). Employees share seats at each location and book via browser. The app must work seamlessly on **mobile, tablet, and desktop**. Role-based access separates employees from admins. Employee data syncs with a **OneDrive Excel file** as the master employee store.

---

## 🛠️ Tech Stack — MEAN Stack

| Layer | Technology |
|-------|------------|
| Frontend | **Angular 17+** (standalone components, signals) + Angular Material / Tailwind CSS |
| Backend | **Node.js + Express.js** |
| Database | **MongoDB** (Mongoose ODM) |
| Auth | JWT (httpOnly cookie) + OTP via email |
| Email / OTP | Nodemailer + SMTP (or Resend) |
| Job Queue | BullMQ + Redis (emails, cron, OTP expiry) |
| Real-time | Socket.io (seat availability live updates) |
| OneDrive Sync | Microsoft Graph API (read/write employee Excel on OneDrive) |
| Hosting | Azure Static Web Apps (Angular) + Azure App Service (Node) + Azure Cosmos DB for MongoDB API **or** Atlas MongoDB |

> **Why MEAN?** Full JavaScript/TypeScript end-to-end. MongoDB's flexible document model suits dynamic seat configs and multi-location schemas. Angular provides enterprise-grade structure suitable for Ascendion's scale.

---

## 🌍 Locations

The app supports **5 office locations**. Each location has its own independently managed seat pool.

| Location | City |
|----------|------|
| HYD | Hyderabad |
| BLR | Bangalore |
| CHN | Chennai |
| PNE | Pune |
| VDR | Vadodara |

Admin can add or remove locations at any time from the admin panel.

---

## 📧 Email Domain Policy

Only the following corporate email domains are permitted to register:

| Domain | Organisation |
|--------|-------------|
| `@ascendion.com` | Ascendion employees |
| `@nitor.com` | Nitor employees |

**Rules enforced at server level (not just frontend):**
- Any email not ending in `@ascendion.com` or `@nitor.com` is **rejected at registration** with a clear error message.
- **No duplicate emails** — one account per email address, enforced by a unique MongoDB index.
- **OTP verification** is mandatory at registration: a 6-digit OTP is sent to the registered email and must be entered within **10 minutes** before the account is activated.
- Admin can configure allowed domains from the admin panel (so adding `@newdomain.com` requires no code change).

---

## 👤 User Registration & Location Assignment

### Registration Flow
1. User visits `/register`
2. Enters: Full Name, Employee ID, Email (`@ascendion.com` or `@nitor.com`), Password, **Primary Location** (dropdown: HYD / BLR / CHN / PNE / VDR), Department (optional)
3. Server sends **OTP to entered email**
4. User enters OTP on `/verify-otp` page (expires in 10 minutes, max 3 attempts)
5. On success → account created in MongoDB + **row added/updated in OneDrive Excel file**
6. User is redirected to login

### Location Logic for Users
- **Primary location** is set once at registration; it becomes the **default** location for every booking session — the user does not need to re-select it on every login.
- The **seat grid and availability is filtered to the user's primary location** automatically.
- A user **cannot change their own location** — they must contact admin.
- Admin can assign **one or more secondary locations** to a user (e.g., for a leader who visits multiple offices).
- If a user has multiple locations assigned, they see a **location switcher** at the top of the booking page.

---

## 🗄️ MongoDB Collections (Schema)

### Collection: `users`
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique, lowercase)",
  "passwordHash": "string (bcrypt)",
  "role": "employee | admin",
  "employeeId": "string",
  "department": "string",
  "primaryLocation": "HYD | BLR | CHN | PNE | VDR",
  "allowedLocations": ["HYD", "BLR"],
  "isActive": "boolean (default: true)",
  "isEmailVerified": "boolean (default: false)",
  "createdAt": "Date",
  "lastLogin": "Date"
}
```

### Collection: `locations`
```json
{
  "_id": "ObjectId",
  "code": "string (e.g. HYD)",
  "name": "string (e.g. Hyderabad)",
  "address": "string",
  "totalSeats": "number",
  "isActive": "boolean",
  "createdBy": "ObjectId → users",
  "createdAt": "Date"
}
```

### Collection: `seats`
```json
{
  "_id": "ObjectId",
  "locationCode": "string (FK → locations.code)",
  "seatNumber": "number",
  "seatLabel": "string (e.g. HYD-42)",
  "zone": "string (e.g. Zone A, Floor 2)",
  "amenities": ["window", "standing_desk", "near_exit"],
  "isBlocked": "boolean (default: false)",
  "blockedReason": "string",
  "blockedBy": "ObjectId → users",
  "isActive": "boolean (default: true)",
  "createdAt": "Date"
}
```
> Admin can **add or remove seats** per location from the admin panel. Removing a seat soft-deletes it (`isActive: false`); all future availability queries exclude it.

### Collection: `bookings`
```json
{
  "_id": "ObjectId",
  "seatId": "ObjectId → seats",
  "userId": "ObjectId → users",
  "locationCode": "string",
  "bookingDate": "Date (date only, no time)",
  "startTime": "string (HH:MM, 24h, e.g. 22:00)",
  "endTime": "string (HH:MM, 24h, e.g. 10:00 next day)",
  "startDatetime": "ISODate (computed, for overlap checks)",
  "endDatetime": "ISODate (computed, for overlap checks)",
  "crossesMidnight": "boolean",
  "durationHours": "number (3–12)",
  "status": "active | cancelled | completed",
  "cancellationReason": "string",
  "cancelledBy": "employee | admin | system",
  "bookedAt": "Date"
}
```

### Collection: `otpTokens`
```json
{
  "_id": "ObjectId",
  "email": "string",
  "otp": "string (hashed)",
  "purpose": "email_verification | password_reset",
  "expiresAt": "Date (10 min from creation)",
  "used": "boolean",
  "attempts": "number (max 3)"
}
```

### Collection: `blockedDates`
```json
{
  "_id": "ObjectId",
  "locationCode": "string (or 'ALL' for all locations)",
  "blockedDate": "Date",
  "reason": "string",
  "blockedBy": "ObjectId → users",
  "createdAt": "Date"
}
```

### Collection: `auditLogs`
```json
{
  "_id": "ObjectId",
  "actorId": "ObjectId → users",
  "action": "string (BOOKING_CREATED | SEAT_ADDED | SEAT_REMOVED | USER_DEACTIVATED | etc.)",
  "targetType": "booking | seat | user | location | date",
  "targetId": "string",
  "metadata": "object (before/after snapshot)",
  "createdAt": "Date"
}
```

### Collection: `notifications`
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId → users",
  "type": "string (booking_confirmed | booking_cancelled | seat_swapped | etc.)",
  "message": "string",
  "read": "boolean (default: false)",
  "createdAt": "Date"
}
```

### Collection: `announcements`
```json
{
  "_id": "ObjectId",
  "locationCode": "string (or 'ALL')",
  "message": "string",
  "isActive": "boolean",
  "createdBy": "ObjectId → users",
  "createdAt": "Date"
}
```

**MongoDB Indexes:**
```javascript
db.bookings.createIndex({ locationCode: 1, bookingDate: 1, status: 1 });
db.bookings.createIndex({ userId: 1, status: 1 });
db.bookings.createIndex({ startDatetime: 1, endDatetime: 1 });
db.seats.createIndex({ locationCode: 1, isActive: 1, isBlocked: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.otpTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## 🔐 Authentication & Security

### Auth Flow
1. **Register** → OTP to email → verify OTP → account active
2. **Login** → `POST /api/auth/login` → validate credentials + check `isActive` + check `isEmailVerified` → issue JWT in `httpOnly + Secure + SameSite=Strict` cookie
3. **Forgot Password** → enter email → OTP sent → verify OTP → set new password
4. **Logout** → `POST /api/auth/logout` → clear cookie

### Password Policy
- Minimum 8 characters; must include at least one uppercase, one number, one special character
- bcrypt with salt rounds ≥ 12
- Forgot password: OTP-based (6 digits, 10 min expiry, 3 max attempts, one-time use)

### Security Hardening
- Rate limit login: max 10 attempts per IP per 15 minutes (`express-rate-limit`)
- Rate limit OTP send: max 3 OTP sends per email per hour
- Rate limit booking: max 5 booking requests per user per minute
- All DB queries use Mongoose with parameterized inputs — no string interpolation
- CORS: allow only deployed frontend origin
- `helmet` for HTTP security headers (CSP, HSTS, X-Frame-Options)
- Zod validation on all API request bodies
- CSRF token for all state-changing requests (since auth uses cookies)
- Deactivated users (`isActive: false`) are rejected at every protected route middleware

---

## 📐 Responsive Layout Strategy

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | Single-column, bottom navigation bar |
| 640–1024px (tablet) | Two-column, optional side nav |
| > 1024px (desktop) | Sidebar navigation, multi-column |

**Key rules:**
- Bottom tab bar on mobile → left collapsible sidebar on desktop
- Seat grid: 2 columns mobile → 4 columns tablet → 5 columns desktop
- Admin tables: card stack on mobile → full data table on desktop
- Modals: full-screen on mobile → centred modal on desktop
- Minimum 44×44px tap targets on all interactive elements

---

## ⏰ Booking Time Rules (24-Hour Cross-Midnight Support)

This is a shift-friendly system — employees can book across midnight.

### Rules
- **Minimum duration**: 3 hours
- **Maximum duration**: 12 hours
- **No hard start/end window** — bookings can start and end at any time (e.g. 10:00–18:00, 22:00–06:00 next day, 03:00–09:00)
- Cross-midnight bookings (e.g. 22:00 → 04:00) are handled by storing `startDatetime` and `endDatetime` as full ISO timestamps
- A booking that starts at 22:00 on May 10 and ends at 04:00 on May 11 stores: `startDatetime: 2025-05-10T22:00Z`, `endDatetime: 2025-05-11T04:00Z`
- `crossesMidnight: true` is set for display purposes
- **Overlap detection** uses datetime range comparison (not just hours), so cross-midnight bookings are correctly blocked

### 1-Hour Buffer Rule
A seat is unavailable for a new booking if any existing active booking on the same seat satisfies:
```
existingStart - 1hr < newEnd AND existingEnd + 1hr > newStart
```
(All comparisons on full ISO datetimes, not just hour integers)

### Date Display
- For cross-midnight bookings, display as: `"10 May 22:00 → 11 May 04:00 (6 hrs)"`
- Calendar date picker selects the **start date** only
- End date is calculated and displayed automatically

---

## 📱 Pages & Routes (Angular)

| Route | Guard | Purpose |
|-------|-------|---------|
| `/login` | Public | Email + password |
| `/register` | Public | Name, email, password, primary location |
| `/verify-otp` | Public | OTP entry after registration |
| `/forgot-password` | Public | Enter email to receive OTP |
| `/reset-password` | Public | Enter OTP + new password |
| `/` | AuthGuard | Home: booking counter, upcoming bookings |
| `/book` | AuthGuard | Step 1: Location (if multi-loc), date, time |
| `/book/seats` | AuthGuard | Step 2: Seat grid |
| `/book/confirm` | AuthGuard | Step 3: Review & confirm |
| `/book/success` | AuthGuard | Confirmation screen |
| `/my-bookings` | AuthGuard | View & cancel own bookings |
| `/notifications` | AuthGuard | In-app notification centre |
| `/profile` | AuthGuard | View/edit name, change password |
| `/admin` | AdminGuard | Dashboard: all bookings, stats |
| `/admin/locations` | AdminGuard | Add / remove / configure locations |
| `/admin/seats/:locationCode` | AdminGuard | Add / remove / block seats per location |
| `/admin/block-dates` | AdminGuard | Block dates per location or all |
| `/admin/users` | AdminGuard | Manage users, activate/deactivate/delete |
| `/admin/user/:id/locations` | AdminGuard | Assign multi-location access to a user |
| `/admin/audit-log` | AdminGuard | Full audit trail |
| `/admin/analytics` | AdminGuard | Occupancy charts per location |
| `/admin/announcements` | AdminGuard | Post/manage announcements |
| `/admin/sync` | AdminGuard | OneDrive Excel sync status & manual trigger |

---

## ✅ Feature Requirements

### Home Screen (`/`)
- Welcome message with employee name and primary location badge
- Active booking count: **X / 10 active bookings**
- Quick actions: "Book a Seat", "My Bookings", "Notifications"
- Upcoming bookings preview (next 2–3)
- Location-specific announcement banner (if admin has posted one)
- **Location switcher** in header (visible only if user has multiple locations assigned)

---

### Booking Flow

#### Step 1 — Location, Date & Time (`/book`)
- **Location selector**: auto-selected to primary location; if user has multiple locations assigned, shows a dropdown
- Calendar: tomorrow to 15 days ahead; weekends and admin-blocked dates for that location are disabled
- **Time input**: two fields — Start Time (HH:MM) and End Time (HH:MM), both in 24-hour format
  - If end time is earlier than start time → system interprets it as next-day (cross-midnight)
  - Duration displayed in real-time: `"Duration: 6 hours (crosses midnight)"`
- Validation:
  - Duration ≥ 3 hours, ≤ 12 hours
  - No overlapping bookings for this user on the same seat range
  - Max 1 booking per day per user per location
  - Max 10 active bookings total

#### Step 2 — Seat Selection (`/book/seats`)
- Query: `GET /api/seats/available?location=HYD&startDatetime=...&endDatetime=...`
- Seat card colour coding:
  - 🟢 Green = available
  - ⚫ Grey = booked (shows booked time on hover/tap)
  - 🔴 Red = blocked by admin (shows reason)
  - 🟡 Yellow = your selection
- Seat grid: 2 col mobile / 4 col tablet / 5 col desktop
- Live updates via **Socket.io** — seats grey out in real-time as others book
- "Refresh" button to manually re-fetch availability

#### Step 3 — Confirm (`/book/confirm`)
- Summary: seat label, location, start datetime, end datetime, duration, employee name, email
- "Back" preserves selection; "Confirm" creates booking

#### Success (`/book/success`)
- Booking reference ID displayed
- Options: "Book Another", "View My Bookings", "Go Home"
- Email sent asynchronously via BullMQ

---

### Admin Features

#### Location Management (`/admin/locations`)
- View all locations with seat count, active status
- **Add new location**: enter code, name, address → saved to `locations` collection
- **Deactivate location**: hides it from users; existing bookings unaffected
- **Delete location**: only if no active bookings exist

#### Seat Management (`/admin/seats/:locationCode`)
- View all seats for a location in a grid (same visual as user view)
- **Add seat(s)**: enter seat number + label + zone + amenities → saved to `seats` collection → immediately available for booking
- **Remove seat**: soft-delete (`isActive: false`) — existing bookings unaffected, seat no longer bookable
- **Block seat**: enter reason → seat marked `isBlocked: true` → excluded from availability
- **Unblock seat**: clears block
- Bulk add: enter a range (e.g. 1–50) to create seats in one action

#### User Management (`/admin/users`)
- Table: name, email, department, employee ID, primary location, allowed locations, last login, booking count, status
- **Deactivate user** (temporary): `isActive: false` → user cannot log in → all active bookings cancelled → emails sent
- **Reactivate user**: `isActive: true` → user can log in again
- **Delete user** (permanent): removes from `users` collection, cancels all active bookings, removes from OneDrive Excel
- Admin cannot deactivate or delete their own account
- **Add user manually**: admin can create an employee account (bypasses OTP, useful for bulk onboarding)
- Search/filter by name, email, location, department, status

#### Multi-Location Assignment (`/admin/user/:id/locations`)
- View user's current primary location and additional allowed locations
- Add or remove locations from their `allowedLocations` array
- Use case: a leader visiting multiple offices can have HYD + BLR + PNE assigned
- Changes take effect immediately on next login/refresh

#### Block Dates (`/admin/block-dates`)
- Date picker + location (or "ALL") + reason → block date
- On block: cancel all `active` bookings at that location on that date → enqueue cancellation emails
- List blocked dates with unblock option

#### Analytics (`/admin/analytics`)
- Per-location filter
- Daily occupancy rate (line chart, 30 days)
- Most booked seats per location (bar chart, top 10)
- Bookings by hour of day (heatmap)
- Bookings by day of week
- Cross-location comparison chart (total bookings per location)
- Date range picker; export CSV

#### Audit Log (`/admin/audit-log`)
- Chronological log of all actions (admin + system)
- Filter by action type, actor, location, date range
- Export to CSV

#### OneDrive Sync (`/admin/sync`)
- Shows last sync timestamp
- Displays sync status per location
- Manual sync trigger button
- Error log if sync fails

---

## 🔗 OneDrive Excel Integration (Microsoft Graph API)

All employee data is mirrored to a **single OneDrive Excel file** (`.xlsx`) provided by the admin.

### Setup
- Admin provides the **OneDrive share link** or **file ID** in admin settings
- App authenticates with Microsoft Graph API using **OAuth 2.0 Client Credentials** (service account — no user login needed)
- Scopes required: `Files.ReadWrite`, `Sites.ReadWrite.All`

### Excel File Structure
The Excel file has one sheet per location (tabs: `HYD`, `BLR`, `CHN`, `PNE`, `VDR`) plus a `ALL_EMPLOYEES` master sheet.

| Column | Value |
|--------|-------|
| A | Employee ID |
| B | Full Name |
| C | Email |
| D | Department |
| E | Primary Location |
| F | Allowed Locations (comma-separated) |
| G | Account Status (Active / Inactive) |
| H | Registration Date |
| I | Last Login |
| J | Total Bookings |

### Sync Triggers
| Event | Action |
|-------|--------|
| New user registers | Append row to ALL_EMPLOYEES + location tab |
| User deactivated | Update column G to "Inactive" |
| User deleted | Remove row |
| User locations updated | Update column F |
| Admin adds user manually | Append row |
| Manual sync from `/admin/sync` | Full re-sync: compare DB ↔ Excel, reconcile differences |

### Sync Strategy
- Use **BullMQ job queue** for all Excel writes (non-blocking)
- Retry failed Graph API calls up to 3 times with exponential backoff
- Log all sync events to `auditLogs` collection

---

## 📧 Email Notifications

All emails sent via **BullMQ job queue** — never block HTTP responses.
OTP emails are **high-priority queue** (sent within seconds).

| Trigger | Recipient | Subject |
|---------|-----------|---------|
| OTP — Registration | Employee | "Verify your Ascendion account — OTP inside" |
| OTP — Forgot Password | Employee | "Reset your password — OTP inside" |
| Registration complete | Employee | "Welcome to Ascendion Seat Booking" |
| Booking confirmed | Employee | "Seat booked — [Location] [Date] [Time]" |
| Booking cancelled by employee | Employee | "Booking cancelled" |
| Booking cancelled by admin | Employee | "Your booking was cancelled by admin" |
| Date blocked (auto-cancel) | All affected | "Office closed — [Location] [Date]" |
| Seat swapped by admin | Employee | "Your seat has been changed — [Location]" |
| Password changed | Employee | "Your password was changed" |
| Day-before reminder | Employee | "Reminder: seat booked tomorrow at [Location]" |
| Weekly digest (Monday 8 AM IST) | Employee | "Your bookings this week" |
| Account deactivated | Employee | "Your account has been deactivated" |
| Account reactivated | Employee | "Your account has been reactivated" |
| Location access added | Employee | "You now have access to [Location]" |

**Email templates**: HTML templates using React Email or MJML. Include Ascendion logo, brand colours.

---

## ⏰ Scheduled Jobs (BullMQ + Redis)

| Job | Schedule (IST) | Action |
|-----|---------------|--------|
| Complete past bookings | Saturday 2:00 AM | Set `status = completed` for past active bookings |
| Day-before reminder | Daily 8:00 AM | Find all tomorrow's active bookings → send reminder emails |
| Weekly digest | Monday 8:00 AM | Compile each employee's weekly bookings → send digest |
| OTP cleanup | Daily 3:00 AM | Delete expired + used OTP tokens (also handled by MongoDB TTL index) |
| OneDrive full sync | Sunday 1:00 AM | Full reconciliation between MongoDB users and Excel file |

---

## ⚡ Concurrency & Race Conditions (MongoDB)

Use **MongoDB transactions** with optimistic locking to prevent double-booking:

```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  const conflict = await Booking.findOne({
    seatId,
    locationCode,
    status: 'active',
    $or: [
      {
        startDatetime: { $lt: newEndDatetime },
        endDatetime: { $gt: new Date(newStartDatetime.getTime() - 60 * 60 * 1000) }
      }
    ]
  }).session(session);

  if (conflict) {
    await session.abortTransaction();
    return res.status(409).json({ error: 'Seat just booked — please choose another.' });
  }

  const booking = await Booking.create([bookingData], { session });
  await session.commitTransaction();
  res.status(201).json(booking[0]);
} catch (err) {
  await session.abortTransaction();
  throw err;
} finally {
  session.endSession();
}
```

- Returns **HTTP 409** if conflict detected between client check and server write
- Frontend handles 409 with toast: "That seat was just taken — please pick another"
- Socket.io emits `seat:taken` event to all users on the same seat grid

---

## 🔔 Real-Time Seat Availability (Socket.io)

```javascript
// Server — emit on every booking create/cancel
io.to(`seats:${locationCode}:${dateStr}`).emit('seat:update', {
  seatId, available: false, bookedFrom: startTime, bookedTo: endTime
});

// Client (Angular service) — join room on seat grid load
socket.emit('join:seats', { locationCode, date });
socket.on('seat:update', ({ seatId, available }) => {
  this.updateSeatState(seatId, available);
});
```

---

## 📊 API Design (Express REST)

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register + send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP, activate account |
| POST | `/api/auth/login` | Login, return cookie |
| POST | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/me` | Current user from cookie |
| POST | `/api/auth/forgot-password` | Send OTP to email |
| POST | `/api/auth/reset-password` | Verify OTP + set new password |
| POST | `/api/auth/resend-otp` | Resend OTP (rate limited) |

### Bookings
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/bookings/mine` | My active + upcoming bookings |
| GET | `/api/bookings/mine/history` | My past + cancelled bookings |
| POST | `/api/bookings` | Create booking |
| DELETE | `/api/bookings/:id` | Cancel own booking |

### Seats
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/seats/available` | `?location=&startDatetime=&endDatetime=` |

### Locations
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/locations` | All active locations |

### Admin — Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/users` | All users (paginated, filterable) |
| POST | `/api/admin/users` | Manually add user |
| PATCH | `/api/admin/users/:id/activate` | Activate user |
| PATCH | `/api/admin/users/:id/deactivate` | Deactivate user |
| DELETE | `/api/admin/users/:id` | Permanently delete user |
| PATCH | `/api/admin/users/:id/locations` | Update allowed locations |

### Admin — Seats
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/seats/:locationCode` | All seats for location |
| POST | `/api/admin/seats` | Add seat(s) |
| PATCH | `/api/admin/seats/:id/block` | Block seat |
| PATCH | `/api/admin/seats/:id/unblock` | Unblock seat |
| DELETE | `/api/admin/seats/:id` | Soft-delete seat |
| POST | `/api/admin/seats/bulk` | Bulk add seats (range) |

### Admin — Locations
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/locations` | All locations |
| POST | `/api/admin/locations` | Add location |
| PATCH | `/api/admin/locations/:id` | Update location |
| PATCH | `/api/admin/locations/:id/deactivate` | Deactivate location |

### Admin — Bookings & Dates
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/bookings` | All bookings (filters) |
| DELETE | `/api/admin/bookings/:id` | Cancel any booking |
| PATCH | `/api/admin/bookings/:id/swap` | Swap seat |
| GET | `/api/admin/blocked-dates` | List blocked dates |
| POST | `/api/admin/blocked-dates` | Block a date |
| DELETE | `/api/admin/blocked-dates/:id` | Unblock date |
| GET | `/api/admin/analytics` | Stats and chart data |
| GET | `/api/admin/audit-log` | Audit trail |
| POST | `/api/admin/sync` | Trigger OneDrive sync |
| GET | `/api/admin/sync/status` | Last sync status |

---

## 🏗️ Project Structure (MEAN Stack)

```
/
├── client/                        # Angular 17+ frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/              # Guards, interceptors, auth service
│   │   │   ├── shared/            # Reusable components, pipes, directives
│   │   │   ├── features/
│   │   │   │   ├── auth/          # login, register, otp, forgot-password
│   │   │   │   ├── booking/       # book, seats, confirm, success
│   │   │   │   ├── my-bookings/
│   │   │   │   ├── notifications/
│   │   │   │   ├── profile/
│   │   │   │   └── admin/
│   │   │   │       ├── dashboard/
│   │   │   │       ├── locations/
│   │   │   │       ├── seats/
│   │   │   │       ├── users/
│   │   │   │       ├── block-dates/
│   │   │   │       ├── analytics/
│   │   │   │       ├── audit-log/
│   │   │   │       └── sync/
│   │   │   ├── services/          # API calls, socket, auth
│   │   │   └── store/             # NgRx signals / services state
│   │   ├── assets/
│   │   └── environments/
│   └── public/
│       └── manifest.json          # PWA manifest
│
├── server/                        # Node.js + Express backend
│   ├── routes/                    # Express routers
│   ├── controllers/               # Request handlers
│   ├── middleware/                 # auth, admin, rate-limit, error
│   ├── models/                    # Mongoose schemas
│   ├── services/
│   │   ├── booking.service.js
│   │   ├── seat.service.js
│   │   ├── user.service.js
│   │   ├── otp.service.js
│   │   ├── email.service.js
│   │   └── onedrive.service.js    # MS Graph API integration
│   ├── jobs/                      # BullMQ processors
│   ├── cron/                      # Scheduled jobs
│   ├── sockets/                   # Socket.io handlers
│   ├── validations/               # Zod schemas
│   ├── config/                    # DB, Redis, Graph API config
│   └── utils/                     # Date helpers, formatters
│
└── docker-compose.yml             # Local dev: MongoDB + Redis
```

---

## 🧪 Testing Requirements

| Type | Tool | Coverage |
|------|------|----------|
| Unit tests | Jest | Booking overlap logic, OTP expiry, duration validation, cross-midnight datetime calc |
| API tests | Supertest | All REST endpoints: auth (OTP flow), booking CRUD, admin actions, Graph API mock |
| E2E tests | Playwright / Cypress | Full booking flow, OTP verification, admin seat add/remove, multi-location switching |
| Load test | k6 | 200 concurrent users booking simultaneously across 5 locations |
| Unit (Angular) | Jasmine + Karma | Components, guards, interceptors |

---

## 🎨 UI / UX Requirements

### General
- **Brand**: Ascendion brand colours (deep blue + white + accent orange/teal)
- **PWA**: `manifest.json` + service worker — employees can install on mobile home screen
- Loading skeletons on all data-fetching screens (not spinners)
- Toast notifications (top-right desktop, bottom-centre mobile)
- Empty states with actionable messages

### Mobile-Specific
- Bottom nav: Home, Book, My Bookings, Notifications
- All tap targets ≥ 44×44px
- Pull-to-refresh on My Bookings and Notifications

### Desktop-Specific
- Collapsible left sidebar
- Admin: full-width data tables with sticky headers, sortable columns
- Keyboard accessible (Tab, Enter, Escape)

### Accessibility
- ARIA labels on all interactive elements
- Visible focus rings
- WCAG AA colour contrast
- Screen-reader-friendly form validation

### Theming
- Light mode default
- Dark mode toggle (respects `prefers-color-scheme`, saved to `localStorage`)

---

## 📊 App Stats Summary

| Metric | Value |
|--------|-------|
| Locations | 5 (HYD, BLR, CHN, PNE, VDR) |
| Allowed email domains | @ascendion.com, @nitor.com (configurable) |
| OTP expiry | 10 minutes |
| Max OTP attempts | 3 |
| Time slot range | Any 24h time, 3–12 hours, cross-midnight supported |
| Buffer between bookings | 1 hour |
| Max advance booking | 15 days |
| Max active bookings / employee | 10 |
| Bookings per day / employee / location | 1 |
| Real-time updates | Socket.io |
| Employee data store | MongoDB + OneDrive Excel (synced) |
| Scheduled jobs | 5 |
| PWA | Yes |
| Dark mode | Yes |
| Audit logging | Yes |
| In-app notifications | Yes |
| Analytics | Per-location + cross-location |

---

## 🧱 Master Build Prompt

> **"Build a fully responsive PWA for Ascendion's multi-location office seat booking system using the MEAN stack (MongoDB, Express, Angular 17+, Node.js). Five locations: Hyderabad, Bangalore, Chennai, Pune, Vadodara. Only @ascendion.com and @nitor.com emails are accepted (configurable). Registration requires OTP email verification (6 digits, 10 min expiry). User's primary location is set at registration; admin assigns multi-location access for leaders. At login, the default location is the user's primary location — no re-selection needed. Admins can add or remove seats per location at any time. Bookings support 24-hour time with cross-midnight shifts (e.g. 22:00–06:00); minimum 3 hours, maximum 12 hours; 1-hour buffer between bookings. Forgot password uses OTP flow. JWT auth in httpOnly cookies. MongoDB transactions prevent race conditions. Real-time seat availability via Socket.io. Employee data synced to OneDrive Excel via Microsoft Graph API. Admin features: manage locations, seats (add/remove/block), users (activate/deactivate/delete/multi-location assign), block dates, view analytics per location, audit log, manual OneDrive sync. Email notifications via BullMQ job queue. Cron: daily reminders 8 AM IST, weekly digest Monday 8 AM IST, full OneDrive sync Sunday 1 AM IST. Zod validation, Helmet, CORS, CSRF, rate limiting. WCAG AA accessible. Dark mode. PWA manifest."**

---

## 🚀 Future Enhancements (Post V1 Backlog)

### Employee Experience
- **Interactive SVG floor map** per location — click seat on map instead of grid
- **Favourite seats** per location — one-tap rebook
- **Recurring bookings** — same seat every week for N weeks
- **Waitlist** — join queue when full; auto-notify on cancellation
- **QR code check-in** — scan at office entry to confirm presence
- **Auto-cancel no-shows** — if no QR scan within 30 min, release seat
- **Seat preferences** — tag: window, quiet zone, near exit, standing desk
- **Multi-language** — English, Hindi, Telugu, Kannada

### Admin
- **Bulk date blocking** — block a date range across all or selected locations
- **Department seat allocation** — reserve certain seats for specific teams
- **Capacity cap per day** — set max bookings per location per day
- **Parking spot booking** — extend to cover parking bays
- **Meeting room booking** — separate resource type with AV options
- **Manager approval workflow** — optional approval step before booking confirms

### Technical
- **OpenAPI / Swagger** — auto-generate docs from Express routes
- **CI/CD** — GitHub Actions: lint → test → build → deploy on push to main
- **Azure AD SSO** — sign in with Ascendion Microsoft account (replaces email/password + OTP)
- **WebSockets upgrade** — if Socket.io SSE proves insufficient at scale
- **Power BI integration** — connect MongoDB Atlas for advanced reporting
