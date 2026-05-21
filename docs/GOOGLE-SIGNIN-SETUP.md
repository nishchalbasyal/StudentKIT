# Google Sign-In Integration & Remember Me Setup

This document explains the complete Google Sign-In integration with persistent login ("Remember Me" functionality).

## What Has Been Implemented

### 1. **Frontend (Mobile App)**

#### Installed Packages
- `@react-native-google-signin/google-signin` - For native Google Sign-In

#### New Files Created
- **[apps/mobile/src/hooks/useGoogleSignIn.ts](apps/mobile/src/hooks/useGoogleSignIn.ts)** - Hook for Google Sign-In logic with auto-config
- **[apps/mobile/src/api/auth.api.ts](apps/mobile/src/api/auth.api.ts)** - Updated with `googleSignInApi` function

#### Modified Files
- **[apps/mobile/src/screens/auth/LoginScreen.tsx](apps/mobile/src/screens/auth/LoginScreen.tsx)** - Added Google Sign-In button with visual separator

#### Auth Store (Already Supports "Remember Me")
- **[apps/mobile/src/store/authStore.ts](apps/mobile/src/store/authStore.ts)** - Persists tokens/user in secure storage
  - On app startup: `hydrate()` method loads stored session automatically
  - This is the "Remember Me" feature - users stay logged in!

---

### 2. **Backend (Server)**

#### Installed Packages
- `google-auth-library` - For secure Google token verification

#### New Files Created
- **[server/src/modules/auth/google-oauth.service.ts](server/src/modules/auth/google-oauth.service.ts)** - Handles Google token verification and user creation/lookup

#### Modified Files
- **[server/src/modules/auth/auth.schemas.ts](server/src/modules/auth/auth.schemas.ts)** - Added `googleSignInSchema` validation
- **[server/src/modules/auth/auth.controller.ts](server/src/modules/auth/auth.controller.ts)** - Added `googleSignIn` handler
- **[server/src/modules/auth/auth.routes.ts](server/src/modules/auth/auth.routes.ts)** - Added `POST /auth/google-signin` endpoint
- **[server/src/modules/auth/auth.service.ts](server/src/modules/auth/auth.service.ts)** - Exported `issueTokenPair` for Google OAuth
- **[server/src/config/env.ts](server/src/config/env.ts)** - Added `GOOGLE_CLIENT_ID` environment variable

---

## Setup Instructions

### Step 1: Get Your Google OAuth Credentials

You already have the SHA-1 fingerprint! Now set up OAuth in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `studentkit-c3ba0`
3. Navigate to **APIs & Services → Credentials**
4. Create a new **OAuth 2.0 Client ID** (if not exists):
   - Type: **Android**
   - Package name: `com.studentkit.app`
   - Paste your SHA-1 fingerprint (from earlier keytool command)
   - Click **Create**
5. Copy the **Web Client ID** (looks like: `249069302279-xxxxx.apps.googleusercontent.com`)

### Step 2: Update Backend Environment

Edit your `.env` file in the server directory:

```bash
# Add this line with your Google Client ID from Step 1
GOOGLE_CLIENT_ID="249069302279-xxxxx.apps.googleusercontent.com"
```

### Step 3: Update Mobile App

**Option A: Hardcoded (Development)**

The app already uses a placeholder in [LoginScreen.tsx](apps/mobile/src/screens/auth/LoginScreen.tsx):

```tsx
const GOOGLE_WEB_CLIENT_ID = "249069302279-u5hj6j9k7l8m9n0o1p2q3r4s5t6u7v8w.apps.googleusercontent.com";
```

**Option B: Environment Variable (Recommended for Production)**

1. Update `.env.example` in mobile app:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID="your-web-client-id"
```

2. Create `.env` from the example and fill in the ID

3. Update [LoginScreen.tsx](apps/mobile/src/screens/auth/LoginScreen.tsx):
```tsx
import { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID } from "@env";

const GOOGLE_WEB_CLIENT_ID = EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
```

---

## How It Works

### Login Flow

```
User presses "Sign in with Google"
         ↓
Google Sign-In dialog opens
         ↓
User authenticates with Google
         ↓
