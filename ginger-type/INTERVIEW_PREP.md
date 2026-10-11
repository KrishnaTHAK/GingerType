# GingerType — System Architecture & Technical Interview Preparation Guide

---

## 1. Executive Summary & Architecture Overview

### High-Level Overview
**GingerType** is a full-stack, real-time web-based typing speed and accuracy platform (inspired by Monkeytype). It enables users to test, track, and analyze their typing performance across various durations (15s, 30s, 60s), difficulty levels, and text categories. The application provides instant visual feedback, custom keyboard audio effects, detailed post-test statistics, historical analytics (WPM trends, character mistake heatmaps, peak typing hours), competitive global leaderboards with rank calculation, social result sharing (via PNG canvas download & clipboard), and email notification alerts when a user's leaderboard position is overtaken.

### Key Architectural Decisions & Rationale
1. **Decoupled Client-Server (MERN) Architecture**: Built as a decoupled single-page application (React 19 + Vite) communicating with a RESTful Express 5 API. This separates presentation logic from business rule processing and allows independent scaling and deployment.
2. **Hybrid Authentication (JWT + OAuth 2.0)**: Combines stateless JSON Web Tokens (JWT) for API request authorization with Passport.js Google OAuth 2.0 for frictionless social login. Accounts sharing the same email address are automatically merged.
3. **Ref-Driven State Engine with Frame-Batched React Updates**: High-frequency user interactions (keypresses up to 150+ WPM) bypass React's state reconciliation loop during keystrokes by storing mutable typing state inside `useRef` hooks. Rendering is synchronized to the screen using `requestAnimationFrame` to prevent layout thrashing and input lag.
4. **Cloud-Native Media & Transactional Email Services**: Cloudinary (via `multer-storage-cloudinary`) handles profile avatar storage and server-side image transformation (200x200 crop fill). Nodemailer manages async transactional emails (email verification, password resets, and competitive leaderboard alerts).
5. **Analytics via MongoDB Aggregation Pipelines**: Instead of processing raw results on the Node.js event loop, data-heavy calculations—such as WPM distribution by time of day, duration breakdowns, and top character mistake frequencies—are offloaded to MongoDB's native aggregation engine.

---

### Core Tech Stack

| Technology | Rationale |
| :--- | :--- |
| **React 19** | Component-based UI library chosen for efficient Virtual DOM updates, declarative state management, and modern hook support. |
| **Vite** | Next-generation frontend build tool providing near-instant HMR (Hot Module Replacement) and optimized ES bundle production. |
| **Express.js (v5)** | Fast, unopinionated Node.js web framework handling REST endpoint routing, middleware pipelines, and centralized async error handling. |
| **MongoDB & Mongoose (v9)** | Flexible document database paired with a schema-based ODM for rapid querying, schema validation, and native aggregation pipelines. |
| **JSON Web Tokens (JWT)** | Stateless, signature-verified authentication mechanism enabling secure API requests without session database lookups. |
| **Passport.js (Google OAuth 2.0)** | Industry-standard authentication middleware streamlining third-party Google sign-in and user profile extraction. |
| **Cloudinary & Multer** | Zero-maintenance cloud media storage pipeline with automated image cropping, compression, and CDN hosting for avatars. |
| **Nodemailer** | Flexible SMTP transport library used for delivering transactional emails (verification, reset links, leaderboard alerts). |
| **Axios** | Promise-based HTTP client featuring automatic request interceptors for JWT token injection and centralized response handling. |
| **html2canvas** | Client-side HTML element renderer used to generate shareable PNG image cards directly from DOM elements without server overhead. |
| **Helmet & Express Rate Limit** | Security middleware securing HTTP headers and preventing brute-force attack vectors across auth and API endpoints. |

---

