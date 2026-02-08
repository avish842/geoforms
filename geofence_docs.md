# Full-Stack Form Builder — Project Documentation

> Documentation generated from our last planning conversation. Includes prioritized MVP, sprint plan, DB schema, API design, auth & security flows, and deployment checklist.

---

## Table of Contents
1. Project Summary
2. Prioritized Feature List
   - MVP (must-have)
   - Important (v1+)
   - Nice-to-have (v2)
3. 8-Sprint Development Plan
   - Sprint-by-sprint tasks & deliverables
4. Data Model (Firestore-friendly)
   - Collections and example documents
5. API Endpoints (RESTful)
6. Auth & Security Flows
7. Dev & Deployment Checklist
8. Next Immediate Actions (pick one)
9. Appendix: Key File Paths & Libraries

---

## 1. Project Summary

Build a full-stack, Google Forms–like web application with advanced features such as geofence-based submissions, domain restrictions, file & camera uploads, admin dashboard with exports, and future monetization (subscriptions/payments). The MVP focuses on core form creation, submission, authentication, geofencing, storage, and admin functionality.


## 2. Prioritized Feature List

### MVP (must-have for initial launch)
- Form creation UI (text, radio, checkbox, select, number, date, file field).
- Save / publish / unpublish forms.
- Fill form UI + preview + basic validation (required, regex).
- Google sign-in authentication (connect to user profile).
- Persist forms and responses to Firestore (or chosen DB).
- Admin dashboard: view responses, filter, sort, expand one response.
- Location-based geofence drawing & submission validation (`isPointInPolygon`).
- File upload (images/docs) saved to Firebase Storage (or S3).
- Export responses to CSV / Excel.
- Embeddable public form link (iframe).
- Basic UX guards (inactive form banner, domain restriction check).
- Basic telemetry/logging.

### Important (v1+ soon after MVP)
- Mobile number validation (regex + optional OTP flow).
- Email-domain restriction (configurable per form).
- Undo/redo for drawing.
- Webhook trigger on submission (simple HTTP POST).
- Submission confirmation email to owner and submitter.
- Google Sheets export (create new / push to existing).
- Theming: add logo + primary colors per account.

### Nice-to-have (v2)
- Payments & subscriptions (Razorpay/Stripe), plan enforcement.
- Referral program and credits.
- Conditional logic / branching in forms.
- PDF generation per submission.
- Analytics dashboards & charts.
- Multi-page forms & save/resume.
- PWA/offline fill & sync.
- Audit logs & role admin console.


## 3. 8-Sprint Development Plan

> Each sprint is a focused set of issues/deliverables. Treat these as modular GitHub issues or Jira tickets.

### Sprint 1 — Project setup + Auth + Basic DB
- Repo init (Next.js or React + Vite). Monorepo notes optional.
- Install core libs: React, Tailwind, Firebase SDK, @vis.gl/react-google-maps, XLSX, Axios.
- Setup Firebase project (Auth, Firestore, Storage) and environment configs.
- Implement Google Sign-In and persist user in `users` collection.
- Protect routes with auth guard.

**Deliverable:** working sign-in and DB user entry.

---

### Sprint 2 — Form builder core
- `CreateForm` component: add/delete fields, edit labels/options, reorder.
- Save form draft to `forms` collection in Firestore.
- Preview mode and field validation metadata.

**Deliverable:** create & save form draft.

---

### Sprint 3 — Fill form + submissions
- `FillForm` renders form JSON schema, client-side validation.
- `handleSubmit` to store responses in `responses` collection with metadata.
- Confirmation UI after submit.

**Deliverable:** submit form and store response.

---

### Sprint 4 — Admin dashboard + exports
- `AdminPage`: list forms & responses, filter & search, pagination.
- Export responses to CSV and .xlsx (XLSX utils + Blob).
- Response detail view.

**Deliverable:** admin can view and export responses.

---

### Sprint 5 — Maps / Geofence
- Integrate Maps component for form creation (drawing tools).
- Save polygon coordinates in `forms.geofence`.
- Implement `isPointInPolygon` check in `FillForm` using `navigator.geolocation`.
- Undo/redo snapshot handling for drawings.

**Deliverable:** geofence draw/persist/enforce.

---

### Sprint 6 — File uploads & camera + domain restriction
- File upload UI in `FillForm`, store to Firebase Storage (or S3).
- Camera capture via `getUserMedia` for image fields.
- Enforce email-domain restrictions at fill-time.

**Deliverable:** file upload + camera capture + domain check.

---

### Sprint 7 — Notifications, webhooks & Google Sheets
- Send confirmation email on submit (SendGrid or SMTP).
- Webhook trigger sending submission payload to configured endpoints.
- Google Sheets integration (service account or OAuth) to push submissions.

**Deliverable:** basic automation hooks.

---

### Sprint 8 — Polish, tests & deployment
- End-to-end tests (Cypress / Playwright) for key flows (create → fill → admin export).
- Monitoring (Sentry) and basic uptime checks.
- CI/CD (GitHub Actions) deploy to Vercel / Firebase Hosting.
- README, FEATURES.md, CONTRIBUTING docs.

**Deliverable:** production-ready deployment and docs.


## 4. Data Model (Firestore-friendly)

> Example collection shapes for Firestore (denormalized).

### `users/{userId}`
```json
{
  "displayName": "Adarsh Vishwakarma",
  "email": "itsw@gmail.com",
  "photoURL": "...",
  "role": "creator",
  "org": "Nit Kurukshetra",
  "plan": "free",
  "createdAt": "<timestamp>"
}
```

