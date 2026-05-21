# Wishy

A simple, open family wishlist with no affiliate links, no ads, and no algorithms. Just wishlists.

## Why Wishy?

Existing wishlist platforms replace links with affiliate URLs, suggest products based on trends, and collect detailed behavioral data. Wishy does none of that. It's a straightforward tool for sharing what you actually want.

## Tech stack

- **Frontend:** SvelteKit 2 + Svelte 5, Tailwind CSS 4, adapter-static (SPA)
- **Backend:** Firebase (Auth, Firestore, Cloud Functions v2, Storage)
- **Email:** Resend
- **Scraping:** open-graph-scraper + OpenAI for product data extraction
- **Languages:** Danish and English (i18n)

## Features

- Passwordless email login (Firebase Auth email-link)
- Create and manage wishlists with drag-and-drop ordering
- Paste a product URL to auto-fill name, image, price, and notes
- Mark items as favorites
- Share your list via a public `/lists/{username}` link
- Visitors can reserve gifts via email confirmation (token-based)
- Unreserve only via email link (no spoilers)
- Confirmation gate so list owners don't accidentally see reservations
- Apple Shortcuts integration for adding wishes from Safari
- Admin panel for user management
- Notification email when a new wishlist is created

## Project structure

```
src/
  lib/
    components/    Svelte components (WishItem, ReserveModal, etc.)
    i18n/          Danish (da.ts) and English (en.ts) translations
    stores/        Auth and locale stores
    firebase.ts    Firebase client init
    types.ts       TypeScript interfaces
  routes/
    +page.svelte            Home — list of all wishlists
    login/                  Passwordless login flow
    my-list/                Owner's wishlist dashboard
    lists/[username]/       Public shared wishlist view
    reserve/confirm/        Email reservation confirmation
    reserve/cancel/         Email unreserve confirmation
    settings/               User settings + API key + Apple Shortcut setup
    about/                  About page
    admin/                  Admin panel
functions/
  src/index.ts              Cloud Functions (login email, scraping, reservations, notifications)
firestore.rules             Security rules
firestore.indexes.json      Composite indexes
```

## Getting started

### Prerequisites

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project with Auth, Firestore, and Storage enabled
- A [Resend](https://resend.com) account for transactional email
- An OpenAI API key for product data extraction

### Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

2. Create a `.env` file with your Firebase config:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. Set Cloud Functions secrets:

   ```bash
   firebase functions:secrets:set RESEND_API_KEY
   firebase functions:secrets:set RESEND_FROM
   firebase functions:secrets:set OPENAI_API_KEY
   firebase functions:secrets:set TURNSTILE_SECRET_KEY
   ```

4. Deploy Firestore rules and indexes:

   ```bash
   firebase deploy --only firestore
   ```

5. Run locally:

   ```bash
   npm run dev
   ```

6. Deploy:

   ```bash
   npm run build
   firebase deploy
   ```

## License

Private project.
