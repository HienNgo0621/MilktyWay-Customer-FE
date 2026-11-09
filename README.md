# MilktyWay Customer Frontend — Responsive v3 (Guest-first)

A self-contained React + TypeScript + Vite customer storefront prototype for MilktyWay. The website is designed for ordering without account registration or login.

## Run locally

Requirements: Node.js 20.19+ or 22+.

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

## Screens and flows

- `/` — Home and featured products.
- `/menu` — Search, category filters, sort, branch availability, product customization.
- `/cart` — Empty-cart recommendations; selected cart rows; quantity changes; item editing and order summary.
- `/tra-cuu` — Unified phone lookup with mock OTP verification, membership information, order history and order tracking.
  - `/checkout` — Guest checkout, delivery details, optional membership phone/code field, branch, COD demo and order summary.
- `/confirmation` — Demo order confirmation.

There is no Account page, registration, login, password, OTP, or account navigation. Users can order as guests. Membership benefits are optionally checked at checkout using a member phone/code; in this prototype, the demo member number `0900000001` receives 10% off.

## Demo behavior and limits

- Products, branches, availability, discounts and shipping are illustrative frontend data.
- Valid demo members receive a fixed 3,000 VND discount.
- Members can redeem points at 1 point = 1,000 VND.
- Orders and member point history are stored in browser localStorage.
- OTP is simulated with the test code 123456.
- Delivery is 15,000 VND below 150,000 VND and free from
  150,000 VND.- Cart, branch, member phone and demo order are stored in current browser localStorage.
- Orders are not submitted to a POS/backend. COD is only displayed; no money is collected.
- Production must validate member eligibility, prices, discounts, stock and orders on the server. Never trust client-calculated totals as payment source of truth.
- Product photos currently use remote Unsplash images; replace with approved MilktyWay assets.

## UX direction

Guest-first checkout: browsing and ordering do not require account creation. The mobile navigation contains Home, Menu and Cart only. Membership is optional at checkout. The UI keeps MilktyWay green/cream and uses the cart patterns observed in Friendship Cakes: clear empty state, recommendations, compact cart items and persistent mobile checkout summary.
