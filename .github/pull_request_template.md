## What does this PR do?

<!-- One paragraph: what problem does this solve and how? Link the issue if there is one. -->

## How to test

<!-- Step-by-step instructions a reviewer can follow to verify the change works.
     Include any env vars, seed data, or feature flags needed. -->

## Checklist

- [ ] Lint passes (`pnpm lint` — zero warnings)
- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Tests pass (`pnpm test`) and new behaviour has test coverage
- [ ] No hardcoded secrets, credentials, or `.env` values in the diff
- [ ] No new `any` types — `unknown` + narrowing or a real type used instead
- [ ] Multi-tenant queries are scoped by `org_id` (new tenant-owned tables have an RLS test)
- [ ] Money values are integer minor units — no floats
- [ ] All user-facing strings go through `packages/i18n` — no hardcoded copy
