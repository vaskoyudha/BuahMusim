# Contributing to BuahMusim 🍎

Thank you for considering a contribution! BuahMusim is an open project and every improvement — from fixing a typo to building a new feature — is welcome.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Branch Naming](#branch-naming)
- [Commit Convention](#commit-convention)
- [Pull Request Checklist](#pull-request-checklist)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

Be kind, constructive, and respectful. Harassment of any kind will not be tolerated.

---

## How to Contribute

1. **Fork** the repository and create your branch from `main`
2. **Make your changes** following the conventions below
3. **Test** that everything works (`pnpm --filter @buahmusim/web build`)
4. **Open a Pull Request** against `main` with a clear description

---

## Development Setup

**Prerequisites:** Node.js 20+, pnpm 9+, Python 3.11+

```bash
# 1. Fork + clone
git clone https://github.com/<your-username>/BuahMusim.git
cd BuahMusim

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example apps/web/.env.local
# Add your GROQ_API_KEY if you want AI recommendations during dev

# 4. Seed the database
cd apps/web && npx tsx scripts/seed.ts && cd ../..

# 5. Start the web app
pnpm --filter @buahmusim/web dev
# → http://localhost:3000

# 6. (Optional) Start the ML service in a separate terminal
cd apps/ml-service
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| New feature | `feat/<short-description>` | `feat/city-price-comparison` |
| Bug fix | `fix/<short-description>` | `fix/prediction-cache-stale` |
| Documentation | `docs/<short-description>` | `docs/update-api-reference` |
| Chore / tooling | `chore/<short-description>` | `chore/upgrade-recharts` |
| Refactor | `refactor/<short-description>` | `refactor/db-client-singleton` |

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Scopes (optional):** `web`, `ml`, `shared`, `api`, `ui`, `db`, `docker`

**Examples:**
```
feat(api): add /api/prices/map endpoint for all-city fruit prices
fix(ui): prevent price ticker from overflowing on mobile
docs: add Docker setup instructions to README
chore(deps): upgrade next from 15.0 to 15.1
```

---

## Pull Request Checklist

Before opening a PR, verify:

- [ ] Branch is up to date with `main`
- [ ] `pnpm --filter @buahmusim/web build` passes with zero TypeScript errors
- [ ] No new npm/pip packages added without discussion in an issue first
- [ ] No changes to the SQLite schema without a migration strategy noted in the PR
- [ ] UI changes look correct on mobile (375px) and desktop (1440px)
- [ ] PR description explains **why** the change is needed, not just what changed

---

## Code Style

- **TypeScript** — strict mode throughout. No `any`. No `// @ts-ignore` without comment.
- **Formatting** — the project uses the default Prettier config. Run `pnpm format` if available, or format on save in your editor.
- **Tailwind CSS v4** — utility classes only. No new CSS files unless truly necessary.
- **Components** — functional React components with explicit TypeScript prop types.
- **No new dependencies** without raising an issue first. Keep the bundle lean.
- **Env vars** — any new env variable must be added to `.env.example` with a descriptive comment.

---

## Reporting Bugs

Use the [Bug Report template](https://github.com/vaskoyudha/BuahMusim/issues/new?template=bug_report.md). Please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser / OS / Node version
- Screenshot if it's a UI issue

---

## Requesting Features

Use the [Feature Request template](https://github.com/vaskoyudha/BuahMusim/issues/new?template=feature_request.md). Check the [Roadmap](README.md#️-roadmap) first to see if it's already planned.

---

*Thanks again for contributing — every PR makes BuahMusim better for Indonesian consumers!* 🍎
