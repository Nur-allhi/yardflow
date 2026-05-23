import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false,
  max: 20,
  idle_timeout: 10,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
