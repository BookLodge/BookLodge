# Hotel Management App - Architecture
## TS Academy Capstone Group Project

#### *LiteAPI for Hotel Inventory, Booking, and Payment*

### 1. Scope Statement — Read This First... IMPORTANT

#### What's Real
• Hotel data (names, photos, addresses, amenities) — from LiteAPI
• Room rates and pricing — from LiteAPI for the requested dates
• Location search/autocomplete — from LiteAPI's static Places data
• Rate availability and final pricing — verified through LiteAPI Prebook
• Payment — handled through LiteAPI's User Payment / Payment SDK flow • The actual reservation — completed through LiteAPI Book

#### Our Application Owns
• User accounts and authentication
• The customer-facing booking experience
• Application-level validation and authorization
• Our local booking records and booking history
• The integration/orchestration between the frontend and LiteAPI

LiteAPI is the external hotel inventory, reservation, and payment provider. Our local Booking record tracks the customer's booking attempt and the provider's reservation identifiers; it does not itself constitute the hotel reservation.
For sandbox development, LiteAPI provides test payment/booking flows, so the team does not need to integrate Paystack or charge real customer money.

### 2. Roles

#### Guest (not logged in)
• search hotels, view hotel/room details
• can complete a booking + payment WITHOUT registering (booking tied to the email they provide at checkout)

#### Customer (registered, role: "customer")
• everything a guest can do
• bookings automatically tied to their account
• view own booking history (paginated)
• cancel own upcoming booking, subject to LiteAPI cancellation policies

