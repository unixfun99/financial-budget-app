// Storage factory - dynamically imports the correct storage based on environment
import type { IStorage } from "../storage";

let storageInstance: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (storageInstance) {
    return storageInstance;
  }

  // Use REPL_ID to detect Replit environment
  const isReplit = !!process.env.REPL_ID;
  
  // Can also be overridden with explicit DB_VENDOR
  const dbVendor = process.env.DB_VENDOR || (isReplit ? 'postgres' : 'mysql');

  if (dbVendor === 'postgres') {
    console.log("Loading PostgreSQL storage adapter...");
    const { storage } = await import("../storage");
    storageInstance = storage;
  } else {
    console.log("Loading MySQL/MariaDB storage adapter...");
    const { storage } = await import("../storage.prod");
    storageInstance = storage;
  }

  return storageInstance;
}

// Re-export interface for type usage
export type { IStorage } from "../storage";
