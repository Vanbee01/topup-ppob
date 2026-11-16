# Requirements Analysis — Website Top Up Game

**Status:** Draft v1.0  
**Project:** TopUpKita (repository: Vanbee01/topup-ppob)  
**Phase:** 1 — Requirements Analysis  
**Last updated:** 2026-11-16

## 1. Project purpose

Build a responsive game top-up storefront where customers can select a game, enter the correct player/account details, choose a denomination, pay, and track the order. Customers must be able to place an order without creating an account or signing in. Administrator access remains protected.

The production system must not claim that a top-up is paid or delivered until the payment provider and supplier have confirmed the relevant events.

## 2. User roles

### 2.1 Guest customer
- Browse games and available products without signing in.
- Select one game's products only; products from different games must never be mixed in one game's denomination list.
- Enter game-specific destination details with clear labels and validation.
- Review the order, price, fees, and total before payment.
- Select an available payment method and complete checkout.
- Receive an invoice/order reference and check order status without an account.
- Optionally create/sign in to an account if account history is offered; this is not a checkout requirement.

### 2.2 Administrator
- Sign in to a protected admin dashboard.
- View transaction totals and order statuses.
- Create, edit, activate/deactivate games and products.
- Configure selling prices and, where supplier data exists, cost prices/margins.
- Search and inspect orders; handle permitted cancellation/refund/manual review actions with an audit trail.
- Configure and monitor payment-provider and supplier integrations without exposing API secrets in the browser.
- View integration errors and transaction logs.

## 3. Functional requirements

### FR-01 — Game catalogue
- Display a game catalogue with recognizable, properly licensed/authorized game artwork where available.
- Each game has its own detail/top-up page or clearly isolated section.
- Initial catalogue candidates based on the current prototype: Mobile Legends: Bang Bang, Magic Chess: Go Go, Free Fire, PUBG Mobile, Genshin Impact, and Valorant.
- Games and products must be manageable by the administrator; do not hard-code the catalogue as the long-term source of truth.

### FR-02 — Game account input
- The input form is configured per game, not one generic field for every game.
- Each field has a label, placeholder, required/optional setting, length/format validation, and help text.
- Mobile Legends requires Player/User ID and Zone ID/Server as separate fields.
- Other games use their supplier/publisher-required identifier format. Confirm exact fields from the chosen supplier before enabling live sales.
- Show a confirmation step so the customer can verify destination details before paying.

### FR-03 — Product and denomination selection
- Show only products belonging to the selected game.
- Display product name/denomination, selling price, and relevant product description.
- Use a two-column denomination card layout on mobile, based on the supplied visual reference.
- Separate special items/passes from currency denominations when relevant.
- Prices and availability must come from the backend catalogue/supplier configuration, not be trusted from client-submitted values.

### FR-04 — Checkout and order creation
- Guest checkout is supported; no customer login is required.
- Show game, destination fields, selected product, subtotal, fees, discount (if any), and total.
- Backend recalculates price and validates product availability before creating an order.
- Generate a unique invoice/reference for each order.
- Prevent duplicate order submission where possible using idempotency protection.
- Do not create a paid order merely because the customer returns to a success URL.

### FR-05 — Payment
- Intended payment methods: QRIS, e-wallet, bank transfer/virtual account; pulsa is a possible future method only if supported by the selected provider.
- Payment gateway is not yet selected. Midtrans, Xendit, or Duitku are candidates, subject to account approval, fees, supported methods, and API documentation.
- Verify payment through a signed/authenticated server-to-server webhook.
- Handle pending, paid, expired, failed, cancelled, and refunded states.
- Never store raw card credentials or payment secrets in frontend code.

### FR-06 — Supplier fulfilment
- Supplier is not yet selected. Digiflazz and other legitimate game-top-up distributors are candidates; verify game coverage, SKU mapping, price, balance, callback behavior, and terms before choosing.
- Submit fulfilment only after verified successful payment (unless an explicitly approved alternative flow is designed).
- Map each internal product to the supplier's product/SKU code.
- Handle supplier pending, success, failed, timeout, and unknown states.
- Use supplier reference IDs and idempotency/reconciliation to avoid duplicate delivery.
- Provide a safe manual-review path when supplier status is ambiguous; do not blindly retry a potentially completed top-up.

