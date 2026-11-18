# Thai Tax Calculator

A TypeScript engine for Thai personal income tax, with a company-versus-personal
comparison, and a bilingual (English and Thai) web calculator built on top of it.

The engine in `src/tax/` is the core of this repository. It is pure TypeScript
with no runtime dependencies and no imports from the web app, so it can be used
on its own. The web app is the reference interface for it.

Built by [Direk Sethi](https://direksethi.com).

## Who it is for

- Developers who need Thai personal income tax arithmetic in their own product
  and want rules that cite their sources.
- Employees, freelancers and small business owners in Thailand who want to
  estimate a return, or to see whether running their work through a company
  would change the tax.

## Not tax advice

This software produces estimates. It is not tax, legal or accounting advice and
comes with no warranty (see [LICENSE](LICENSE)). Tax rules change and individual
circumstances differ. Confirm every figure against your withholding
certificates, the Revenue Department's own forms and the e-Filing system, or
with a qualified adviser, before you file.

## What it computes

Tax years are Thai Buddhist Era years: 2568 is calendar 2025, 2569 is 2026 and
2570 is 2027. The rules are stated as of 4 November 2026.

Personal income tax (`computePersonal`):

- The progressive rate table under section 48(1) of the Revenue Code, 0% to 35%
  in eight brackets, with a per-bracket breakdown, effective rate and marginal
  rate.
- All eight categories of assessable income under section 40(1) to 40(8), with
  standard or actual expense deductions, including the 40(8) business table.
- Allowances and deductions from the deductions attachment: personal, spouse,
  children, parents, disability care, life and health insurance, social
  security, provident fund, RMF, Thai ESG and Thai ESGX, home loan interest,
  time-limited government measures, and donations, with their individual caps,
  shared caps and year availability.
- The minimum tax of 0.5% of assessable income under section 48(2).
- Dividend tax credit, final withholding that can be left out of the return,
  withholding credits, half-year tax paid (PND 94) and foreign tax credit.
- The age 65 exemption, severance pay taxed separately, and sale of immovable
  property.
- Which form applies (PND 90 or PND 91), whether a return must be filed, the
  line-by-line form rows, and the balance to pay or refund.

Company versus personal (`compareStructures`):

- Tax if the income is earned personally, with standard and, where allowed,
  actual expenses.
- The same income through a Thai company: corporate income tax with the SME
  bands, owner salary, social security, provident fund, depreciation, running
  costs, legal reserve, dividends and the dividend tax credit.
- A search over owner salary levels for the split between salary and dividend
  that leaves the owner with the most, and the full curve of that search.
- An unregistered partnership variant (`unregisteredPartnership`).

## What is provisional

- **2569 is provisional.** The Revenue Department had not published the 2569
  PND 90, PND 91 or deductions attachment when these rules were compiled. The
  2569 figures follow the 2568 forms plus the measures announced by 4 November
  2026, and attachment items are numbered as in 2568. `YEARS[2569].provisional`
  is `true`, and `computePersonal` adds a warning to its result for that year.
- **2570 is a projection** from law already in force (`YEARS[2570].projected`
  is `true`). It exists for planning the following year, not for filing.
- Some 2569 items were pending when the rules were compiled, including the
  flood repair deduction, which the engine marks as pending. See the status
  tags in `research/`.
- Only 2568 reflects published forms and instructions.

## Quick start

Requires Node.js 22 or later.

```
npm install
npm run dev
```

Open http://localhost:3000. No account, API key or configuration is needed.
Figures are kept in the browser's local storage.

## Using the engine as a library

The package is not published to npm. Copy the `src/tax/` folder into your
project, or import it from a checkout. It has no dependencies.

```ts
import { computePersonal, progressiveTax, YEARS } from "./src/tax"

const result = computePersonal({
  profile: { year: 2568, status: "single", senior: false, disabled: false },
  incomes: [
    { id: "salary", category: "40_1", amount: 600_000, withheld: 12_000 },
  ],
  allowances: { pvd: 30_000, socialSecurity: 9_000, life: 20_000 },
  pnd94Paid: 0,
  foreignTaxCredit: 0,
})

result.netIncome // 381000
result.taxDue    // 15600
result.balance   // 3600, tax still to pay after the 12,000 withheld
result.form      // "PND91"

progressiveTax(1_000_000) // 115000
YEARS[2569].provisional   // true
```

The comparison takes one input object describing the business and returns the
personal scenarios, the best company scenario and the salary curve:

```ts
import { compareStructures } from "./src/tax"

const comparison = compareStructures({
  year: 2569,
  personal: { category: "40_8", subtype: "27" }, // resale of goods
  revenue: 3_000_000,
  businessCosts: 1_000_000,
  sharedCosts: 0,
  otherAllowances: 0,
  entity: "company",
  sme: true,
  registeredCapital: 1_000_000,
  salaryMode: "optimize",
  monthlySalary: 0,
  ownerInSso: true,
  pvdRate: 0,
  homeOfficeRent: 0,
  carRent: 0,
  assets: [],
  doubleDeduction: 0,
  entertainment: 0,
  accountingMode: "package",
  accountingPackage: 40_000,
  bookkeepingMonthly: 0,
  audit: 0,
  misc: 0,
  includeFormation: false,
  distribution: 1,
})

comparison.standard.tax     // 150000, personal with the standard deduction
comparison.actual?.tax      // 350000, personal with actual expenses
comparison.company.salary   // 1170000, the owner salary the search settled on
comparison.company.totalTax // all tax in the company structure
```

Entry points and types are exported from `src/tax/index.ts`. Allowance ids are
defined in `src/tax/allowances.ts`, income categories and subtypes in
`src/tax/income.ts` and `src/tax/business-types.ts`. Labels are returned in both
languages as `{ en, th }`.

## Tests and checks

```
npm test                   # vitest: engine fixtures taken from the research notes
npm run typecheck          # the whole project
npm run typecheck:engine   # src/tax alone, without DOM, React or Cloudflare types
npm run build              # production build
npm run check              # both type checks, then the tests
```

`typecheck:engine` is what keeps the engine independent: it fails if anything
in `src/tax/` imports from the app.

## How the rules were sourced

`research/` holds the notes the engine was written from:

- `research/pit-rules.md` personal income tax.
- `research/company-rules.md` corporate tax, dividends, owner pay and running
  costs.
- `research/forms-and-reference.md` forms, line maps, deadlines and the 2569
  changes.

Each rule names its source and carries a confidence tag. Primary sources are
the Revenue Code and the Revenue Department's forms, instructions and
announcements on rd.go.th; secondary sources are marked as such, and
unconfirmed items are listed. The worked examples in the notes are the fixtures
in `src/tax/engine.test.ts`.

The images in `public/forms/` are page renders of official Thai Revenue
Department, Department of Business Development and Social Security Office
forms, made from the PDFs those agencies publish (the Revenue Department's are
at https://www.rd.go.th). The Forms page of the app shows them as previews and
links to the official files. They are included for reference, remain the work
of those agencies and are not covered by this repository's MIT license.

## Project layout

```
src/tax/        the engine and its tests
research/       cited rules research
src/features/   one folder per page: personal, company, forms, rules, account
src/data/       the forms catalog
src/server/     optional accounts: auth, database, mail
db/migrations/  D1 schema for optional accounts
public/forms/   previews of official forms
```

## Optional: accounts

The app can let people sign in with a six-digit email code and save returns to
a database. This is off by default and the calculator does not need it. It
turns on when the Worker has both a D1 binding named `DB` and a
`BETTER_AUTH_SECRET`; until then every account control is hidden and the
sign-in routes redirect to the calculator. It uses Better Auth, Cloudflare D1
and, for sending the code, Resend.

Local setup:

1. In `wrangler.jsonc`, add a comma after the `observability` line and
   uncomment the `d1_databases` block. The placeholder id is enough locally.
2. `cp .dev.vars.example .dev.vars` and set `BETTER_AUTH_SECRET`.
3. `npx wrangler d1 migrations apply thai-tax-calculator --local`
4. `npm run dev`. Without `RESEND_API_KEY` the sign-in code is printed to the
   dev server log.

Placeholders to replace for a real deployment:

| Where | Placeholder | Replace with |
|---|---|---|
| `wrangler.jsonc` | `<your-d1-database-id>` | the id printed by `npx wrangler d1 create thai-tax-calculator` |
| `wrangler.jsonc` | `tax.example.com` in `routes` | your domain, or leave the block commented to use workers.dev |
| `wrangler.jsonc` | `APP_URL` | the public origin of the site |
| `wrangler.jsonc` | `MAIL_FROM` | a sender on a domain verified in your Resend account |
| Worker secret | `BETTER_AUTH_SECRET` | a long random string, set with `npx wrangler secret put BETTER_AUTH_SECRET` |
| Worker secret | `RESEND_API_KEY` | your Resend API key, set with `npx wrangler secret put RESEND_API_KEY` |

Then apply the schema with
`npx wrangler d1 migrations apply thai-tax-calculator --remote`.

## Deployment to Cloudflare

The app is a TanStack Start project that builds to a Cloudflare Worker.

```
npx wrangler login
npm run deploy
```

`npm run deploy` runs the build and `wrangler deploy`. There is no account id
in `wrangler.jsonc`: Wrangler uses the account you are logged in to, or
`CLOUDFLARE_ACCOUNT_ID` if it is set. By default the Worker is served on
workers.dev; uncomment the `routes` block for a custom domain.

Set `VITE_SITE_URL` to the public origin at build time (for example
`VITE_SITE_URL=https://tax.example.com npm run deploy`) to emit canonical,
alternate-language and `og:url` tags. Without it those tags are omitted.

## Keeping it current

When the Revenue Department publishes the 2569 forms, set `provisional: false`
for 2569 in `src/tax/years.ts`, renumber the 2569 attachment items, update
`RULES_AS_OF`, and add tests for anything that changed. `AGENTS.md` has the
contributor notes.

## License

MIT. Copyright (c) 2026 Direk Sethi. See [LICENSE](LICENSE).
