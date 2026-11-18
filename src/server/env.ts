import { env } from "cloudflare:workers"

/**
 * Worker bindings and variables. All of them are optional: the calculator runs
 * with none. Sign-in and saved returns need DB and BETTER_AUTH_SECRET.
 */
export type TaxEnv = {
  DB?: D1Database
  APP_URL?: string
  MAIL_FROM?: string
  BETTER_AUTH_SECRET?: string
  RESEND_API_KEY?: string
}

export function workerEnv(): TaxEnv {
  return env as unknown as TaxEnv
}

/** Accounts are on only when the Worker has a D1 database and an auth secret. */
export function accountsConfigured(): boolean {
  const e = workerEnv()
  return Boolean(e.DB && e.BETTER_AUTH_SECRET)
}
