
# Full Documentation — FormBuilder (Startup-grade)
*Complete, developer-ready documentation for your React + Node.js + MongoDB full-stack form builder with referrals, Cashfree payments, Cloudinary media, and Firebase Google Sign-In.*

---

## Table of Contents
1. Project overview  
2. Tech stack & hosting  
3. High-level architecture diagram (text)  
4. Data model (MongoDB collections & schemas)  
5. Backend structure (folders, controllers, middleware)  
6. API specification (endpoints, request/response examples)  
7. Auth flow (Firebase tokens + backend verification)  
8. Referral & payment flow (detailed)  
9. Cloudinary image flow (upload + storage)  
10. Cashfree integration & webhook handler (sample code)  
11. Frontend structure & components (CreateForm, FillForm, Admin)  
12. Dev setup — environment variables & local run steps  
13. CI/CD & deployment (Render backend + Vercel frontend)  
14. Security best practices & monitoring  
15. Testing strategy (unit, integration, E2E)  
16. Backups & maintenance plan  
17. Roadmap & prioritized sprint/issue list  
18. Useful snippets & appendices (sample models, middleware, curl tests)

---
# 1. Project overview
A SaaS-style form builder where creators build forms (with geofence/domain restrictions and file/camera inputs), users fill forms, payments enable subscriptions, and promoters (YouTubers) get referral credit for paid signups. Backend: Node.js + Express; DB: MongoDB Atlas; Auth: Firebase Authentication (Google Sign-In); File storage: Cloudinary; Payments: Cashfree; Hosting: Render (backend) + Vercel (frontend).

Goal: Launch an MVP (Option 2 model — creators can be promoters) and scale later.

---
# 2. Tech stack & hosting

- Frontend: React (Vite or CRA) + Tailwind CSS + Axios  
- Backend: Node.js (v18+) + Express  
- Database: MongoDB Atlas (single database, multiple collections)  
- Auth: Firebase Authentication (Google Sign-In) — verify ID tokens in backend  
- Storage (images/files): Cloudinary (recommended)  
- Payments: Cashfree (webhooks for payment success)  
- Hosting:  
  - Backend: Render (automatic deploys from GitHub)  
  - Frontend: Vercel or Firebase Hosting  
- Misc: Nodemailer (email), Winston/Sentry (logging / errors), Jest + Supertest (tests), Cypress (E2E)

---
# 3. High-level architecture (text)
```
[Browser/Client]
  ├─ React frontend (Vercel)
  │    - Auth via Firebase (client SDK)
  │    - Calls backend REST API (Render) for forms, submissions, admin actions
  │    - Uploads images to Cloudinary (direct or via signed URL)
  │
[Backend - Express (Render)]
  ├─ Verifies Firebase ID tokens
  ├─ Connects to MongoDB Atlas
  ├─ Handles: forms, responses, referral logic, webhook processing (Cashfree), payments DB
  ├─ Sends emails via Nodemailer/SendGrid
  └─ Integrates Cloudinary Admin APIs (if needed)
[MongoDB Atlas]  (collections: users, forms, responses, subscriptions, referrals, payments)
[Cashfree] <-> [Backend Webhook]
[Cloudinary] <-> [Backend] & [Frontend]
```

---
# 4. Data model (MongoDB)

### `users`
```js
{
  _id: ObjectId,
  name: String,
  email: { type: String, unique: true },
  googleId: String,          // for Google sign-in
  passwordHash: String,      // optional if supporting email/password later
  role: { type: String, enum: ["user","creator","admin"], default: "user" },
  referralCode: { type: String, unique: true }, // auto-generated
  referredBy: String | null, // referralCode of the referrer
  totalReferrals: { type: Number, default: 0 },
  paidReferrals: { type: Number, default: 0 },
  isPaidUser: { type: Boolean, default: false },
  createdAt: Date,
  updatedAt: Date
}
```

