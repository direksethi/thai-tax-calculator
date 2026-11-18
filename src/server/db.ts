import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1"
import { workerEnv } from "./env"

export type Db = DrizzleD1Database

const bound = new WeakMap<object, Db>()

export function getDb(): Db {
  const d1 = workerEnv().DB
  if (!d1) throw new Error("ACCOUNTS_DISABLED")
  let db = bound.get(d1)
  if (!db) {
    db = drizzle(d1)
    bound.set(d1, db)
  }
  return db
}