#### Admin (role: "admin")
• log in (same login endpoint, different role in the JWT)
• view ALL bookings across the platform (paginated, filterable by status)
• view a single booking's full detail, including payment and provider status
• initiate cancellation through LiteAPI where permitted by the booking policy
• view all registered users
• deactivate a user (isActive: false — blocks login, same pattern as HER Bank's frozen account)


###  3. Entities / Models

#### User
 
| Field | Type/Notes | 
| -------- | -------- |
| _id |  | 
| firstName |  | 
| lastName |  | 
| email |  | 
| password | hashed | 
| phone |  | 
| role | enum ["customer", "admin"] | 
| isActive |  | 
| timestamps |  | 


#### Booking
| Field | Type/Notes | 
| -------- | -------- |
| _id |  | 
| customerId | ref: User, null if guest booking | 
| guestEmail |  | 
| guestFirstName |  | 
| guestLastName |  | 
| liteApiHotelId |  | 
| hotelName |  | 
| hotelAddress |  | 
| hotelImage |  | 
| roomType |  | 
| boardType |  | 
| checkInDate |  | 
| checkOutDate |  | 
| numberOfGuests |  | 
| pricePerNight |  | 
| totalPrice |  | 
| currency |  | 
| reference |  | 
| status | enum ["PENDING_PAYMENT", "PENDING_BOOKING", "CONFIRMED", "CANCELLED", "FAILED"] | 
| cancelledReason | String, optional | 
| liteApiPrebookId |  | 
| liteApiTransactionId |  | 
| liteApiBookingId | optional until confirmed | 
| hotelConfirmationCode | optional until confirmed | 
| paymentStatus | enum ["PENDING", "SUCCESS", "FAILED"] | 
| timestamps |  | 





optional until confirmed
enum ["PENDING", "SUCCESS", "FAILED"]
Type / Notes
     guestFirstName
       liteApiHotelId
       hotelAddress
       roomType
       checkInDate
       numberOfGuests
       totalPrice
       reference
    status
   enum ["PENDING_PAYMENT", "PENDING_BOOKING", "CONFIRMED", "CANCELLED", "FAILED"]
   cancelledReason String, optional
       liteApiTransactionId
       hotelConfirmationCode optional until confirmed
       timestamps
   

### 4. Standard API Response Format — Apply This Everywhere

The capstone spec requires one consistent response shape across the whole app. Every controller, every endpoint, no exceptions:

#### SUCCESS
```js
{
    "success": true,
    "message": "Booking created successfully",
    "data": { "bookingId": "...", "reference": "HB-20261001-A1B2", "totalPrice": 145000 }
}
```

#### ERROR
```js
{
    "success": false,
    "message": "Invalid check-in date",
    "data": null
}
```

**Rule for the team:** build one tiny helper and use it in every controller instead of hand-writing `res.json({...})` each time, so nobody drifts from the shape:

```js
    utils/apiResponse.js
        sendSuccess(res, statusCode, message, data)
        sendError(res, statusCode, message)

```

This also directly satisfies the spec's error-handling requirement — your centralized `errorHandler.js` should output through the same `sendError` shape, so a crash never leaks `AxiosError` , a raw stack trace, or `undefined` to the frontend. The frontend only ever needs to check `response.success` and read `response.message` for the user-facing text — one pattern, every screen.


### 5. Authorized LiteAPI Service Integrations
**• Permitted Endpoints & Operations:** Static Places/Cities data, Hotel List, Hotel Details, room rate retrieval, Prebook verification, Book execution, Booking retrieval, and Booking cancellation.
**• Payment Processing:** Integration with the LiteAPI User Payment / Payment SDK within the sandbox environment for development purposes.
**• Prohibited Integrations:** Voucher and loyalty-related endpoints are excluded from the current implementation scope unless additional requirements are formally introduced.


### 6. Complete Customer Journey
#### Step 1 — Search
`GET /api/hotels/search?`
`city=Lagos&checkIn=2026-10-01&checkOut=2026-10-05&guests=2&page=1&limit=10`
Calls LiteAPI Hotel List + rates, returns a clean paginated list

#### Step 2 — View Hotel
`GET /api/hotels/:liteApiHotelId?checkIn=...&checkOut=...&guests=...`

#### Step 3 — Select Room / Rate
Frontend keeps the selected LiteAPI offerId and required guest details.

#### Step 4 — Prebook / Create Checkout Session
 `POST /api/bookings/prebook`
Backend sends the selected offerId to LiteAPI Prebook. LiteAPI verifies availability and final pricing and returns a prebookId and transactionId (plus the payment SDK secret when User Payment is enabled). The backend creates a local booking record with PENDING_PAYMENT.

#### Step 5 — Customer Pays
Frontend opens LiteAPI's Payment SDK using the prebook response. Customer completes payment using the sandbox test payment flow. No Paystack integration is required.

#### Step 6 — Finalize Booking
 `POST /api/bookings/:id/confirm`
Backend sends the prebookId, LiteAPI transactionId, holder and guest details to LiteAPI Book. On success, store the LiteAPI booking ID and hotel confirmation code and mark the local Booking CONFIRMED.

#### Step 7 — Confirmation
Return the confirmed reservation to the customer and send a confirmation email. The local booking record and LiteAPI booking remain linked by provider IDs.

#### Step 8 — View / Cancel
• `GET /api/bookings/my-bookings?page=1&limit=10` — logged in, own only 
• `GET /api/bookings/lookup?reference=&email=` — guest
• `PATCH /api/bookings/:id/cancel` — owner or admin; calls LiteAPI


LiteAPI documents the recommended hotel flow as Search → Rate Results → Hotel/Room Selection → Prebook → Payment → Book → Confirmation. Prebook verifies availability and final pricing, while Book creates the confirmed reservation. The User Payment SDK can handle the customer payment flow in the sandbox.


### 7. Folder Structure
```text
backend/
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   └── Booking.js
│   │
│   ├── schemas/
│   │   ├── authSchema.js
│   │   └── bookingSchema.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── hotelSearchController.js
│   │   ├── bookingController.js
│   │   └── adminController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── hotelRoutes.js
│   │   ├── bookingRoutes.js
│   │   └── adminRoutes.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── softAuth.js
│   │   ├── adminOnly.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   │
│   ├── services/
│   │   ├── liteApiService.js
│   │   └── emailService.js
│   │
│   ├── utils/
│   │   ├── generateRef.js
│   │   └── apiResponse.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
│   ├── auth.test.js
│   └── booking.test.js
│
├── .env
├── .env.example
├── .gitignore
└── package.json


### 8. API Documentation Table
Format required by the capstone spec

| EndPoint | Method | Purpose | Auth | Request Body | Success Response | Error Response |
| -------- | ------ | ------- | ---- | ------------ | ---------------- | -------------- |
| `/api/auth/register` | POST | Create account | None | `{firstName, lastName, email, password, confirmPassword,phone}` | `201 {success: true, data: :{userId}}` | `404 {success: false, message: "Email already exists"}` |
| `/api/auth/login` | POST | Authenticate | None | `{email,password}` | `200 {success: true, data: :{token,user}}` | `404 {success: false, message: "Invalid email or password"}` |
| `/api/hotels/places` | GET | Location autocomplete | None | Query: query | `200 {success: true, data: {...}}` | `404 {success: false, message: "Query too short"}` |
| `/api/hotels/search` | GET | Search hotels | None | Query: city, checkIn, checkOut, guests, page,limit | `200 {success: true, data: :{hotels,total,page}}` | `502 {success: false, message: "Unable to reach hotel provider"}` |
| `/api/hotels/:id` | GET | Hotel detail + rooms | None | Query: checkIn,checkOut,guests | `200 {success: true, data: :{hotel,rooms}}` | `404 {success: false, message: "Hotel not found"}` |
| `/api/bookings/prebook` | POST | Verify selected LiteAPI rate and create local booking attempt | Soft | `{offerId,guestDetails,...}` | `200 {success: true, data: :{bookingId, prebookId, transactionId, paymentSecretKey}}` | `400/502 {success: false, message: "Unable to prebook selected rate"}` |
| `/api/bookings/:id/confirm` | POST | Finalize reservation through LiteAPI Book | Soft | `{holder,guests}` | `200 {success: true, data: :{booking}}` | `400/502 {success: false, message: "Unable to confirm hotel booking"}` |
| `/api/bookings/my-bookings` | GET | Own booking history | Required | Query: page,limit | `200 {success: true, data: :{bookings,total}}` | `401 {success: false, message: "Not authenticated"}` |
| `/api/bookings/lookup` | GET | Guest booking lookup | None | Query: reference,email | `200 {success: true, data: :{booking}}` | `404 {success: false, message: "Booking not found"}` |
| `/api/bookings/:id/cancel` | PATCH | Cancel a confirmed booking through LiteAPI | Soft/Admin | `{reason?}` | `200 {success: true, data: :{booking}}` | `403/502 {success: false, message: "Unable to cancel booking"}` |
| `/api/admin/bookings` | GET | All bookings | Admin | Query: page,limit,status | `200 {success: true, data: :{bookings,total}}` | `403 {success: false, message: "Admins only"}` |
| `/api/admin/users` | GET | All users | Admin | Query: page,limit | `200 {success: true, data: :{users, total}}` | `403 {success: false, message: "Admins only"}` |
| `/api/admin/users/:id/deactivate` | PATCH | Deactivate a user | Admin | -- | `200 {success: true, data: :{user}}` | `404 {success: false, message: "User not found"}` |

We will expand this table as we build — this exact table, kept current, satisfies the capstone's API documentation requirement after I read through it.


### 9. Security Rules
**1. customerId on Booking —** from req.user.userId when logged in, never from body. *IMPORTANT: never get customerId from req.body — this leads to IDOR because you are trusting user input.*
**2. Guest ownership —** reference + email together, never reference alone: this prevents IDOR.
  8

**3. totalPrice always recalculated server-side:** if the server trusts whatever totalPrice the frontend sends, a user can open dev tools or Postman and submit totalPrice: 1 for a ₦145,000 room.
4. LiteAPI payment and booking responses are validated before changing local booking state.
5. Booking only becomes CONFIRMED after LiteAPI returns a successful Book response, never optimistically.
6. Store LiteAPI prebookId and transactionId together; they are required to finalize the same.
9