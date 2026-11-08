# Outdoor e-shop

The project is a Next.js modular monolith for an outdoor equipment shop. Source
code is grouped first by business area, then by Clean Architecture layer:

- `src/app`: Next.js routes, API endpoints, and presentation code; URL paths
  remain unchanged.
- `src/app/(routes)`: page route entry points; the route group does not
  contribute a segment to the URL.
- `src/app/pages/{page}`: page-specific presentation, sections, and styles.
  These directories do not contain Next.js `page.tsx` or `route.ts` files;
  route entry points live in the corresponding `(routes)` URL directories.
  Login and registration share their presentation in `pages/auth`.
- `src/app/_components`: UI components shared across pages.
- `src/features/{area}/domain`: framework-independent models, rules, and ports.
- `src/features/{area}/application`: use cases and orchestration.
- `src/features/{area}/infrastructure`: database and browser API adapters.
- `src/features/{area}/composition`: feature client and server wiring.
- `src/features/products/contracts`: catalog HTTP response contracts.
- `src/shared`: shared domain utilities, database client, HTTP helpers,
  and composition that connects different features.

Products owns catalog search, categories, product details, and catalog API
contracts. Cart owns cart operations; Checkout owns order creation and its
atomic cart, stock, order, and payment transaction. Session owns identity and
session lifecycle; Customer owns account data and favorite-color state.

Client-side HTTP adapters live in infrastructure and are wired through
the feature's `composition/client`. Page presentation may use shared UI but
must not import another page's internals. The ESLint architecture rule checks
layer dependency direction, cross-module infrastructure imports, and page
presentation imports, including relative imports and re-exports; it does not
attempt to enforce every business ownership boundary.

## Development

Install dependencies, configure the database environment, then run:

```bash
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

## Database

```bash
npm run db:migrate
npm run db:seed
```

The seed is idempotent and can be run repeatedly. The catalog API reads active
products from PostgreSQL through Drizzle:

```text
GET /api/products?q=Kriváň&category=hardshell-bundy&limit=24
GET /api/products/krivan-pro-3l
```

## Verification

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Deployment notes

Login throttling uses PostgreSQL: each IP is limited to 50 attempts per 15
minutes, with a further limit of 10 attempts per IP and normalized email.
Apply the migrations before deploying this version; login fails if the database
table is unavailable. The application reads `x-forwarded-for`, so the deployment
proxy must overwrite that header rather than forward a client-supplied value.
Without an IP header all requests share an `unknown` bucket.

Packeta is not offered until pickup-point selection is implemented. Guest cart
merging preserves requested quantities even if they exceed stock or the
99-item limit; customers are prompted to adjust those items before checkout.
Checkout delivery details are stored in the browser's session storage and
removed after a successful order.