### High-Level System Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER / CLIENT                                 |
|                                                                                   |
|   +-----------------------+     +-----------------------+     +-----------------+ |
|   |  React 19 Component   | <-> |   useTypingEngine     | <-> |  HTML5 Canvas/  | |
|   |   (MainBody, Stats)   |     | (Ref & rAF State Loop)|     | Audio ('click') | |
|   +-----------------------+     +-----------------------+     +-----------------+ |
|               |                             |                                     |
|               v                             v                                     |
|     +------------------+           +------------------+                           |
|     |  AuthContext     |           | Axios Interceptor|                           |
|     | (localStorage)   |           | (Bearer JWT Auth)|                           |
|     +------------------+           +------------------+                           |
+---------------------------------------------|-------------------------------------+
                                              | HTTPS / REST
                                              v
+-----------------------------------------------------------------------------------+
|                                EXPRESS 5 BACKEND                                  |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |  Middleware Pipeline: Helmet | Cors | Express-Session | RateLimit | Auth   |   |
|   +---------------------------------------------------------------------------+   |
|         |                        |                         |                      |
|         v                        v                         v                      |
|   +---------------+     +------------------+      +------------------+            |
|   | Auth Routes   |     | Results Route    |      | Analytics Router |            |
|   | /api/auth/*   |     | POST /api/results|      | /api/analytics/* |            |
|   +---------------+     +------------------+      +------------------+            |
|         |                        |                         |                      |
+---------|------------------------|-------------------------|----------------------+
          |                        |                         |
          v                        v                         v
+------------------+     +--------------------+     +-------------------------------+
|  MongoDB / Atlas |     |   Cloudinary API   |     |    Nodemailer (SMTP / Gmail)  |
| (Users & Results)|     | (Avatar Storage)   |     | (Verification/Leaderboard)    |
+------------------+     +--------------------+     +-------------------------------+
```

---

## 2. Core Components & Deep Dive

### Directory & File Structure Breakdown

```
GingerType/
├── client/                      # React 19 Frontend Application (Vite)
│   ├── public/
│   │   └── click.mp3            # Keyboard sound effect asset
│   └── src/
│       ├── components/
│       │   ├── footer/          # App footer with modal triggers
│       │   ├── mainBody/        # Typing test layout & controls
│       │   │   └── MainComponent/
│       │   │       ├── Difficulty.jsx     # Difficulty selector
│       │   │       ├── TestDuration.jsx   # Duration selector (15/30/60s)
│       │   │       ├── TextContainer.jsx  # Typing DOM display & character mapping
│       │   │       └── TextSelection.jsx  # Category selection
│       │   ├── navbar/          # Navigation bar (Logo, Stats link, Auth status)
│       │   ├── Settings/        # Settings modal (Theme, Font Size, Sound)
│       │   └── ShareResult/     # Social share modal (PNG card generator + clipboard)
│       ├── context/
│       │   ├── AuthContext.jsx     # Global User & JWT token state provider
│       │   └── SettingsContext.jsx # Global Theme, Font Size, and Audio preferences
│       ├── hooks/
│       ├── UseTypingEngine.js  # Core typing calculation, timer & auto-scroll engine
│       ├── pages/
│       │   ├── ForgotPassword.jsx # Request password reset email
│       │   ├── Login.jsx          # Email/Password & Google OAuth entry point
│       │   ├── Profile.jsx        # User stats overview, avatar upload & WPM trend bar
│       │   ├── Register.jsx       # User registration page
│       │   ├── ResetPassword.jsx  # New password entry page via token
│       │   └── Stats.jsx          # Global Leaderboard, Mistakes Breakdown, Best Hours
│       └── utils/
│           ├── api.js             # Configured Axios instance with request interceptor
│           └── textData.js        # Static literature & quote data categorized by difficulty
│
└── server/                      # Express 5 REST API Backend
    ├── config/
    │   ├── cloudinary.js          # Multer storage engine integration for Cloudinary
    │   ├── nodemailer.js          # Email templates (Verification, Password Reset, Over-take)
    │   └── passport.js            # Google OAuth 2.0 strategy definition
    ├── models/
    │   ├── Result.js              # Result schema (userId, wpm, accuracy, duration, mistakes)
    │   └── User.js                # User schema (auth, bestWPM, avatarUrl, tokens)
    ├── routes/
    │   └── analytics.js           # Analytics endpoints (trend, consistency, mistakes, time)
    └── server.js                  # Main server entry, middleware setup, auth endpoints
```

---

### Core Workflows & Data Pipelines

#### 1. Authentication & OAuth Flow
- **Standard Registration**: `POST /api/auth/register` hashes passwords with `bcrypt` (salt factor 10), generates a 32-byte hex `verificationToken`, saves the user with `isVerified: false`, and sends an email containing a link to `/api/auth/verify/:token`.
- **Email Verification**: Clicking the verification link updates `isVerified: true`, nulls the `verificationToken`, and redirects the client to `/login?verified=true`.
- **Google OAuth 2.0 Flow**:
  1. User clicks "Sign in with Google" (`GET /auth/google`).
  2. Passport redirects to Google OAuth consent screen.
  3. Google redirects back to `/auth/google/callback`.
  4. Passport checks if `googleId` exists. If not, checks if a user with the same email exists. If so, merges `googleId` and sets `isVerified: true`. Otherwise, creates a new user, generating a unique username with a 4-digit random suffix if collisions occur.
  5. Node.js signs a 24-hour JWT token and redirects to `${process.env.CLIENT_URL}?token=${token}`.
  6. Frontend `App.jsx` intercepts `?token=...`, saves token to `localStorage`, fetches profile data via `GET /api/auth/profile`, initializes `AuthContext`, and clears URL search params.

#### 2. Real-Time Typing Engine (`useTypingEngine.js`)
- **Key Capture**: A global `keydown` event listener processes key inputs. Non-printable keys are filtered out. `Backspace` pops from `typedCharsRef`. `Escape` toggles pause state. `Shift+Enter` triggers test reset.
- **Performance Optimization**: Keystroke entries update mutable `useRef` arrays (`typedCharsRef`, `cursorRef`) directly without invoking React's `setState` on every keypress.
- **Render Scheduling**: `scheduleSync()` uses `requestAnimationFrame` to batch state snapshots (`cursor`, `typed`, `wpm`, `accuracy`, `timeLeft`) into React state at the display refresh rate (60Hz/144Hz), eliminating input latency.
- **WPM Calculation Formula**:
  $$\text{WPM} = \frac{\text{Correct Characters} / 5}{\text{Elapsed Seconds} / 60}$$
- **Accuracy Formula**:
  $$\text{Accuracy} = \frac{\text{Correct Characters}}{\text{Total Typed Characters}} \times 100$$
- **Auto-Scrolling Mechanism**: The container calculates line height from DOM char node offsets. When the active character moves to line index $N+1$, `containerRef.current.scrollTop` is smoothly incremented by `lineHeight`.

#### 3. Test Result Completion & Overtake Notification Pipeline
- When `timeLeft` reaches 0, `showResultModal` is set to `true`.
- `TextContainer.jsx` triggers a `useEffect` hook that computes a character mistake map (e.g., `{ "a": 3, "e": 1 }`) by comparing typed characters against expected characters.
- Client sends `POST /api/results` with `{ wpm, accuracy, duration, mode, mistakes }`.
- Backend checks if `wpm > currentUser.bestWPM`:
  - If true, queries MongoDB for users whose `bestWPM` was between the user's previous best and new best: `User.find({ bestWPM: { $gt: currentUser.bestWPM, $lte: wpm } })`.
  - Dispatches email alerts to all overtaken users via `sendLeaderboardBeatenEmail()`.
  - Updates `currentUser.bestWPM` using `$max`.

---

### Key Design Patterns Used

1. **Custom Hook Pattern (`useTypingEngine`)**: Encapsulates complex state, timer intervals, event listeners, and DOM reference management into a reusable hook, completely separating typing engine physics from visual presentation.
2. **Provider Pattern (`AuthContext`, `SettingsContext`)**: Wraps component subtrees to provide top-level access to authentication user state, settings preferences (theme, font size, sound), avoiding prop drilling.
3. **Axios Interceptor Pattern**: Outbound HTTP requests pass through `api.interceptors.request` to dynamically attach authorization headers (`Bearer <token>`) from `localStorage`.
4. **Strategy Pattern (Passport.js)**: Employs `passport-google-oauth20` to encapsulate OAuth authentication logic independently from traditional password authentication.
5. **Async Handler / Wrapper Pattern**: Route handlers wrap async calls in `asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`, passing unhandled promise rejections directly to Express global error handling middleware.
6. **Memoization Pattern (`React.memo`, `useMemo`, `useCallback`)**: Individual character spans (`Char`) are wrapped in `React.memo` to prevent full text re-renders when single characters change state. `useMemo` caches word/character array splits.

---

## 3. Technical Hard Questions & Trade-offs

### Performance & Scalability Analysis

#### Bottlenecks & Remediation Strategies
1. **Unindexed MongoDB Queries on Aggregation Routes**:
   - *Issue*: Aggregations in `analytics.js` (`/by-duration`, `/best-time`) and duration leaderboards perform `$match` and `$group` operations over all `Result` documents without index backing. As the result table grows to millions of documents, response latency will degrade.
   - *Solution*: Add compound indexes on `Result` schema:
     ```javascript
     resultSchema.index({ userId: 1, duration: 1 });
     resultSchema.index({ userId: 1, createdAt: -1 });
     resultSchema.index({ duration: 1, wpm: -1 });
     ```
2. **Synchronous Email Loop inside Result Processing**:
   - *Issue*: When a high score is achieved in `POST /api/results`, the backend iterates sequentially over `beatenUsers` and calls `await sendLeaderboardBeatenEmail()`. If 50 users are overtaken, the API response will hang for seconds waiting for SMTP network calls.
   - *Solution*: Offload email jobs to an asynchronous task queue (e.g., Redis + BullMQ or AWS SQS) so route responses return immediately in under 50ms.
3. **In-Memory Express Session Storage**:
   - *Issue*: `app.use(session({ secret: ... }))` uses default memory storage (`MemoryStore`). This causes memory leaks in production and breaks multi-instance horizontal scaling (load balancers).
   - *Solution*: Replace `MemoryStore` with `connect-mongo` or `connect-redis` for persistent, shared session management across server instances.

---

### Architectural Engineering Trade-offs

| Decision | Trade-off Made | Benefits | Drawbacks / Risks |
| :--- | :--- | :--- | :--- |
| **Client-Side Typing Engine Engine** | Client calculates WPM & accuracy vs. Server-side validation | Instant local feedback, zero server compute overhead per keystroke, offline resilience during test | Vulnerable to client-side manipulation (fake WPM injection via modified JS/HTTP requests) |
| **Token Storage in `localStorage`** | Storing JWT in `localStorage` vs. `httpOnly` Secure Cookie | Simple client implementation, easy retrieval for Axios interceptors across domain origins | Susceptible to XSS (Cross-Site Scripting) attacks reading tokens from local storage |
| **Static Text Datasets** | Local static JSON (`textData.js`) vs. Database-backed Text API | Zero network latency when changing categories or starting tests, simplified offline rendering | Increasing bundle size as text libraries grow; requires full frontend redeployment to add content |
| **Monolithic Server Structure** | Single Express server (`server.js`) vs. Microservices | Rapid development cycle, simple local debugging, unified codebase | Scaling auth, analytics, and result saving independently is not possible without refactoring |

---

### Edge Cases & Error Handling

- **Expired JWT Token**: Handled by backend `authenticateToken` middleware returning `403 Invalid or expired token`. Frontend Axios interceptors can catch 403s and force `logout()`.
- **Google OAuth Username Collisions**: Resolved in `passport.js` using a `while` loop that appends a random 4-digit integer (`Math.floor(1000 + Math.random() * 9000)`) to the base username until a unique entry is found in MongoDB.
- **Empty / Short Typing Inputs**: `useTypingEngine.js` guards against division by zero during initial keystrokes by enforcing a minimum elapsed time floor of `0.001` seconds:
  ```javascript
  const elapsedSeconds = Math.max(0.001, (nowMs - startTimeRef.current) / 1000);
  ```
- **Unverified User Login Attempt**: `POST /api/auth/login` checks `if (!user.isVerified)` and blocks authentication with a `400` status message explicitly reminding the user to verify their inbox.
- **Google Sign-In Account Password Attempt**: Standard password login checks `if (!user.password)` and returns an explicit instruction: `"This account uses Google Sign-In. Please use the Google login button."`

---

### Security Considerations & Implementations

1. **Password Hashing**: User passwords are encrypted with `bcrypt` using 10 salt rounds prior to persistence. Raw passwords are never stored or logged.
2. **Rate Limiting**: Configured using `express-rate-limit`:
   - *General API Limiter*: 100 requests per 15-minute window.
   - *Strict Auth Limiter*: 10 requests per 15-minute window on `/login`, `/register`, and `/forgot-password` routes to mitigate credential stuffing and brute-force attempts.
3. **HTTP Security Headers**: `helmet()` middleware automatically sets protective HTTP headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).
4. **Token Security**: Verification and password reset tokens are generated using cryptographically strong pseudo-random bytes (`crypto.randomBytes(32).toString('hex')`). Password reset tokens enforce a 1-hour expiration limit (`resetTokenExpiry: Date.now() + 3600000`).
5. **Data Exposure Control**: User database queries selectively exclude sensitive password fields using Mongoose projections (`User.findById(...).select('-password')`).

---

## 4. Potential Interview Questions & Strong Answers

### Q1: How does the typing engine process keystrokes without causing frame drops or UI lag in React?
> **Answer**:  
> In a high-speed typing app, updating React state on every keypress (up to 10-15 inputs per second) causes excessive re-renders, layout thrashing, and input lag. To solve this, GingerType decouples high-frequency key tracking from React's rendering pipeline.  
> 
> We store mutable typing state (array of typed characters, cursor position, start times) in `useRef` hooks (`typedCharsRef`, `cursorRef`). When a user types, the `keydown` handler mutates these ref variables instantly without calling `setState`. Visual updates are scheduled via `requestAnimationFrame` inside a `scheduleSync` function. This batches state updates (`setSnapshot`) at the native monitor refresh rate (60Hz/144Hz). Furthermore, individual character elements (`Char`) are memoized using `React.memo` so only active and updated character spans re-render.

---

### Q2: How does Google OAuth integration work alongside traditional email/password authentication, and how are duplicate accounts avoided?
> **Answer**:  
> GingerType uses Passport.js with `passport-google-oauth20`. When a user authenticates via Google, the server receives their Google profile (ID, email, display name, avatar).  
> 
> To prevent duplicate accounts, the strategy follows a 3-step lookup:
> 1. Check if a user already exists with `googleId: profile.id`. If found, return the user.
> 2. If not found, query by email (`email: profile.emails[0].value`). If an email match exists (e.g., user registered via email previously), we merge the accounts by updating `user.googleId = profile.id`, marking `isVerified = true`, and saving.
> 3. If neither exists, we create a new user. To handle username collisions, we generate a base username from `profile.displayName` and run a `while` loop appending random 4-digit numbers until `User.findOne({ username })` returns null.  
> 
> Once authenticated, the server signs a standard 24-hour JWT token and redirects the browser back to the frontend with the token as a query parameter. The React app extracts the token, stores it in `localStorage`, and completes the session setup.

---

### Q3: How is the consistency score calculated in the analytics pipeline?
> **Answer**:  
> Consistency measures how steady a typist's speed is across recent tests. In `server/routes/analytics.js`, the `/consistency` endpoint fetches the user's last 10 result documents (`Result.find({ userId }).sort({ createdAt: -1 }).limit(10)`).  
> 
> We extract the array of WPM scores, calculate the arithmetic mean ($\mu$), and derive the population standard deviation ($\sigma$):
> $$\sigma = \sqrt{\frac{\sum (WPM_i - \mu)^2}{N}}$$
> The final consistency score is calculated as $\text{Consistency} = \max(0, \text{Math.round}(100 - \sigma))$. A low standard deviation means speed variance is small, yielding a score close to 100%.

---

### Q4: What happens when a user sets a new personal best WPM score? Walk through the backend database & notification flow.
> **Answer**:  
> When `POST /api/results` receives a payload containing `{ wpm, accuracy, duration, mistakes }`, it first persists the result document. Next, it fetches the current user from MongoDB.  
> 
> If `wpm > currentUser.bestWPM`:
> 1. We query MongoDB for all users whose `bestWPM` falls strictly between the user's old score and new score:  
>    `User.find({ bestWPM: { $gt: currentUser.bestWPM, $lte: wpm }, _id: { $ne: currentUser._id } })`.
> 2. We iterate over these "beaten" users and invoke `sendLeaderboardBeatenEmail()` via Nodemailer, notifying them that their leaderboard spot was taken.
> 3. Finally, we update the user's profile using Mongoose's `$max` operator: `User.findByIdAndUpdate(userId, { $max: { bestWPM: wpm } })`.

---

### Q5: How are security and rate-limiting configured on the Express API?
> **Answer**:  
> Security is implemented using a defense-in-depth approach:
> - **Header Hardening**: `helmet()` automatically injects security headers to protect against clickjacking, cross-site scripting (XSS), and MIME-sniffing.
> - **Granular Rate Limiting**: `express-rate-limit` enforces two distinct limiters:
>   - A *general limiter* allowing 100 requests per 15 minutes per IP across all general routes.
>   - An *auth limiter* restricting sensitive endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`) to 10 requests per 15 minutes to block brute-force password attempts.
> - **Password Hashing**: Passwords are standardly hashed with `bcrypt` (10 rounds).
> - **Token Authorization**: JWT authentication verifies signatures using `jsonwebtoken.verify` on protected routes.

---

### Q6: If you had 2 more weeks on this codebase, what would you improve or refactor?

> **Answer**:
> 1. **Server-Side Keystroke Validation / Anti-Cheat Engine**:
>    - *Current Limitation*: The client sends final WPM and accuracy metrics, making it easy to spoof test results via curl or browser console scripts.
>    - *Improvement*: Send timestamped keystroke timing logs (array of keypress delays in ms) to the server upon completion. The backend can calculate inter-key velocity distributions and verify that typing physics match human patterns before saving to the leaderboard.
> 2. **Asynchronous Job Queue for Emails (Redis + BullMQ)**:
>    - *Current Limitation*: Transactional emails (leaderboard overtake alerts, verification) are sent synchronously during HTTP requests, blocking response cycles.
>    - *Improvement*: Replace direct Nodemailer calls with a BullMQ queue backed by Redis to process email delivery out-of-band.
> 3. **Redis Caching for Global Leaderboard**:
>    - *Current Limitation*: Leaderboard routes trigger live MongoDB aggregate and sort operations on every request.
>    - *Improvement*: Cache top-10 leaderboard structures in Redis with an eviction ttl of 60 seconds or update via Redis Sorted Sets (`ZADD` / `ZREVRANGE`).
> 4. **Migrate Token Storage to `httpOnly` Cookies with Refresh Tokens**:
>    - *Current Limitation*: JWTs stored in `localStorage` are vulnerable to XSS attacks.
>    - *Improvement*: Issue access tokens in short-lived `httpOnly`, `SameSite=Strict` cookies paired with a persistent refresh token stored securely in database/cookies.
> 5. **Real-time Multiplayer Typing Battles (WebSockets / Socket.io)**:
>    - *Improvement*: Implement a 1v1 or multiplayer room system allowing users to compete live on the same text passage with synchronized cursor progress bars.

---

## 5. Cheat Sheet / Quick Reference

### Key Metrics & Formulas
- **WPM**: $(\text{Correct Characters} / 5) \times (60 / \text{Elapsed Seconds})$
- **Accuracy**: $(\text{Correct Characters} / \text{Total Characters Typed}) \times 100$
- **Consistency Score**: $\max(0, 100 - \sigma_{\text{WPM}})$ over last 10 tests.

---

### Backend API Endpoints Reference

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register user & send verification email |
| `GET` | `/api/auth/verify/:token` | No | Verify email token & redirect to login |
| `POST` | `/api/auth/login` | No | Authenticate user & return JWT token |
| `POST` | `/api/auth/forgot-password` | No | Send password reset token via email |
| `POST` | `/api/auth/reset-password/:token` | No | Reset user password using token |
| `GET` | `/api/auth/profile` | **Yes** | Fetch current user details |
| `POST` | `/api/auth/avatar` | **Yes** | Upload profile picture to Cloudinary |
| `GET` | `/auth/google` | No | Initiate Google OAuth 2.0 flow |
| `GET` | `/auth/google/callback` | No | Google OAuth callback & JWT redirect |
| `POST` | `/api/results` | **Yes** | Save test result & trigger overtake emails |
| `GET` | `/api/results` | **Yes** | Get user result history |
| `GET` | `/api/leaderboard` | No | Top 10 overall WPM leaderboard |
| `GET` | `/api/leaderboard/rank` | **Yes** | Get user's current global rank |
| `GET` | `/api/leaderboard/:duration` | No | Top 10 leaderboard filtered by duration (15/30/60) |
| `GET` | `/api/stats` | **Yes** | User overall stats summary (total, best, avg) |
| `GET` | `/api/analytics/trend` | **Yes** | WPM & accuracy trend for last 10 tests |
| `GET` | `/api/analytics/consistency` | **Yes** | Compute standard deviation & consistency score |
| `GET` | `/api/analytics/by-duration` | **Yes** | Performance aggregated by duration |
| `GET` | `/api/analytics/mistakes` | **Yes** | Top 10 most mistaken characters |
| `GET` | `/api/analytics/best-time` | **Yes** | WPM breakdown grouped by hour of day |

---

### Database Schemas (Mongoose)

#### User Model (`models/User.js`)
```javascript
{
  username:          { type: String, unique: true, trim: true },
  email:             { type: String, required: true, unique: true, trim: true },
  password:          { type: String },          // Nullable for Google OAuth users
  googleId:          { type: String },          // Google OAuth ID
  bestWPM:           { type: Number, default: 0 },
  avatarUrl:         { type: String, default: '' },
  isVerified:        { type: Boolean, default: false },
  verificationToken: { type: String },
  resetToken:        { type: String },
  resetTokenExpiry:  { type: Date }
}
```

#### Result Model (`models/Result.js`)
```javascript
{
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  wpm:      { type: Number, required: true },
  accuracy: { type: Number, required: true },
  duration: { type: Number, required: true },
  mode:     { type: String, default: 'classic' },
  mistakes: { type: Object, default: {} }     // Map of character mistake counts { 'a': 2 }
}
```

---

### Crucial Code Functions to Remember

- **`useTypingEngine(text, durationSeconds, restartSignal)`**: Primary React custom hook in `client/src/hooks/UseTypingEngine.js` managing refs (`typedCharsRef`, `cursorRef`), keydown events, `requestAnimationFrame` UI sync, and auto-scroll logic.
- **`scheduleSync()`**: Batches typing engine ref values into React snapshot state using `requestAnimationFrame`.
- **`authenticateToken(req, res, next)`**: Express middleware verifying JWT in `req.headers['authorization']`.
- **`asyncHandler(fn)`**: Utility wrapper executing async express routes and passing errors to `next()`.
- **`sendLeaderboardBeatenEmail(email, username, beatenBy, newWPM)`**: Nodemailer helper delivering email alerts to users whose leaderboard rank was overtaken.
