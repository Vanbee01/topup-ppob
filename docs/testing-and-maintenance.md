# Testing & Maintenance Plan — TopUpKita

**Status:** Test record v1.0 and operational checklist  
**Phase:** 4 — Testing / Phase 5 — Maintenance  
**Date:** 2026-11-16

## 1. Test scope and evidence

### Verified in this work
- GitHub source commit `7971be9` was built and deployed to Railway production.
- Railway reports deployment `c531b46b-e4d1-4994-8ed4-358910f74009` as `SUCCESS`.
- Runtime log shows `TopUpKita listening on 3000`.
- Railway domain is configured on port 3000: `topup-ppob-web-production.up.railway.app`.
- The immediately preceding deployment failed at startup with a JavaScript syntax error in the admin orders query. The query was rewritten using a template literal in the current release.
- The current release log also warns that express-session MemoryStore is not suitable for production. This remains a production-hardening item.

### Not yet verified end-to-end
- Guest order creation against the persistent production SQLite volume after the schema migration.
- Admin login and admin order-list rendering after the corrected release.
- Browser-level mobile/desktop layout, all game cards, and third-party artwork availability/usage rights.
- Secure invoice lookup (not implemented yet).
- Real payment webhook signature verification and duplicate-event handling (provider not selected).
- Supplier fulfilment, callback, retries, and reconciliation (supplier not selected).
- Backup restoration and disaster-recovery timing.

Do not treat an unexecuted test as passed. A successful container start is not equivalent to successful checkout or live delivery.

## 2. Functional test matrix

| ID | Test | Expected result | Current evidence |
|---|---|---|---|
| T-01 | GET `/health` | HTTP 200, `{ok:true}` | Runtime started; endpoint request still to be verified |
| T-02 | GET `/api/products` | Active catalogue only | Previously observed successful requests before latest release |
| T-03 | Guest POST `/api/orders` with valid product + target | Invoice created; payment clearly marked not configured | Code path implemented; production DB migration requires live test |
| T-04 | Guest order with invalid product | HTTP 404 | Code validation implemented; runtime test pending |
| T-05 | Guest order with invalid target | HTTP 400 | Code validation implemented; runtime test pending |
| T-06 | GET `/api/admin/summary` without login | HTTP 401 | Middleware present; runtime test pending |
| T-07 | GET `/api/admin/orders` as admin | Rows include guest orders as “Pesanan tamu” | SQL syntax corrected; runtime test pending |
| T-08 | Duplicate order submit | No duplicate fulfilment | Idempotency protection not yet implemented |
| T-09 | Payment webhook | Verify signature, amount, invoice, event uniqueness | Not implemented; provider unselected |
| T-10 | Supplier callback | Authenticated, reconciled supplier result | Not implemented; supplier unselected |

## 3. Release checklist

Before every production release:
1. Review the diff and confirm no secrets or local database files are committed.
2. Run syntax checks and automated tests locally/CI.
3. Test catalogue and guest checkout against a disposable database.
4. Test admin authorization and guest-order visibility.
5. Deploy once; wait for a terminal Railway `SUCCESS`.
6. Inspect runtime logs for startup errors and warnings.
7. Check `/health`, storefront, catalogue, and admin routes.
8. Confirm the production volume is mounted at `/app/data`.
9. Keep a rollback target and record the deployed commit hash.

## 4. Maintenance schedule

### Every day / when orders are enabled
- Review service health, recent deployment status, failed requests, and application errors.
- Reconcile pending payments and supplier transactions against provider dashboards.
- Investigate every ambiguous supplier response before retrying.

### Weekly
- Review failed login/order attempts and rate-limit events.
- Check SQLite database size, disk usage, and volume availability.
- Verify no credentials, tokens, or customer destination details are written to logs.
- Review active catalogue and remove stale demo/test products from any live storefront.

### Monthly
- Create and verify a database backup; perform a restore test in a separate environment.
- Review admin accounts and rotate credentials when needed.
- Update dependencies after reviewing breaking changes and security advisories.
- Review integration contracts, fees, supplier SKU mappings, and support/refund procedures.

## 5. Backup and recovery

- The SQLite database is stored under `DATA_DIR` (production volume mounted at `/app/data`).
- Back up the database using a SQLite-consistent backup method; do not copy only the main database file while WAL writes are active.
- Keep encrypted backups outside the same Railway volume and define retention with the operator.
- Test restore into an isolated environment before relying on a backup.
- Record recovery-point and recovery-time objectives once the business defines them.
- If concurrent traffic or write volume grows, plan migration from SQLite to managed PostgreSQL with tested migration and rollback steps.

## 6. Production blockers before accepting real payments

1. Replace express-session MemoryStore with a persistent production session store.
2. Implement idempotency keys for order creation and webhook processing.
3. Implement secure guest invoice lookup using a high-entropy verification token (store only its hash).
4. Select and configure a payment provider; verify signatures, amount, invoice, replay protection, expiry, refunds, and sandbox behavior.
5. Select and configure a legitimate supplier; confirm game-specific fields, SKU mapping, balance, callbacks, duplicate protection, and reconciliation.
6. Add a durable fulfilment queue/outbox and manual-review workflow.
7. Confirm legal operator identity, support contact, privacy notice, terms, and refund policy.
8. Replace illustrative prices/catalogue with supplier-verified SKUs and prices.
9. Verify authorized artwork sources and remove broken or unlicensed images.
10. Complete end-to-end tests and a backup restore drill.

## 7. Maintenance status

The application is deployed and starts successfully, but it remains a demo/prototype for catalogue browsing and order capture. Payment processing and automatic top-up delivery are not enabled. Keep the demo notice visible until all production blockers above have been resolved and verified.
