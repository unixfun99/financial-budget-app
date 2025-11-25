# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth for your self-hosted Financial Budgeting Application.

## Overview

The application uses Replit Auth in development, which provides Google login through Replit's infrastructure. For self-hosted production deployments, you'll need to configure Google OAuth directly.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top and select **New Project**
3. Enter a project name (e.g., "Financial Budget App")
4. Click **Create**
5. Wait for the project to be created, then select it

---

## Step 2: Enable the Google+ API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click **Google+ API** and then **Enable**
4. Also enable **Google People API** (for profile information)

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you have a Google Workspace organization)
3. Click **Create**

### Fill in the OAuth Consent Screen:

| Field | Value |
|-------|-------|
| **App name** | Financial Budget App |
| **User support email** | your-email@gmail.com |
| **App logo** | (Optional) Upload your app logo |
| **App domain** | https://your-domain.com |
| **Authorized domains** | your-domain.com |
| **Developer contact email** | your-email@gmail.com |

4. Click **Save and Continue**

### Scopes:

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `openid` - OpenID Connect
   - `email` - View email address
   - `profile` - View basic profile info

3. Click **Update** then **Save and Continue**

### Test Users (for development):

1. Add your email as a test user
2. Click **Save and Continue**
3. Review and click **Back to Dashboard**

---

## Step 4: Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type

### Configure the OAuth Client:

| Field | Value |
|-------|-------|
| **Name** | Financial Budget App Web Client |
| **Authorized JavaScript origins** | https://your-domain.com |
| **Authorized redirect URIs** | https://your-domain.com/api/auth/google/callback |

#### For Local Development (add these too):

| Field | Value |
|-------|-------|
| **Authorized JavaScript origins** | http://localhost:5000 |
| **Authorized redirect URIs** | http://localhost:5000/api/auth/google/callback |

4. Click **Create**
5. **Save the Client ID and Client Secret** - you'll need these!

---

## Step 5: Configure Environment Variables

Add these to your production `.env` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Your production domain (no trailing slash)
APP_URL=https://your-domain.com

# Session secret (generate a random 64-character string)
SESSION_SECRET=your-random-session-secret-here
```

### Generate a Session Secret:

```bash
# On Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 6: Update Server Authentication Code

Create or update `server/auth-google.ts`:

```typescript
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

export function setupGoogleAuth(app: Express) {
  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `${process.env.APP_URL}/api/auth/google/callback`,
        scope: ["openid", "email", "profile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find or create user
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email provided by Google"));
          }

          // Upsert user in database
          const user = await storage.upsertUser({
            id: profile.id,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Auth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["openid", "email", "profile"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login?error=auth_failed",
      successRedirect: "/",
    })
  );

  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });
}
```

---

## Step 7: Install Required Package

```bash
npm install passport-google-oauth20
npm install --save-dev @types/passport-google-oauth20
```

---

## Step 8: Update Login Button (Frontend)

Update your login component to use the Google OAuth endpoint:

```tsx
// In your Login component
function LoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <Button onClick={handleGoogleLogin}>
      <FcGoogle className="mr-2 h-5 w-5" />
      Sign in with Google
    </Button>
  );
}
```

---

## Google OAuth Client ID Screen - Quick Reference

When creating the OAuth Client ID, use these exact settings:

### Application Type
- **Web application**

### Name
- `Financial Budget App Web Client` (or any descriptive name)

### Authorized JavaScript Origins
```
https://your-domain.com
http://localhost:5000
```

### Authorized Redirect URIs
```
https://your-domain.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your code matches exactly what's configured in Google Console
- Check for trailing slashes
- Verify HTTP vs HTTPS

### Error: "invalid_client"
- Double-check your Client ID and Client Secret
- Ensure environment variables are loaded correctly

### Error: "access_denied"
- User may have denied the consent
- Check if app is still in "Testing" mode and user isn't a test user

### Session Issues
- Verify SESSION_SECRET is set
- Check that cookies are being set (may need `secure: true` for HTTPS)
- Ensure session middleware is configured before passport

---

## Production Checklist

- [ ] Create Google Cloud Project
- [ ] Configure OAuth Consent Screen
- [ ] Create OAuth Client ID with production URLs
- [ ] Set all environment variables
- [ ] Install `passport-google-oauth20` package
- [ ] Update authentication code
- [ ] Test login flow
- [ ] Publish OAuth consent screen (move from Testing to Production)

---

## Publishing Your OAuth App

Once testing is complete:

1. Go to **OAuth consent screen**
2. Click **Publish App**
3. Confirm the publishing

This removes the 100-user limit and "This app isn't verified" warning.

For apps requesting sensitive scopes, you may need Google verification.
