import * as devSchema from "@shared/schema";
import * as prodSchema from "@shared/schema.mariadb";

// Detect environment
const isReplit = !!process.env.REPL_ID;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Use appropriate driver based on environment
let db: any;

if (isReplit) {
  // Development: Use Neon serverless (PostgreSQL)
  console.log("Using Neon serverless database (Replit)");
  const { Pool, neonConfig } = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-serverless");
  const ws = require("ws");

  neonConfig.webSocketConstructor = ws;

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema: devSchema });
} else {
  // Production: Use MySQL/MariaDB
  console.log("Using MySQL/MariaDB database (Production)");
  const { createPool } = require("mysql2/promise");
  const { drizzle } = require("drizzle-orm/mysql2/promise");

  const pool = createPool({
    uri: process.env.DATABASE_URL,
    enableKeepAlive: true,
    enableStreamingResults: false,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });

  db = drizzle({ client: pool, schema: prodSchema, mode: "default" });
}

export { db };