Google returns ID Token
         ↓
App sends ID Token to backend: POST /auth/google-signin
         ↓
Backend verifies token with Google
         ↓
Backend creates/finds user by email
         ↓
Backend issues access & refresh tokens
         ↓
App stores tokens in secure storage (expo-secure-store)
         ↓
User is logged in!
```

### Remember Me Feature

```
User closes and reopens app
         ↓
App startup calls useAuthBootstrap()
         ↓
Reads tokens from secure storage
         ↓
Sets authenticated state
         ↓
User is automatically logged in!
         ↓
No need to enter credentials again
```

---

## Testing the Integration

### On Your Android Device/Emulator

1. **Start the backend:**
```bash
cd server
npm run dev
```

2. **Start the mobile app:**
```bash
cd apps/mobile
npm start -- --android
```

3. **Test Google Sign-In:**
   - Click "Sign in with Google" button
   - Select a Google account
   - You should be logged in!

4. **Test Remember Me:**
   - Close the app completely
   - Reopen it
   - You should still be logged in ✅

### Troubleshooting

**Error: "Google Play Services is not available"**
- On emulator, ensure Google Play Services are installed
- Download from Google Play or use official emulator images

**Error: "Invalid Google token"**
- Check that GOOGLE_CLIENT_ID in `.env` matches your OAuth credentials
- Verify SHA-1 fingerprint was added to OAuth config

**Token verification failed**
- Ensure google-auth-library is installed: `npm list google-auth-library`
- Check network connectivity between app and backend

---

## Security Notes

✅ **What's Secure:**
- Tokens stored in secure storage (expo-secure-store)
- Google tokens verified on backend
- Refresh tokens rotated after use
- Passwords not stored for Google users

⚠️ **For Production:**
- Move `GOOGLE_WEB_CLIENT_ID` to environment variables
- Use HTTPS for all API calls
- Implement token expiry and rotation
- Add CSRF protection for web clients

---

## API Endpoint Reference

### Google Sign-In Endpoint

**POST** `/auth/google-signin`

**Request Body:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjExMjM1NjI2YjEwOTkyMjA..."
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "country": "DE",
    "studentStatus": "OTHER",
    "currency": "EUR",
    "hourlyWageDefault": null,
    "avatarUrl": null,
    "university": null,
    "course": null,
    "createdAt": "2026-05-19T...",
    "updatedAt": "2026-05-19T..."
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "base64url-encoded-token...",
    "refreshTokenExpiresAt": "2026-06-18T..."
  }
}
```

**Response (201):** Same as above, for new user creation

**Error (401):**
```json
{
  "status": "error",
  "code": "AUTHENTICATION_REQUIRED",
  "message": "Invalid Google token"
}
```

---

## File Structure

```
Mobile Frontend
├── src/
│   ├── api/
│   │   └── auth.api.ts (+ googleSignInApi)
│   ├── hooks/
│   │   ├── useAuth.ts (existing)
│   │   └── useGoogleSignIn.ts (NEW)
│   ├── screens/auth/
│   │   └── LoginScreen.tsx (+ Google button)
│   └── store/
│       └── authStore.ts (already supports Remember Me)

Backend Server
├── src/modules/auth/
│   ├── auth.controller.ts (+ googleSignIn handler)
│   ├── auth.routes.ts (+ /google-signin route)
│   ├── auth.schemas.ts (+ googleSignInSchema)
│   ├── auth.service.ts (exported issueTokenPair)
│   └── google-oauth.service.ts (NEW)
└── .env (+ GOOGLE_CLIENT_ID)
```

---

## Next Steps

1. ✅ Get OAuth credentials from Google Cloud Console
2. ✅ Add GOOGLE_CLIENT_ID to server `.env`
3. ✅ Update mobile app with correct Client ID
4. ✅ Test locally
5. ✅ Deploy to Google Play Console
6. ✅ Monitor user sign-in success rates

---

## Support & References

- [Google Sign-In for Android](https://developers.google.com/identity/sign-in/android)
- [expo-secure-store docs](https://docs.expo.dev/modules/expo-secure-store/)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Google OAuth 2.0 verification](https://developers.google.com/identity/protocols/oauth2)
