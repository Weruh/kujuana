# Kujuana - Dating with Intention

Kujuana is a full-stack dating experience crafted for Africans across the continent and in the diaspora who are 25+ and ready for purpose-driven relationships that lead to marriage. The product marries the fast swipe UX people expect with thoughtful profiling, cultural nuance, and a strict no-nonsense policy on explicit or irrelevant content.

## Project Structure

```
kujuana/
|- server/      # Express + LowDB API (auth, profiles, matching, payments)
|- frontend/    # Vite + React client (onboarding, discovery, upgrades)
```

## Core Features

- Multi-step onboarding that captures values, faith, goals, and interests.
- Curated swipe deck with shared-interest scoring and rewind support.
- Profile dashboard with completion checklist and editable preferences.
- Match view with daily stats and concierge prompt.
- Upgrade pathways highlighting incognito mode, boosts, and premium coaching.
- Payment split: Paystack (M-Pesa) for African users and Stripe for the diaspora.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### 1. Backend API

```bash
cd server
cp .env.example .env          # customise secrets and URLs
npm install
npm run dev                   # http://localhost:4000
```

Data is stored in `server/src/data/db.json` via LowDB for quick demos. Swap this for a real database (Postgres, MongoDB, etc.) before production.

### 2. Frontend client

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the backend.

## Environment Variables

Configure `server/.env`:

| Variable              | Purpose                                           |
|-----------------------|---------------------------------------------------|
| `PORT`                | API port (default 4000)                           |
| `APP_URL`             | Frontend base URL for payment redirects           |
| `JWT_SECRET`          | Secret for signing JSON web tokens                |
| `JWT_EXPIRES_IN`      | Token lifetime (for example `7d`)                 |
| `STRIPE_SECRET_KEY`   | Stripe secret for diaspora billing                |
| `PAYSTACK_SECRET_KEY` | Paystack secret for M-Pesa/African billing        |

If Stripe or Paystack keys are missing, the API returns placeholder checkout URLs so flows stay testable.

## API Overview

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Register intentional singles with profile basics and goals |
| `POST /api/auth/login` | Authenticate and receive a JWT |
| `GET /api/profile/me` | Fetch the authenticated profile |
| `PUT /api/profile/me` | Update profile, interests, goals, photos |
| `GET /api/profile/me/checklist` | Onboarding completion progress |
| `GET /api/match/suggestions` | Curated swipe deck |
| `POST /api/match/swipe` | Send like or pass decision and detect matches |
| `GET /api/match/mine` | List confirmed matches |
| `GET /api/match/stats` | Daily swipe and match counts |
| `GET /api/payments/plans` | Membership plans |
| `POST /api/payments/checkout` | Launch checkout via Stripe or Paystack |
| `POST /api/payments/activate` | Mark a plan active after webhook confirmation |

## Frontend Highlights

- Landing page that positions Kujuana as a respectful, marriage-focused community.
- Guided registration with interest and goal selectors tailored to mature daters.
- Swipe deck featuring like, pass, and rewind with contextual tips.
- Profile management with a completion checklist and upgrade callouts.
- Upgrade screen that differentiates local and diaspora billing options.

## Future Enhancements

- Replace LowDB with a hosted database and an ORM such as Prisma.
- Add secure media uploads, verification, and moderation workflows.
- Build conversation concierge tools with guardrails and optional human review.
- Introduce compatibility questionnaires and curated virtual mixers.
- Integrate email/phone verification, 2FA, and security monitoring.
- Complete payment webhooks and automated renewal billing.

## Community Guardrails

- Straight-only matching logic to reflect the stated positioning.
- Hardline stance against nudity or irrelevant content with space for moderation hooks.
- Age gate set at 25+ with configurable preferences.
- Emphasis on respect, cultural nuance, and marriage-focused outcomes.

Happy building, and here is to more intentional African love stories.
