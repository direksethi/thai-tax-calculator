import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth"
import { emailOTP } from "better-auth/plugins"
import { getDb, type Db } from "./db"
import { workerEnv } from "./env"
import { sendCode } from "./mail"
import { authAccount, authSession, authUser, authVerification } from "./schema"

/** Sign-in is a six-digit code sent by email. No passwords. */
function buildAuth(db: Db) {
  const env = workerEnv()
  return betterAuth({
    appName: "Thai Tax Calculator",
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: { user: authUser, session: authSession, account: authAccount, verification: authVerification },
    }),
    session: {
      expiresIn: 60 * 60 * 24 * 60,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    trustedOrigins: env.APP_URL ? [env.APP_URL] : [],
    advanced: { database: { generateId: () => crypto.randomUUID() } },
    emailAndPassword: { enabled: false },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 60 * 10,
        allowedAttempts: 5,
        async sendVerificationOTP({ email, otp }) {
          await sendCode(email, otp)
        },
      }),
    ],
  })
}

type Auth = ReturnType<typeof buildAuth>
const instances = new WeakMap<object, Auth>()

export function getAuth(): Auth {
  const db = getDb()
  let auth = instances.get(db)
  if (!auth) {
    auth = buildAuth(db)
    instances.set(db, auth)
  }
  return auth
}

export async function sessionUser(headers: Headers): Promise<{ id: string; email: string } | null> {
  const session = await getAuth().api.getSession({ headers })
  return session ? { id: session.user.id, email: session.user.email.toLowerCase() } : null
}