### `forms`
```js
{
  _id: ObjectId,
  ownerId: ObjectId, // users._id
  title: String,
  description: String,
  fields: [ { id, label, type, options, required, validation } ],
  emailDomainWhitelist: [String], // optional
  geofence: { type: "Polygon", coordinates: [[lng,lat], ...] } || null,
  settings: { allowEmbeds: Boolean, maxFileSizeMB: Number, allowedFileTypes: [String] },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### `responses`
```js
{
  _id: ObjectId,
  formId: ObjectId,
  answers: [ { fieldId, value, fileUrls? } ],
  submitter: { userId: ObjectId | null, name, email },
  location: { lat: Number, lng: Number } | null,
  attachments: [ { fileName, url, cloudinaryPublicId } ],
  createdAt: Date
}
```

### `subscriptions` / `payments`
```js
{
  _id: ObjectId,
  userId: ObjectId,
  plan: String,
  amount: Number,
  currency: String,
  status: { type: String, enum: ["pending","success","failed"] },
  gateway: String, // "cashfree"
  transactionId: String,
  startedAt: Date,
  expiresAt: Date,
  referralCodeUsed: String | null
}
```

### `referrals`
```js
{
  _id: ObjectId,
  promoterId: ObjectId,
  referralCode: String,
  referredUserIds: [ObjectId],
  totalPaidUsers: Number,
  totalEarnings: Number,
  lastUpdated: Date
}
```

Indexes: create indexes on `users.email`, `users.referralCode`, `forms.ownerId`, `responses.formId`, `subscriptions.userId`, and any fields used for queries/filters.

---
# 5. Backend structure (recommended folder layout)
```
backend/
├─ src/
│  ├─ controllers/
│  │   ├─ authController.js
│  │   ├─ formController.js
│  │   ├─ responseController.js
│  │   ├─ subscriptionController.js
│  │   └─ referralController.js
│  ├─ models/
│  │   ├─ User.js
│  │   ├─ Form.js
│  │   ├─ Response.js
│  │   ├─ Subscription.js
│  │   └─ Referral.js
│  ├─ routes/
│  │   ├─ authRoutes.js
│  │   ├─ formRoutes.js
│  │   ├─ responseRoutes.js
│  │   ├─ subscriptionRoutes.js
│  │   └─ referralRoutes.js
│  ├─ middlewares/
│  │   ├─ verifyFirebaseToken.js
│  │   ├─ authMiddleware.js
│  │   └─ errorHandler.js
│  ├─ utils/
│  │   ├─ cashfree.js
│  │   └─ cloudinary.js
│  ├─ services/
│  │   ├─ emailService.js
│  │   └─ referralService.js
│  ├─ config/
│  │   └─ db.js
│  └─ app.js
├─ .env
├─ package.json
└─ server.js
```

---
# 6. API specification (core endpoints)

> All APIs prefixed with `/api/v1`

### Auth
- `POST /api/v1/auth/firebase-login`  
  - Body: `{ idToken }` (Firebase ID token from client)  
  - Action: Verify token, create or return user record, return app JWT/session cookie.  
  - Response: `{ token, user }`

### Users
- `GET /api/v1/users/me`  
  - Auth required. Returns current user.

### Forms
- `POST /api/v1/forms` — create form (auth)  
- `GET /api/v1/forms/:id` — read form schema (public if published)  
- `PUT /api/v1/forms/:id` — update form (owner only)  
- `DELETE /api/v1/forms/:id` — delete (owner/admin)  
- `GET /api/v1/forms/:id/embed` — embeddable snippet/meta

### Responses
- `POST /api/v1/forms/:id/responses` — submit response  
  - Body: `{ answers, location?, attachments? }`  
  - Server validates geofence, domain, field-level validation
- `GET /api/v1/forms/:id/responses` — admin/owner: list with filters & pagination  
- `GET /api/v1/forms/:id/responses/:rid` — detail

### Subscriptions / Payments
- `POST /api/v1/payments/create-session` — start payment (returns gateway parameters / redirect URL)  
  - Body: `{ userId, plan, amount, referralCode? }`
- `POST /api/v1/payments/webhook/cashfree` — Cashfree webhook endpoint (public URL)  
  - Server verifies signature and updates subscription status; if success, mark `isPaidUser` and update referral counts

### Referrals
- `GET /api/v1/referrals/:referralCode` — public stats on a referrer  
- `GET /api/v1/users/:id/referrals` — owner or promoter: list of referred users

### Files
- `POST /api/v1/uploads/sign` — (optional) sign an upload or provide Cloudinary credentials for direct uploads  
- Or allow client to call Cloudinary upload directly with unsigned preset if acceptable

---
# 7. Auth flow (Firebase + backend verification)

1. Client uses Firebase JS SDK for Google Sign-In. Client receives `idToken` from Firebase.  
2. Client sends `idToken` to backend `POST /auth/firebase-login`.  
3. Backend verifies `idToken` using Firebase Admin SDK: `admin.auth().verifyIdToken(idToken)`.  
4. If valid, backend upserts user record in `users` collection (create referralCode if new).  
5. Backend creates a local session JWT (optional) or returns user object + allow client to keep using idToken for protected calls which backend verifies on each request.  
6. Protected endpoints use middleware `verifyFirebaseToken` which decodes token and attaches `req.user`.

**Sample middleware (simplified):**
```js
// verifyFirebaseToken.js
const admin = require('firebase-admin');
module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const idToken = authHeader.split(' ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded; // contains uid, email, name
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---
# 8. Referral & payment flow (detailed)

### When someone clicks a referral link
- Frontend reads `?ref=CODE` query param, stores `ref=CODE` in `localStorage` (or cookie) with expiry (e.g., 30 days).

### Signup/Payment
- When user signs up / pays, include `ref` value in the payload (if present).
- For paid-only tracking: on `payments/webhook/cashfree`, when a payment has `SUCCESS` status:
  - Get `userId` from subscription or the payment payload mapping.
  - If the user has `referredBy` or `referralCodeUsed` is present, find the promoter's `users` doc:
    - Increment `totalReferrals` if not counted previously (be idempotent).
    - Increment `paidReferrals`.
    - Update or create a `referrals` document for promoter (push referred userId if not present).
  - Optionally compute commission (e.g., 10% of amount) and add to promoter's `totalEarnings`.

### Idempotency
- Webhook processing must be idempotent: store `transactionId` in `payments` collection and skip duplicates.

---
# 9. Cloudinary image flow

Two common patterns:

### Option A — Direct client upload (recommended)
- Frontend obtains a signed upload preset or uses Cloudinary unsigned upload preset (configure preset with security).
- Client uploads image directly to Cloudinary, receives `public_id` and URL.
- Client submits the `public_id`/URL to backend as part of the response.

Pros: offloads bandwidth to Cloudinary; faster uploads.

### Option B — Backend proxy upload
- Client sends file to backend.
- Backend uploads to Cloudinary using admin API and returns URL.

Pros: more secure (no client keys), but backend bandwidth & complexity increases.

**Cloudinary integration helper (Node):**
```js
const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name, api_key, api_secret });

async function uploadBuffer(buffer) {
  return cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (err, result) => {
    /*...*/
  });
}
```

---
# 10. Cashfree payment integration & webhook (sample)

### Create payment session (server-side)
- Use Cashfree SDK or REST call to generate an order/payment link, passing:
  - amount, customer details, return URL, webhook URL, and `notes` object including `userId` and `referralCode`.

### Webhook endpoint (Express sample)
```js
// routes/paymentRoutes.js
router.post('/webhook/cashfree', async (req, res) => {
  // Cashfree sends a POST body – verify signature if provided
  const { order_id, reference_id, txStatus, customer_id, amount } = req.body;
  // idempotency: Check if payment with reference_id already handled
  const existing = await Payment.findOne({ transactionId: reference_id });
  if (existing) return res.status(200).send('OK'); // already processed

  // Save payment record
  const payment = await Payment.create({
    userId: someMapping(customer_id) || req.body.notes.userId,
    amount,
    status: txStatus === 'SUCCESS' ? 'success' : 'failed',
    paymentGateway: 'cashfree',
    transactionId: reference_id
  });

  if (txStatus === 'SUCCESS') {
    // Update subscription, mark isPaidUser etc.
    await User.findByIdAndUpdate(payment.userId, { isPaidUser: true, $inc: { paidReferrals: 0 } });
    // Process referral: if user.referredBy then increment promoter counts
    await referralService.processPaidReferral(payment.userId, req.body.notes?.referralCode);
  }
  res.status(200).send('OK');
});
```

**Important:** verify Cashfree signature for security. Follow Cashfree docs for exact header verification steps.

---
# 11. Frontend structure & key components

```
frontend/
├─ src/
│  ├─ components/
│  │   ├─ CreateForm.jsx
│  │   ├─ FieldEditor.jsx
│  │   ├─ FormPreview.jsx
│  │   ├─ FillForm.jsx
│  │   ├─ CameraCapture.jsx
│  │   ├─ AdminDashboard.jsx
│  │   └─ ReferralWidget.jsx
│  ├─ pages/
│  │   ├─ /forms/new
│  │   ├─ /forms/[id]/fill
│  │   ├─ /dashboard
│  │   └─ /promoter (tab inside dashboard)
│  ├─ services/
│  │   ├─ api.js (Axios instance)
│  │   └─ auth.js (Firebase client helper)
│  └─ utils/
```

### Key behaviors
- On visiting `/?ref=CODE`, store in `localStorage.referral = CODE`.
- `CreateForm` builds a JSON schema and POSTs `/api/v1/forms`.
- `FillForm` renders schema, validates fields, handles file upload to Cloudinary, and POSTs response to `/api/v1/forms/:id/responses`.
- `AdminDashboard` fetches forms/responses and allows export (CSV/XLSX) via a `/export` endpoint or client-side XLSX library.

---
# 12. Dev setup — env vars & local run

### Backend `.env` sample
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/formbuilder_db
FIREBASE_PROJECT_ID=<project-id>
FIREBASE_CLIENT_EMAIL=<...>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CASHFREE_APP_ID=...
CASHFREE_SECRET=...
JWT_SECRET=some_secret_if_you_create_local_jwt
FRONTEND_URL=https://your-frontend.vercel.app
```

### Local run steps (backend)
```bash
# prerequisites
node --version (>=18), yarn or npm

# clone
git clone <repo>
cd backend
npm install

# create .env
# run
npm run dev  # uses nodemon to run src/server.js
```

### Local run steps (frontend)
```bash
cd frontend
npm install
# provide firebase config env and CLOUDINARY preset key if direct client uploads used
npm run dev
```

---
# 13. CI/CD & deployment

### Backend → Render
- Connect GitHub repo to Render.
- Create a service: `Web Service` with branch `main` (auto-deploy).
- Set environment variables in Render dashboard (do NOT check env into repo).
- Add healthcheck endpoint `/healthz`.

### Frontend → Vercel
- Connect frontend repo to Vercel.
- Auto-deploy on push to `main`.
- Set environment vars in Vercel dashboard (Firebase config, Cloudinary preset, API base URL).

### GitHub Actions (optional)
- Run `lint`, `test`, and `build` on pull requests.
- Example step:
```yaml
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

---
# 14. Security best practices

- **Secrets & envs**: keep API keys in Render/Vercel env config — never commit `.env`.
- **HTTPS**: ensure all endpoints are only served over HTTPS.
- **Webhook verification**: validate Cashfree signature and verify payload contents.
- **ID token verification**: always verify Firebase ID tokens on backend.
- **Rate limiting**: add rate limiter (e.g., `express-rate-limit`) to protect public endpoints.
- **CORS**: restrict allowed origins to your frontend domain(s).
- **File validation**: verify file types & size, scan or validate file content.
- **Database validation**: sanitize inputs and validate schema before saving.
- **Backups**: enable MongoDB Atlas automated backups / point-in-time recovery.

---
# 15. Testing strategy

- **Unit tests**: Jest for controllers and utility functions (referralService, geofence checks, validation).
- **Integration tests**: Supertest for API routes (mock Firebase verification or use test Firebase project).
- **E2E tests**: Cypress for flows: create form → fill form → upload file → payment flow (mock).
- **CI**: run tests in GitHub Actions before merging.

---
# 16. Backups & maintenance

- Use MongoDB Atlas automated backups (daily snapshots + point-in-time backup if available).
- Periodic export of referral/payment CSV for accounting.
- Logging retention: keep 90 days of logs (Sentry/Cloud Logging).
- Monthly dependency updates & security auditing (npm audit).

---
# 17. Roadmap & prioritized sprints (MVP → v2)

### MVP (must-have)
1. Auth (Firebase), user model, referral code generation  
2. CreateForm UI & save to DB  
3. FillForm UI, response save, geofence check  
4. Cloudinary upload integration  
5. Admin panel: view responses, export CSV  
6. Cashfree integration + webhook to mark paid users and update referral counts  
7. Deploy backend to Render, frontend to Vercel  
8. Basic monitoring & tests

### v1+ (soon after MVP)
- Email notifications on submission (Nodemailer / SendGrid)  
- Google Sheets export & webhook triggers  
- Theming & embeddable iframe  
- Undo/Redo map drawing

### v2
- Payments subscriptions UI & billing management  
- Referral promoter dashboard & auto payout integration  
- Conditional logic in forms & multi-page flow  
- PWA / offline form filling

---
# 18. Useful snippets & appendices

### Generate referral code (example)
```js
const nanoid = require('nanoid').nanoid;
function generateReferralCode(name) {
  const base = name?.split(' ')[0].toLowerCase().replace(/\W/g,'') || 'user';
  return `${base}_${nanoid(6)}`;
}
```

### Sample `referralService.processPaidReferral`
```js
async function processPaidReferral(userId, referralCode) {
  if (!referralCode) return;
  const promoter = await User.findOne({ referralCode });
  if (!promoter) return;
  // avoid duplicate
  const alreadyReferred = await Referral.findOne({ promoterId: promoter._id, referredUserIds: userId });
  if (alreadyReferred) return;
  await Referral.updateOne(
    { promoterId: promoter._id },
    { $addToSet: { referredUserIds: userId }, $inc: { totalPaidUsers: 1 } },
    { upsert: true }
  );
  await User.findByIdAndUpdate(promoter._id, { $inc: { paidReferrals: 1 } });
}
```

### Sample export CSV (Admin)
- Frontend fetch `/api/v1/forms/:id/responses/export?format=csv`
- Backend generate CSV via `json2csv` or `xlsx` and return `Content-Disposition` header for download.

### Example Cashfree webhook test (curl)
```bash
curl -X POST https://yourbackend.onrender.com/api/v1/payments/webhook/cashfree \
  -H "Content-Type: application/json" \
  -d '{
    "order_id":"order_123",
    "reference_id":"tx_abc",
    "txStatus":"SUCCESS",
    "orderAmount":"100.00",
    "customer_id":"user_123",
    "notes": {"userId":"60f6...","referralCode":"adarsh123"}
  }'
```

---
## Final notes & next immediate actions I can perform (pick one)
Tell me which of these you want done *now* — I’ll generate it immediately:

1. Create starter backend repo skeleton (Express app, models, example routes, middleware).  
2. Generate `CreateForm.jsx` and `FillForm.jsx` starter components (React + Tailwind) wired to sample API endpoints.  
3. Provide full `server.js` + `verifyFirebaseToken` middleware + webhook sample for Cashfree (ready-to-run).  
4. Generate GitHub Actions CI workflow for tests and deploy hints for Render/Vercel.  
5. Create admin CSV/XLSX export endpoint implementation (Node + json2csv/XLSX).

---
