# Outdoor e-shop

The project is a Next.js modular monolith for an outdoor equipment shop. Source
code is grouped first by Clean Architecture layer and then by business area:

- `src/domain/{area}`: framework-independent models, rules, and ports.
- `src/application/{area}`: use cases and orchestration.
- `src/infrastructure/{area}`: database, browser API, and external adapters.
- `src/presentation/{area}`: UI, client entry points, and input/output mapping.
- `src/composition/client` and `src/composition/server`: client- and
  server-side composition roots that wire application use cases to
  infrastructure adapters.
- `src/app`: Next.js routes and API endpoints.
- `src/components`: UI components shared across areas.
- `src/server`: server-only helpers that are not business or infrastructure
  adapters, such as HTTP request parsing.

Products owns catalog search, categories, product details, and catalog API
contracts. Cart owns cart operations; Checkout owns order creation and its
atomic cart, stock, order, and payment transaction. Session owns identity and
session lifecycle; Customer owns account data and favorite-color state.

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

Login throttling is held in process memory, so each application process enforces
its own 10-attempt, 15-minute window per normalized email. This is bounded but
is not distributed protection; use a shared rate-limit store before scaling
across multiple processes. The application also reads `x-forwarded-for` for
session metadata, so the deployment proxy must overwrite that header rather
than forward a client-supplied value.
