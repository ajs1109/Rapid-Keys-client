import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Clear existing DATABASE_URL to allow dotenv overrides to work
delete process.env.DATABASE_URL;

// Load local environment variables (.env.local has higher priority)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost/rapidkeys",
  },
});
