# Integration notes — MilktyWay Guest-first v3

- Account routes, account page, account icon and account bottom-navigation item have been removed.
- Mobile bottom navigation now contains Home, Menu and Cart.
- Ordering is guest-first; checkout collects recipient name, phone, delivery address and optional note.
- Optional membership phone/code is entered during checkout. Demo number `0900000001` triggers 10% membership discount; replace this client-side demonstration with a server membership validation API.
- Coupon `CHAO10` remains independent from membership discount.
- Demo order remains browser-local and is not sent to any store/backend.
- Before production, integrate server APIs for branch, menu, availability, member validation, pricing and order creation.
