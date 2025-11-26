import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import ws from "ws";
import fs from "fs";
import * as devSchema from "@shared/schema";
import * as prodSchema from "@shared/schema.mariadb";

// Detect environment
const isReplit = !!process.env.REPL_ID;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Parse MySQL/MariaDB DATABASE_URL to connection options
function parseMySQLUrl(url: string) {
  try {
    // Handle mysql://, mysql2://, and mariadb:// protocols
    const normalizedUrl = url.replace(/^(mysql2?|mariadb):\/\//, 'mysql://');
    const parsed = new URL(normalizedUrl);
    
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '3306', 10),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1).split('?')[0],
    };
  } catch (error) {
    throw new Error(`Invalid MySQL DATABASE_URL format. Expected: mysql2://user:password@host:port/database. Error: ${error}`);
  }
}

// Build SSL configuration for MySQL
function getMySQLSSLConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check for CA certificate - prefer secure configuration
  const caCertPath = process.env.MYSQL_SSL_CA;
  
  if (caCertPath && fs.existsSync(caCertPath)) {
    console.log("Using CA certificate for MySQL SSL verification:", caCertPath);
    return {
      ca: fs.readFileSync(caCertPath).toString(),
      rejectUnauthorized: true
    };
  }
  
  // If MYSQL_SSL_VERIFY is explicitly set to 'false', allow insecure connections
  if (process.env.MYSQL_SSL_VERIFY === 'false') {
    console.warn("WARNING: MySQL SSL verification is disabled (MYSQL_SSL_VERIFY=false).");
    console.warn("This is insecure and should only be used for debugging!");
    return {
      rejectUnauthorized: false
    };
  }
  
  // In production, require proper SSL configuration
  if (isProduction) {
    throw new Error(
      "MySQL SSL configuration required in production. " +
      "Set MYSQL_SSL_CA=/path/to/ca-cert.pem for secure connections, " +
      "or set MYSQL_SSL_VERIFY=false for temporary debugging (not recommended)."
    );
  }
  
  // In development, allow insecure connections with warning
  console.warn("WARNING: MySQL SSL verification disabled in development mode.");
  console.warn("For production, set MYSQL_SSL_CA=/path/to/ca-cert.pem");
  return {
    rejectUnauthorized: false
  };
}

let db: any;

if (isReplit) {
  // For Replit development, use Neon serverless (PostgreSQL)
  neonConfig.webSocketConstructor = ws;
  console.log("Using Neon serverless database (Replit)");
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  db = drizzleNeon({ client: pool, schema: devSchema });
} else {
  // For production, use MySQL/MariaDB
  console.log("Using MySQL/MariaDB database (Production)");
  
  const mysqlConfig = parseMySQLUrl(process.env.DATABASE_URL);
  
  const mysqlPool = mysql.createPool({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // SSL configuration
    ssl: getMySQLSSLConfig()
  });
  
  db = drizzleMysql({ client: mysqlPool, schema: prodSchema, mode: 'default' });
}

export { db };
