import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Detect if running on Replit
const isReplit = !!process.env.REPL_ID;

// Session configuration for self-hosted deployment
function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  return session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Setup Google OAuth for self-hosted deployments
async function setupGoogleAuth(app: Express) {
  console.log("Setting up Google OAuth authentication...");

  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is required");
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
  }
  if (!process.env.APP_URL) {
    throw new Error("APP_URL environment variable is required (e.g., https://your-domain.com)");
  }

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.APP_URL}/api/callback`,
        scope: ["openid", "email", "profile"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth callback - profile ID:", profile.id);
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName;
          const lastName = profile.name?.familyName;
          const profileImageUrl = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error("No email provided by Google"));
          }

          // Upsert user in database
          await storage.upsertUser({
            id: profile.id,
            email,
            firstName,
            lastName,
            profileImageUrl,
          });

          // Create user session object with claims (similar structure to Replit Auth)
          const user = {
            claims: {
              sub: profile.id,
              email,
              first_name: firstName,
              last_name: lastName,
              profile_image_url: profileImageUrl,
            },
          };

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Auth routes
  app.get("/api/login", (req, res, next) => {
    passport.authenticate("google", {
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    console.log("Callback handler triggered - code:", req.query.code, "state:", req.query.state);
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  console.log("Google OAuth authentication configured successfully");
}

// Main auth setup function - chooses provider based on environment
export async function setupAuth(app: Express) {
  if (isReplit) {
    // Use Replit Auth when running on Replit
    console.log("Detected Replit environment - using Replit Auth");
    const { setupAuth: setupReplitAuth } = await import("./replitAuth.js");
    return setupReplitAuth(app);
  } else {
    // Use Google OAuth for self-hosted deployments
    console.log("Detected self-hosted environment - using Google OAuth");
    return setupGoogleAuth(app);
  }
}

// Authentication middleware - works with both auth providers
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // For Replit Auth, check token expiration and refresh if needed
  if (isReplit && user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now > user.expires_at) {
      const refreshToken = user.refresh_token;
      if (!refreshToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const { isAuthenticated: replitIsAuth } = await import("./replitAuth.js");
        return replitIsAuth(req, res, next);
      } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }
  }

  return next();
};