---

### `forms/{formId}`
```json
{
  "title": "Workshop Registration",
  "description": "Form description",
  "ownerId": "userId",
  "isPublished": true,
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>",
  "fields": [
    { "id":"f1","type":"text","label":"Name","required":true },
    { "id":"f2","type":"email","label":"College Email","required":true}
  ],
  "geofence": {
    "type": "polygon",
    "coordinates": [[lat,lng],[lat,lng],...]
  },
  "emailDomainWhitelist": ["nitkkr.ac.in"],
  "settings": {
    "allowEmbeds": true,
    "maxFileSizeMB": 10,
    "allowedFileTypes": ["image/png","application/pdf"]
  }
}
```

---

### `responses/{responseId}`
```json
{
  "formId": "formId",
  "answers": { "f1": "Adarsh","f2": "itsw@gmail.com" },
  "ownerId": "userId",
  "submitter": { "email":"itsw@gmail.com", "name":"Adarsh", "userId":"userId" },
  "createdAt": "<timestamp>",
  "location": { "lat": 28.0, "lng": 76.0 },
  "attachments": [ { "fileName":"id.jpg", "storagePath":"forms/formId/attachments/..." } ],
  "ip": "1.2.3.4"
}
```

---

### `subscriptions/{subId}` (billing)
```json
{
  "ownerId": "userId",
  "plan": "basic",
  "status": "active",
  "startedAt": "<timestamp>",
  "expiresAt": "<timestamp>"
}
```

---

### `webhooks/{formId}/triggers`
- store endpoints, method, headers and secret tokens for webhook firing on submission.


## 5. API Endpoints (RESTful)

> If using Firebase as serverless, many calls will be client SDK-driven. Below are serverful endpoints if you add a backend layer.

### Auth
- `GET /api/auth/me` — get user profile.
- `POST /api/auth/logout` — sign-out (optional).

### Forms
- `POST /api/forms` — create form.
- `GET /api/forms/:id` — read form.
- `PUT /api/forms/:id` — update form.
- `DELETE /api/forms/:id` — delete form.
- `GET /api/forms/:id/embed` — embeddable snippet.

### Responses
- `POST /api/forms/:id/responses` — submit response.
- `GET /api/forms/:id/responses` — admin list with pagination & filters.
- `GET /api/forms/:id/responses/:rid` — single response.
- `GET /api/forms/:id/responses/export?format=csv|xlsx` — export.

### Files
- `POST /api/forms/:id/attachments` — signed upload URL (S3) or direct upload helper.
- `GET /api/files/:path` — serve file via signed URL.

### Maps
- `POST /api/forms/:id/geofence` — save polygon.

### Billing
- `POST /api/billing/create-session` — checkout.
- `POST /api/billing/webhook` — handle gateway events.

### Admin
- `GET /api/admin/users` — list users.
- `PUT /api/admin/users/:id` — update role/plan.


## 6. Auth & Security Flows

- Use **Firebase Auth (Google OAuth)** for MVP. Verify ID tokens for backend endpoints.
- **Role-based access control**: `users.role` controls create/edit/export privileges.
- **Server-side validation** for submissions: validate answers shape vs form schema.
- **Geofence enforcement server-side**: do not rely purely on client coordinates.
- **File upload security**: use signed URLs or Firebase Storage rules to restrict writes.
- **Secret management**: store API keys and service accounts in env vars or secret manager.
- **HTTPS & CSP** for front-end delivery.


## 7. Dev & Deployment Checklist

- Create Firebase projects for dev / staging / prod; configure separate environments.
- Firestore security rules to restrict reads/writes by auth & role.
- GitHub repo with branch protections and GitHub Actions for CI:
  - Lint, unit tests, build.
  - Deploy on merge to `main` (production) via Vercel / Firebase Hosting.
- Error monitoring (Sentry) and uptime checks (UptimeRobot).
- Backups / export routine for Firestore (scheduled exports if needed).
- README, CONTRIBUTING, CODESTYLE, and FEATURES.md in repo.


## 8. Next Immediate Actions (pick one I will do now)
1. Generate a full **OpenAPI / Postman** spec for the endpoints.
2. Create **GitHub issue templates** and convert the sprint tasks into ready-to-use issues.
3. Produce **Firestore security rules** and recommended indexes for the schema.
4. Generate **CreateForm.jsx** and **FillForm.jsx** starter components (React + Tailwind) with a sample form schema.
5. Produce a **detailed billing/subscription data model & webhook flow** for Stripe/Razorpay.

> Recommended first pick: **#4** (starter components) to begin implementation immediately.


## 9. Appendix: Key File Paths & Libraries

Suggested project files and libraries to include:

```
src/
├── components/
│   ├── CreateForm.jsx
│   ├── FillForm.jsx
│   ├── AdminPage.jsx
│   ├── Auth.jsx
│   ├── MapsComp.jsx
│   ├── MapsCompFill.jsx
│   ├── UndoRedoControl.jsx
│   └── DrawingContext.jsx
├── utils/
│   ├── calculateDistance.js
│   ├── isPointInPolygon.js
│   ├── undo-redo.js
│   └── firebaseConfig.js
```

**Key libraries**: React, Next.js (optional), Tailwind CSS, Firebase (Auth, Firestore, Storage), @vis.gl/react-google-maps, XLSX, Axios, SendGrid (or SMTP), Sentry, Cypress/Playwright (E2E).


---

If you'd like any edits, or want me to perform one of the immediate actions above, tell me which number and I'll create it now.