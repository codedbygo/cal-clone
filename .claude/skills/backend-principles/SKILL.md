---
name: backend-principles
description: Backend architecture patterns, API design, database optimization, and server-side best practices for Node.js, Express, and Next.js API routes. Use when designing REST endpoints, services, middleware, Prisma queries, error handling, caching, auth, or background jobs.
license: Apache-2.0
author: affaan-m (ECC)
source: https://www.skillshub.work/skill/ecc-skill-backend-patterns
---

# Backend Development Patterns

Backend architecture patterns and best practices for scalable server-side applications.

## When to Activate

- Designing REST or GraphQL API endpoints
- Implementing repository, service, or controller layers
- Optimizing database queries (N+1, indexing, connection pooling)
- Adding caching (Redis, in-memory, HTTP cache headers)
- Setting up background jobs or async processing
- Structuring error handling and validation for APIs
- Building middleware (auth, logging, rate limiting)

## API Design Patterns

### RESTful API Structure

```typescript
// Resource-based URLs
GET    /api/markets                 # List resources
GET    /api/markets/:id             # Get single resource
POST   /api/markets                 # Create resource
PUT    /api/markets/:id             # Replace resource
PATCH  /api/markets/:id             # Update resource
DELETE /api/markets/:id             # Delete resource

// Query parameters for filtering, sorting, pagination
GET /api/markets?status=active&sort=volume&limit=20&offset=0
```

### Repository Pattern

```typescript
interface MarketRepository {
  findAll(filters?: MarketFilters): Promise<Market[]>
  findById(id: string): Promise<Market | null>
  create(data: CreateMarketDto): Promise<Market>
  update(id: string, data: UpdateMarketDto): Promise<Market>
  delete(id: string): Promise<void>
}
```

### Service Layer Pattern

```typescript
class MarketService {
  constructor(private marketRepo: MarketRepository) {}

  async searchMarkets(query: string, limit: number = 10): Promise<Market[]> {
    const embedding = await generateEmbedding(query)
    const results = await this.vectorSearch(embedding, limit)
    const markets = await this.marketRepo.findByIds(results.map(r => r.id))
    return markets.sort((a, b) => {
      const scoreA = results.find(r => r.id === a.id)?.score || 0
      const scoreB = results.find(r => r.id === b.id)?.score || 0
      return scoreA - scoreB
    })
  }
}
```

### Middleware Pattern

Keep routes thin; push cross-cutting concerns into middleware (auth, logging, validation, error handling).

## Database Patterns

### Query Optimization

- Select only needed columns
- Use indexes for filter/sort columns
- Paginate list endpoints

### N+1 Query Prevention

Batch-fetch related records; use Prisma `include`/`select` deliberately instead of looping queries.

### Transaction Pattern

Use transactions for multi-step writes that must succeed or fail together (e.g. booking creation with overlap checks).

## Caching Strategies

- **Cache-aside**: read cache → miss → DB → write cache
- **Invalidate on write**: clear cache keys when underlying data changes
- Prefer Redis or platform cache for production; in-memory only for single-instance dev

## Error Handling Patterns

### Centralized Error Handler

Map domain errors to HTTP status codes in one place. Never leak stack traces to clients in production.

### Retry with Exponential Backoff

Use for external API calls (Google Calendar, Zoom, SMTP) where transient failures are expected.

## Authentication & Authorization

- Validate tokens at the middleware layer
- Use role/permission checks before mutating resources
- Fail closed: missing auth → 401, insufficient scope → 403

## Rate Limiting

Use a shared store (Redis, gateway, platform limiter) in production — not per-process memory counters behind multiple replicas.

## Background Jobs & Queues

Fire-and-forget side effects (emails, webhooks) should log failures without failing the primary request unless the side effect is critical.

## Logging & Monitoring

Use structured JSON logs with `requestId`, route, and user context. Log errors with enough detail for debugging, not enough to expose secrets.

## Cal Clone project context

This repo uses **Express 5 + Prisma + PostgreSQL (Neon)**:
- Routes live in `backend/src/routes/` — validate with helpers in `backend/src/lib/validate.ts`
- Business logic belongs in `backend/src/services/`
- Errors use `ApiError` + `errorHandler` middleware (`backend/src/middleware/errorHandler.ts`)
- Booking writes use `prismaDirect` transactions on `DIRECT_URL` to prevent double-booking
- Follow existing conventions in `.cursor/rules/api.mdc` and `.cursor/rules/code-quality.mdc`

**Remember**: Backend patterns enable scalable, maintainable server-side applications. Choose patterns that fit your complexity level.
