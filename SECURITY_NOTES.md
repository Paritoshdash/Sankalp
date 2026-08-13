# Security Notes — Sankalp

## Issues Identified During ML Integration Audit

---

### CRITICAL: localStorage-Based Authentication

**Status:** Not production-grade  
**Location:** `app/login/page.tsx`, all pages using `localStorage.getItem('currentUser')`

The login page now calls the real `/api/auth/login` endpoint (which uses bcrypt + MySQL), but the resulting session token is only the raw user object stored in `localStorage`. This means:
- Any JavaScript on the page can read it
- There is no server-side session validation on protected routes
- API routes do not verify authentication (e.g., `/api/analyze` accepts any `userId`)

**Recommendation:** Replace localStorage session with HTTP-only cookies (using NextAuth.js or a custom JWT middleware).

---

### HIGH: No API Authorization

**Status:** All API routes accept unauthenticated requests  
**Affected:** All `/api/user/*` and `/api/analyze` routes

A request can supply any `userId` in the request body and write to any athlete's records.

**Recommendation:** Add a server-side session middleware that verifies the authenticated user matches the `userId` in the request.

---

### MEDIUM: Aadhaar Stored in Plain Text

**Status:** Stored unmasked in MySQL `users.aadhaar`  
**Recommendation:** Hash or encrypt Aadhaar numbers at rest. Never expose raw Aadhaar in API responses.

---

### MEDIUM: Admin Dashboard is Unprotected

**Status:** `/admin` and `/api/admin/athletes` have no authentication check  
**Recommendation:** Add admin role check. At minimum, require a hardcoded admin password until proper auth is implemented.

---

### LOW: File Upload — Certificate Storage

**Location:** `app/api/user/achievements/route.ts`  
**Issue:** Files are saved to `public/uploads/certificates/` with timestamps as filenames. The directory must exist on the server.  
**Recommendation:** Use a cloud storage service (S3, Cloudinary) for file persistence.

---

### LOW: CORS in ML Backend

**Status:** Currently allows only `localhost:3000`  
**Location:** `ml_backend/main.py` — `allow_origins`  
**Recommendation:** Restrict to your production domain before deployment.

---

### NOTE: Video Files Are Not Persisted

Videos uploaded for analysis are processed in memory / temp files and deleted immediately. They are not stored. This is the correct behavior for a privacy-sensitive system.

---

*This file documents known issues. It does not imply they have been resolved.*
