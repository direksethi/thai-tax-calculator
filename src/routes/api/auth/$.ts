import { createFileRoute } from "@tanstack/react-router"
import { getAuth } from "@/server/auth"
import { accountsConfigured } from "@/server/env"

const handle = (request: Request) =>
  accountsConfigured() ? getAuth().handler(request) : new Response("Accounts are not enabled on this deployment.", { status: 404 })

// Better Auth's own endpoints: send a code, sign in with it, read or end the session.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
})
