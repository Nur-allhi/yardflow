import { readFileSync } from "fs";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

try {
  const rlsSQL = readFileSync("supabase/rls-policies.sql", "utf-8");
  const statements = rlsSQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    await sql.unsafe(stmt + ";");
    console.log(`✓ Executed`);
  }

  console.log("\nAll RLS policies applied successfully.");
} catch (err) {
  console.error("Error applying RLS policies:", err.message);
} finally {
  await sql.end();
}
