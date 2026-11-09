# Integration notes — MilktyWay Guest-first v3

- Account routes, account page, account icon and account bottom-navigation item have been removed.
- Mobile bottom navigation now contains Home, Menu and Cart.
- Ordering is guest-first; checkout collects recipient name, phone, delivery address and optional note.
- Demo order remains browser-local and is not sent to any store/backend.
- Before production, integrate server APIs for branch, menu, availability, member validation, pricing and order creation.
- Member benefit: fixed 3,000 VND discount for valid
  member phone numbers.
- Point redemption: 1 point = 1,000 VND.
- Customer lookup is consolidated at `/tra-cuu`.
- Phone lookup uses mock OTP 123456 in the frontend demo.
