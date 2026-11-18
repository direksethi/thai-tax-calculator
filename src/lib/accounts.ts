import { getRouteApi } from "@tanstack/react-router"

const langRoute = getRouteApi("/$lang")

/**
 * Whether this deployment has sign-in and saved returns (a D1 database and an
 * auth secret on the Worker). Without them the calculators keep figures in the
 * browser and no account control is shown. Resolved once by the /$lang loader.
 */
export function useAccountsEnabled(): boolean {
  return langRoute.useLoaderData().accounts
}
