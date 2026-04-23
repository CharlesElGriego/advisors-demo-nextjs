# Advisor Listings

Next.js implementation of the advisor listings exercise.

## Run locally

1. Install dependencies: `npm install`
2. Start the app in development: `npm run dev`
3. Open `http://localhost:3101/advisors`

For a production run:

1. Build the app: `npm run build`
2. Start the server: `npm start`

## Main scripts

- `npm run dev`
- `npm run build`
- `npm start`
- `npm run lint`
- `npm run format:check`
- `npm run test:unit`
- `npm run test:e2e`

## What is included

- Advisor list page at `/advisors`
- Call and chat buttons with enabled/disabled states
- Loading, empty, and error states
- 30-second availability polling with a custom hook
- Responsive layout built with SCSS Modules
- Unit and E2E test coverage

## Project structure

- `app/advisors/page.tsx`: page shell
- `components/advisors/AdvisorList.tsx`: data loading and UI states
- `components/advisors/AdvisorCard.tsx`: advisor card UI
- `hooks/useAdvisorAvailability.ts`: availability polling
- `services/advisors.service.ts`: API access and normalization
- `types/advisor.ts`: domain types
- `constants/`: API URLs, polling interval, and fallback data

## Notes

- The app currently uses the Beeceptor endpoints that replaced the original Mockable URLs during implementation.
- The availability mock is only fully configured for some ids, so the polling layer keeps the last known availability when the mock returns an unusable response.
- If you want to disable the local listings fallback, run: `NEXT_PUBLIC_ENABLE_API_FALLBACK=false npm run dev`

## AI assistance

- Warp with `gpt-5.4 (xhigh)` was used to help document the project and to support the unit and E2E testing work.
- The core app implementation itself was kept focused on the project code: page structure, UI behavior, data fetching, polling, and styling.
