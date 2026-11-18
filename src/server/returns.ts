import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { and, desc, eq } from "drizzle-orm"
import { sessionUser } from "./auth"
import { getDb } from "./db"
import { accountsConfigured } from "./env"
import { savedReturn } from "./schema"

export type ReturnKind = "personal" | "company"

export type ReturnSummary = {
  /** Personal: tax due for the year. Company: total tax in the chosen structure. */
  tax: number
  /** Personal: tax to pay (positive) or refund (negative). */
  balance?: number
  income: number
  form?: string
}

export type SavedReturnMeta = {
  id: string
  kind: ReturnKind
  year: number
  name: string
  summary: ReturnSummary
  updatedAt: number
}

const MAX_DATA = 200_000

async function requireUser() {
  if (!accountsConfigured()) throw new Error("ACCOUNTS_DISABLED")
  const user = await sessionUser(getRequest().headers)
  if (!user) throw new Error("UNAUTHENTICATED")
  return user
}

function meta(row: typeof savedReturn.$inferSelect): SavedReturnMeta {
  return {
    id: row.id,
    kind: row.kind,
    year: row.year,
    name: row.name,
    summary: JSON.parse(row.summary) as ReturnSummary,
    updatedAt: row.updatedAt.getTime(),
  }
}

/**
 * Whether this deployment has sign-in and saved returns. The interface hides
 * every account control when it does not.
 */
export const getAccountsEnabled = createServerFn({ method: "GET" }).handler(() => accountsConfigured())

export const listReturns = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser()
  const rows = await getDb().select().from(savedReturn).where(eq(savedReturn.userId, user.id)).orderBy(desc(savedReturn.year), desc(savedReturn.updatedAt))
  return rows.map(meta)
})

export const getReturn = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => {
    if (typeof input?.id !== "string" || input.id.length > 64) throw new Error("Invalid id")
    return input
  })
  .handler(async ({ data }) => {
    const user = await requireUser()
    const [row] = await getDb()
      .select()
      .from(savedReturn)
      .where(and(eq(savedReturn.id, data.id), eq(savedReturn.userId, user.id)))
      .limit(1)
    if (!row) return null
    return { ...meta(row), dataJson: row.data }
  })

type SaveInput = { id?: string; kind: ReturnKind; year: number; name: string; data: unknown; summary: ReturnSummary }

export const saveReturn = createServerFn({ method: "POST" })
  .validator((input: SaveInput) => {
    if (input.kind !== "personal" && input.kind !== "company") throw new Error("Invalid kind")
    if (!Number.isInteger(input.year) || input.year < 2560 || input.year > 2600) throw new Error("Invalid year")
    const name = String(input.name ?? "").trim().slice(0, 80)
    if (!name) throw new Error("Name required")
    const data = JSON.stringify(input.data ?? {})
    if (data.length > MAX_DATA) throw new Error("Too large")
    const summary = {
      tax: Number(input.summary?.tax) || 0,
      balance: input.summary?.balance === undefined ? undefined : Number(input.summary.balance) || 0,
      income: Number(input.summary?.income) || 0,
      form: input.summary?.form ? String(input.summary.form).slice(0, 12) : undefined,
    }
    return { id: input.id, kind: input.kind, year: input.year, name, data, summary: JSON.stringify(summary) }
  })
  .handler(async ({ data }) => {
    const user = await requireUser()
    const db = getDb()
    const now = new Date()
    if (data.id) {
      const updated = await db
        .update(savedReturn)
        .set({ kind: data.kind, year: data.year, name: data.name, data: data.data, summary: data.summary, updatedAt: now })
        .where(and(eq(savedReturn.id, data.id), eq(savedReturn.userId, user.id)))
        .returning({ id: savedReturn.id })
      if (updated.length > 0) return { id: data.id }
    }
    const id = crypto.randomUUID()
    await db.insert(savedReturn).values({ id, userId: user.id, kind: data.kind, year: data.year, name: data.name, data: data.data, summary: data.summary, createdAt: now, updatedAt: now })
    return { id }
  })

export const deleteReturn = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => {
    if (typeof input?.id !== "string" || input.id.length > 64) throw new Error("Invalid id")
    return input
  })
  .handler(async ({ data }) => {
    const user = await requireUser()
    await getDb().delete(savedReturn).where(and(eq(savedReturn.id, data.id), eq(savedReturn.userId, user.id)))
    return { ok: true }
  })
