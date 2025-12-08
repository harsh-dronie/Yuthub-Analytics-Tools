import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const connectionString = process.env.NEXT_PUBLIC_NEON_DB_CONNECTION_STRING;

if (!connectionString) {
  throw new Error("Missing NEXT_PUBLIC_NEON_DB_CONNECTION_STRING env variable");
}

console.log("Using connection string:", connectionString.replace(/:[^:@]+@/, ':****@'));

// Use HTTP-only connection (no WebSocket, works everywhere)
const sql = neon(connectionString);

export const db = drizzle(sql);
