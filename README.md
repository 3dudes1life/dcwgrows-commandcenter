# DCW Grows Command Center

A professional starter dashboard for DCW Grows: orders, sales stats, inventory, reviews, shipping status, and marketing attribution.

## What is included

- Home dashboard with revenue, orders, profit estimate, Etsy sales goal, and best seller cards
- Order Hub with Etsy + Shopify mock orders
- Inventory tracker with low-stock alerts
- Marketing attribution tracker for Pinterest, Etsy Search, Instagram, Google, Shopify, and Direct traffic
- Product leaderboard
- Review dashboard with reply status
- Weekly CEO report section
- Clean responsive UI for desktop and mobile
- Mock data in `src/data.js` so you can start fast

## How to run locally

Open `index.html` directly in a browser, or run:

```bash
npm start
```

Then visit:

```text
http://localhost:5173
```

No build step required.

## Where to add real integrations later

Start with `src/data.js`. Replace the mock arrays with API responses from:

- Etsy API for orders, listings, reviews, and traffic
- Shopify Admin API for orders, products, and revenue
- Pinterest Analytics API for pin clicks and outbound traffic
- Google Analytics / Search Console for site traffic
- Shipping provider API for tracking and fulfillment

## Suggested GitHub repo name

```text
dcw-grows-command-center
```

## Recommended next build steps

1. Add login/password protection before using real order data.
2. Connect Shopify first because its API is usually cleaner.
3. Add Etsy order import next.
4. Add Pinterest tracking links using UTM codes.
5. Add a backend or serverless functions before storing API keys.

Never put API keys directly in frontend JavaScript.
