# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Smart Discount Manager is an embedded Shopify Admin app (React Router v7 + `@shopify/shopify-app-react-router`, Polaris UI, Prisma on PostgreSQL, SendGrid email). Two flows share one database table:

1. **Manual discounts** — merchants create/edit/activate/deactivate/delete Shopify discount codes from the admin UI.
2. **Automatic cashback rewards** — delivered orders get a customer-specific, single-use, fixed-amount discount code that is saved to the DB and emailed to the customer.

`README.md` holds the detailed end-to-end flow docs (with diagrams); read it before touching the cashback pipeline.

## Commands

```bash
npm run dev         # shopify app dev (tunnel + local server; needs Shopify CLI login)
npm run build       # react-router build
npm run start       # serve ./build/server/index.js
npm run setup       # prisma generate && prisma migrate deploy
npm run lint        # eslint (uses .gitignore as ignore path)
npm run typecheck   # react-router typegen && tsc --noEmit
npm run deploy      # shopify app deploy (pushes shopify.app.toml config)
npx prisma migrate dev --name <name>   # create a new migration after editing schema.prisma
npm run docker-start                   # setup + start (used by the Dockerfile)
```

Node `>=20.19 <22 || >=22.12`. There is no test suite. Required env vars (see `.env.example`): `DATABASE_URL`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `CRON_SECRET` (≥32 chars; cron endpoints return 401 without it); Shopify credentials (`SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES`) are injected by `shopify app dev`. `prisma.config.ts` loads `.env` via `dotenv`.

## Architecture

- **Routing** is file-based via `flatRoutes()` (`app/routes.js`). `app.*` routes render inside the embedded admin shell (`app/routes/app.jsx`); `app.api.*` routes are JSON loaders/actions; `webhooks.*` handle Shopify webhooks declared in `shopify.app.toml`.
- **Layering:** route → `authenticate.admin(request)` / `authenticate.webhook(request)` from `app/shopify.server.js` → service in `app/services/` → Shopify Admin GraphQL (`admin.graphql`) and/or Prisma (`app/db.server.js`). Files suffixed `.server.js` are server-only; `discount.service.js` and `resourcePicker.service.js` are client-side helpers (`fetch` to `/app/api/discounts`, App Bridge resource picker).
- **Manual discount UI flow:** `app.discounts.new` / `app.discounts.$id.edit` render `components/discounts/DiscountForm.jsx` (a stack of Polaris cards) → `hooks/useDiscountSubmit.js` validates with `utils/validateDiscount.js` and POSTs the raw form state through `services/discount.service.js` (the GraphQL input is built server-side). Reads go through `services/discount.server.js` (list/detail loaders) and `services/discount-offers.server.js` (`app.api.discount-list`).
- **Manual discount mutations** all go through a single POST action, `app/routes/app.api.discounts.jsx`, dispatched on `body.mode` (`edit` / `delete`; anything else creates — activate/deactivate happen inside `edit` when `status` changes between `active` and `draft`). It calls `app/services/shopify-discount.server.js`, which builds GraphQL input via `app/utils/discount-builder.server.js`, then mirrors the result into the `DiscountOffer` row.
- **Scheduled jobs:** `services/scheduled-jobs.server.js` defines `process-cashback-rewards` and `discount-expiry`. They run via `POST /api/cron/<job>` (`api.cron.$job.jsx`, `Authorization: Bearer $CRON_SECRET`, optional `?shop=`; uses `unauthenticated.admin(shop)` for every shop with an offline session) or manually via the admin loaders `app.api.process-cashback-rewards` / `app.api.discount-expiry`. Both paths share an in-memory per-shop lock, so run a single Node process. The cron itself is external (crontab / Task Scheduler) — see `docs/NGINX_DEPLOYMENT.md`.
- **Cashback pipeline:**
  `order.service.server.js#getDeliveredOrders` (fulfilled orders, filtered in JS by `custom.order_status = delivered`, `custom.order_delivered_at` within a UTC-day window of `rewardEligibilityDays` to `rewardEligibilityDays + rewardGracePeriodDays` days ago, and no returns) → `reward.service.server.js#syncOrdersToRewards` (eligibility, duplicate check, cashback = `currentTotalPriceSet` × `cashbackPercentage`; cancelled and zero-total orders skipped) → `reward-coupon.service.server.js` + `utils/reward-discount-builder.server.js` (`discountCodeBasicCreate`) → `reward-discount-offer.service.server.js` (DB insert, `source: AUTO_REWARD`) → `reward-email.service.server.js` (SendGrid; sets `emailSentAt` on success).
  Shopify discount creation and the DB insert are not atomic; on a failed insert the code deletes the just-created Shopify discount (same compensation in manual create). Reward emails are sent once and never retried (by design — vouchers are also shown on the storefront).
- **Reward redemption:** `webhooks.orders-create.jsx` looks up applied discount codes on new orders and marks matching `AUTO_REWARD` offers `status: "used"`.
- **Expiry:** `app.api.discount-expiry.jsx` → `discount-expiry.server.js` deactivates in Shopify and updates DB for active offers past `endDate`.
- **Storefront vouchers:** `proxy.customer-discounts.jsx` is served through the Shopify App Proxy (`[app_proxy]` in `shopify.app.toml`: storefront `/apps/smart-discount/*` → `/proxy/*`). It uses `authenticate.public.appProxy` and takes the customer only from Shopify's signed `logged_in_customer_id`; never accept a customer ID from the client.
- **Customer IDs:** always normalise with `utils/customer-ids.server.js#toCustomerGids` (accepts numeric IDs, GIDs, comma lists). Nullable `Json` columns are written with `Prisma.DbNull` and filtered with `Prisma.AnyNull`.
- **Discount updates** (`buildUpdateInput`) must send cleared fields as `null` (`endsAt`, `usageLimit`, minimum subtotal) and removed customers via `context.customers.remove`; Shopify keeps any omitted value.

## Data & settings

- `DiscountOffer` (in `prisma/schema.prisma`) stores both manual and cashback discounts, distinguished by `source` (`MANUAL` | `AUTO_REWARD`). Cashback-only fields (`orderId`, `cashbackAmount`, `deliveredAt`, `emailSentAt`, …) are nullable. `@@unique([shop, orderId])` is the DB-level duplicate guard. `status` is a free string (`active`, `draft`, `used`, …), not an enum. There is no separate Reward table.
- `Session` is used by `PrismaSessionStorage` for Shopify auth.
- App settings live in a **shop metafield** (`$app` / `smart_discount_settings`, JSON), not the DB. `settings.service.server.js` merges stored JSON over `DEFAULT_SETTINGS`; values are stored as strings. Adding a setting means updating `DEFAULT_SETTINGS`, the form + `action` in `app.discounts.settings.jsx`, and every consumer. Services that need settings must call `getShopSettings(admin)`, not read form data.
- The order-fetch window is driven by `rewardEligibilityDays` + `rewardGracePeriodDays`; an order not processed within that grace window is never rewarded.
- The app uses `@prisma/client` (generator `prisma-client-js`). The git-ignored `generated/prisma` folder is a stale artifact from a different generator and is not imported.

## Gotchas

- Shopify API version: `ApiVersion.July26` in `shopify.server.js` and `.graphqlrc.js`; webhooks in `shopify.app.toml` use `2026-10`. Keep them consistent when changing either.
- `shopify.app.toml` still contains template leftovers (`demo_info` product metafield, `example` metaobject, `example.com` URLs).
- `extensions/` is empty; the app has no theme or function extensions.
- Project MCP config (`.mcp.json`) wires up the Shopify Dev MCP server; use it for Admin GraphQL schema lookups.
