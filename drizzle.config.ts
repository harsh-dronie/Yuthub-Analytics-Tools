import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const rawConnectionString = process.env.NEXT_PUBLIC_NEON_DB_CONNECTION_STRING;

if (!rawConnectionString) {
  throw new Error("Missing NEXT_PUBLIC_NEON_DB_CONNECTION_STRING env variable");
}

const extractedUrl = rawConnectionString.match(/postgresql:\/\/[^\s']+/)?.[0];

if (!extractedUrl) {
  throw new Error("Invalid Neon connection string format");
}

export default defineConfig({
  schema: "./configs/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: extractedUrl,
  },
});
