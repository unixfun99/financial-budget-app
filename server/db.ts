import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as devSchema from "@shared/schema";

// Detect environment
const isReplit = !!process.env.REPL_ID;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// For Replit development, use Neon serverless (PostgreSQL)
// For production, this file won't be used - production uses MariaDB driver
neonConfig.webSocketConstructor = ws;

console.log(isReplit ? "Using Neon serverless database (Replit)" : "Using MySQL/MariaDB database (Production)");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzleNeon({ client: pool, schema: devSchema });
