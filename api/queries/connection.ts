import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@db/schema";

const fullSchema = { ...schema };

let instance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!instance) {
    const client = new Database("./data.sqlite");
    instance = drizzle(client, { schema: fullSchema });
  }
  return instance;
}
