/**
 * The Thai tax engine. Pure TypeScript with no runtime dependencies: nothing
 * here imports from the web app, the server, or any package.
 *
 *   computePersonal    a full personal income tax return (PND 90 / PND 91)
 *   compareStructures  the same work earned personally or through a company
 *   progressiveTax     the section 48(1) rate table on its own
 */
export * from "./types"
export * from "./years"
export * from "./brackets"
export * from "./income"
export * from "./business-types"
export * from "./allowances"
export * from "./personal"
export * from "./company"