### FR-07 — Order status and tracking
- Customer can look up an order using invoice/reference plus a verification factor (for example, a one-time token or matching contact detail) to prevent disclosure of another customer's order.
- Display clear statuses: awaiting payment, paid/processing, successful, failed, expired/cancelled, and refund processing/refunded where applicable.
- Show timestamps and a concise status history.
- Optional account history may be added, but is not required for guest checkout.

### FR-08 — Admin order management
- Admin can filter/search by invoice, date, game, product, and status.
- Admin can inspect customer-provided destination details, payment reference, supplier reference, and event history.
- Manual status changes must be permission-controlled and audited; an admin must not mark payment successful without evidence.
- Refunds/cancellations must follow payment-provider and supplier capabilities.

### FR-09 — Reporting and configuration
- Report order count, gross sales, fees, supplier cost, and estimated margin only where source data is available.
- Configure storefront content, game/product activation, prices, and integration settings.
- Keep secrets server-side and mask them in the admin interface.

## 4. Non-functional requirements

- Responsive and usable on mobile first, with desktop support.
- Secure transport (HTTPS), secure admin authentication, password hashing, session protection, rate limiting on sensitive endpoints, input validation, and protection against common web vulnerabilities.
- Role-based authorization for all admin endpoints.
- Payment webhook signature/authenticity verification and replay protection.
- Reliable order state transitions and audit logs.
- Database backups and a documented restore procedure.
- Useful operational logs without leaking passwords, API keys, or unnecessary personal data.
- Clear customer-facing error messages and a support/contact path.
- Performance: catalogue and checkout should remain usable on typical mobile connections.
- Accessibility: semantic controls, readable contrast, keyboard focus, and form labels.

## 5. Current implementation baseline and gaps

The existing repository uses HTML/CSS/JavaScript, Node.js/Express, SQLite, and Railway hosting, with GitHub for source control. It contains an initial storefront, customer authentication/session code, product catalogue, order endpoints, and an admin area.

Known gaps to resolve before real public transactions:
- Current catalogue includes demo/sample prices and must not be represented as live supplier pricing.
- Payment adapter is disabled; no live payment gateway has been verified.
- Fulfilment is manual/stubbed; no live supplier integration has been verified.
- Game-specific destination field definitions and supplier SKU mappings require confirmation.
- Guest checkout support has been started and needs end-to-end database/API testing, including migration on the production database.
- Order lookup security, webhook handling, reconciliation, automated tests, backups, and production monitoring need to be completed/verified.

## 6. External decisions and dependencies

These are open decisions, not assumed facts:
1. Legal business/operator identity and support contact details.
2. Payment gateway choice and merchant-account approval.
3. Supplier choice, game coverage, SKU list, API documentation, balance/funding process, and commercial terms.
4. Exact live game catalogue and denomination list for each game, sourced from the chosen supplier.
5. Whether phone number/email is collected for guest order notifications, and the minimum data needed.
6. Domain name and final branding.
7. Refund, cancellation, dispute, and customer-support policy.
8. Hosting/database backup and recovery requirements as traffic grows.

## 7. Acceptance criteria for Phase 1

Phase 1 is complete when:
- Customer, administrator, and system requirements are documented.
- Guest checkout is explicitly defined as the default customer flow.
- Game-specific input requirements are separated from product catalogue requirements.
- Payment and supplier dependencies are clearly marked as unselected until verified.
- Demo prices and manual fulfilment are clearly distinguished from production capabilities.
- Open decisions are recorded without inventing supplier capabilities or live prices.

## 8. Next phase

Proceed to Phase 2 — System & UI/UX Design:
- customer journey and admin flowcharts;
- page wireframes and responsive layouts;
- database ERD/schema, including guest orders, payments, fulfilment attempts, and status history;
- API contracts and state-transition design;
- integration sequence for payment webhook and supplier fulfilment.
