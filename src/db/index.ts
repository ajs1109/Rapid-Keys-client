import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL environment variable is required in production");
}

const pool = new Pool({
  connectionString: databaseUrl || "postgresql://postgres:postgres@localhost:5432/rapidkeys",
});

export const db = drizzle(pool, { schema });
