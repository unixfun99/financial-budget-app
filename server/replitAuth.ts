import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { Pool } from "pg";
import MySQLStore from "express-mysql-session";
import { storage } from "./storage";

// Detect if we're running on Replit (PostgreSQL) or production (MySQL/MariaDB)
const isReplit = !!process.env.REPL_ID;

const getOidcConfig = memoize(
  async () => {
    // For production, use a custom ISSUER_URL (e.g., Google OAuth)
    // For Replit, use Replit's OIDC
    const issuerUrl = process.env.ISSUER_URL ?? (isReplit ? "https://replit.com/oidc" : "https://accounts.google.com");
    const clientId = process.env.OAUTH_CLIENT_ID ?? process.env.REPL_ID!;
    
    return await client.discovery(
      new URL(issuerUrl),
      clientId
    );
  },
  { maxAge: 3600 * 1000 }
);

function parseMySQL2Url(url: string) {
  // Parse mysql2://user:password@host:port/database format
  const match = url.match(/mysql2?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error("Invalid MySQL DATABASE_URL format. Expected: mysql2://user:password@host:port/database");
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5].split('?')[0], // Remove query params if any
  };
}

export function getSession() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const sessionTtlSeconds = Math.floor(sessionTtl / 1000);
  
  let sessionStore: session.Store;
  
  if (isReplit) {
    // Use PostgreSQL session store for Replit (Neon serverless)
    const pgStore = connectPg(session);
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    sessionStore = new pgStore({
      pool: pool,
      createTableIfMissing: false,
      ttl: sessionTtlSeconds,
      tableName: "sessions",
    });
  } else {
    // Use MySQL session store for production (MariaDB/MySQL)
    const MySQLStoreSession = MySQLStore(session as any);
    const mysqlConfig = parseMySQL2Url(process.env.DATABASE_URL);
    
    const options = {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      database: mysqlConfig.database,
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 minutes
      expiration: sessionTtl,
      createDatabaseTable: true,
      schema: {
        tableName: 'sessions',
        columnNames: {
          session_id: 'session_id',
          expires: 'expires',
          data: 'data'
        }
      },
      // SSL configuration for self-signed certificates
      ssl: {
        rejectUnauthorized: false
      }
    };
    
    sessionStore = new MySQLStoreSession(options);
  }
  
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"] || claims["given_name"],
    lastName: claims["last_name"] || claims["family_name"],
    profileImageUrl: claims["profile_image_url"] || claims["picture"],
  });
}

export async function setupAuth(app: Express) {
  // For production without Replit, we need OAuth client credentials
  if (!isReplit && (!process.env.OAUTH_CLIENT_ID || !process.env.OAUTH_CLIENT_SECRET)) {
    console.warn("Warning: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET are required for production OAuth");
  }
  
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = isReplit ? `replitauth:${domain}` : `oauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const clientId = process.env.OAUTH_CLIENT_ID ?? process.env.REPL_ID!;
      const clientSecret = process.env.OAUTH_CLIENT_SECRET;
      
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
          client_id: clientId,
          client_secret: clientSecret,
        } as any,
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
    return strategyName;
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const strategyName = ensureStrategy(req.hostname);
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const strategyName = ensureStrategy(req.hostname);
    passport.authenticate(strategyName, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    const clientId = process.env.OAUTH_CLIENT_ID ?? process.env.REPL_ID!;
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: clientId,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
