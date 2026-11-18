# Contributor and agent guide

Thai Tax Calculator: an English/Thai calculator for Thai personal income tax and
a company-versus-personal comparison. The tax engine in `src/tax/` is the core of
the repository; the web app is its reference interface. See `README.md` for
setup, the engine API and deployment.

## Commands

```
npm run dev                # web app on http://localhost:3000
npm test                   # vitest, engine fixtures from the research notes
npm run typecheck          # the whole project
npm run typecheck:engine   # src/tax on its own, with no DOM or app types
npm run check              # both type checks, then the tests
npm run build              # production build for Cloudflare Workers
```

## Shape

- `src/tax/` the engine, pure TypeScript with no imports from outside the
  folder. Keep it that way: `npm run typecheck:engine` fails if it reaches into
  the app. Year-specific amounts live in `years.ts` and `allowances.ts`.
- `research/*.md` the rules the engine implements, each with its source and a
  confidence tag. Change a rule in the engine only with a source, and add a
  test in `src/tax/engine.test.ts`.
- `src/features/{personal,company,forms,rules}` one folder per page.
- `src/features/account`, `src/server`, `db/migrations` the optional accounts
  feature (Better Auth, D1, Resend). It is off unless the Worker has a `DB`
  binding and `BETTER_AUTH_SECRET`; every account control is hidden when off.
- `src/data/forms.ts` the forms catalog. Previews in `public/forms/*.jpg` are
  rendered from the official Revenue Department PDFs with `pdftoppm` (page
  width 900, JPEG quality 72).
- Routes are `/$lang/...` with `en` and `th`; `/` redirects by Accept-Language.

## Keeping it current

- The 2569 PND 90/91 and deductions attachment are expected in late December
  2569 on https://www.rd.go.th/68191.html. When they are published: set
  `provisional: false` for 2569 in `years.ts`, renumber the 2569 attachment
  items, and re-render the previews.
- Pending as of 4 November 2569: the flood repair deduction (shown as "Pending
  law"), renewal of the 8-day e-filing extension, and any 2569 Easy E-Receipt.
- 2570 is a projected year (`projected: true`).

## Copy

Professional register, sentence case, no em dashes, no emojis. Every interface
string exists in both languages as `{ en, th }`.

## Secrets

Never commit `.dev.vars`, `.env*`, account ids or database ids. Placeholders
belong in `.dev.vars.example` and in the commented blocks of `wrangler.jsonc`.
