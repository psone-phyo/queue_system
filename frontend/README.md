# Queuewell frontend

React + TypeScript web app for the clinic patient flow, public display, and staff desk.

## Run locally

1. Start the backend API on port `3000`.
2. Copy `.env.example` to `.env` if the API uses a different URL.
3. From this directory run `npm install`, then `npm run dev`.

Vite serves the app on port `5173`, which matches the backend's default client origin. Patient queue state uses an httpOnly cookie; staff access uses the backend's login and refresh endpoints.

## Commands

- `npm run dev` — generate Tailwind styles and start Vite
- `npm run build` — type check and make a production build
- `npm run test:run` — run UI tests in Vitest

Tailwind utility CSS is generated from `src/styles.css` when starting or building the app. Do not edit `src/styles.generated.css` directly.
