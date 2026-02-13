# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript-based Vercel serverless API that provides weather data from OpenWeatherMap's 3.0 One Call API and aviation METAR data from Garmin. Built with a clean, modular architecture emphasizing type safety and separation of concerns.

## Development Commands

**Prerequisites:**

- Node.js >= 24.x
- Vercel CLI installed globally: `npm i -g vercel`

**Development:**

```bash
npm run dev          # Start Vercel dev server (http://localhost:3000)
npm run test:watch   # Run tests in watch mode while developing
```

**Testing:**

```bash
npm test                # Run all tests
npm run test:coverage   # Run tests with coverage report
npm run test:ui         # Run tests with browser UI
```

**Code Quality:**

```bash
npm run lint         # Check for linting errors
npm run lint:fix     # Auto-fix linting errors
npm run format       # Format all code with Prettier
npm run format:check # Check formatting without modifying files
npm run type-check   # Run TypeScript type checking
npm run check        # Run ALL checks (format, lint, type-check, test)
```

**Deployment:**

```bash
vercel               # Deploy to Vercel
```

The `npm run check` command runs automatically before every Vercel deployment via the `vercel-build` script in package.json. This ensures all quality checks pass before code is deployed.

**Pre-commit Hooks:**

Husky automatically runs before each commit:

- Formats staged TypeScript files with Prettier
- Lints staged files with ESLint (auto-fixes when possible)
- Type-checks the entire project

This ensures all committed code meets quality standards.

## Architecture

### Core Pattern: ApiEndpoint Base Class

All API endpoints extend the abstract `ApiEndpoint` class (lib/ApiEndpoint.ts), which provides:

- Method validation (GET only)
- Token-based authentication via `x-api-token` header
- Query parameter validation
- Centralized error handling
- Consistent response format

Each endpoint must implement:

1. `getRequiredParams()`: Returns array of required query parameter names
2. `process(req)`: Contains endpoint-specific logic, returns the response data

**Example endpoint structure:**

```typescript
class MyEndpoint extends ApiEndpoint {
  private service: MyService;

  constructor() {
    super();
    this.service = new MyService();
  }

  protected getRequiredParams(): string[] {
    return ['param1', 'param2']; // or [] if no params required
  }

  protected async process(req: VercelRequest): Promise<MyOutput> {
    const { param1, param2 } = req.query;
    const data = await this.service.fetchData(param1, param2);
    return { formatted: data };
  }
}

const endpoint = new MyEndpoint();
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return endpoint.handle(req, res);
}
```

### Service Layer

External API calls are encapsulated in service classes (services/):

- `OpenWeatherMapService`: Handles OpenWeatherMap 3.0 One Call API
- `GarminService`: Handles Garmin aviation data API

Services:

- Read API keys from environment variables in constructor
- Throw errors if required environment variables are missing
- Handle URL construction and fetch logic
- Return typed responses

### Type Safety

Full TypeScript coverage with models organized by domain:

- `models/common/`: Shared types (ValidationError)
- `models/weather/`: Weather-specific types (WeatherResponse, WeatherOutput)
- `models/metar/`: METAR-specific types (MetarResponse, MetarOutput, etc.)

Output types (e.g., WeatherOutput) define the final API response format. Response types (e.g., WeatherResponse) define the external API response structure.

## Testing & Quality

### Test Coverage Requirements

- **Minimum thresholds**: 80% lines/functions, 75% branches, 80% statements
- **Current coverage**: 97%+ across all metrics
- Tests are enforced via Vercel's `vercel-build` script - deployment blocked if tests fail

### Writing Tests

Tests are located in `__tests__/` mirroring the source structure:

```
__tests__/
  lib/              # Tests for lib/ utilities
  services/         # Tests for services/ with mocked fetch
  api/              # Integration tests for endpoints
```

**Testing patterns:**

- **Pure functions** (lib/middleware.ts): Test with vi.stubEnv() for environment variables
- **Services**: Mock fetch with vi.stubGlobal('fetch', mockFn)
- **ApiEndpoint subclasses**: Create mock subclass to test base class behavior
- **Endpoints**: Mock the service layer, focus on data transformation

**Mock setup example:**

```typescript
// Use vi.hoisted to avoid initialization issues
const { mockFn } = vi.hoisted(() => ({
  mockFn: vi.fn(),
}));

vi.mock('../../services/MyService', () => ({
  MyService: vi.fn().mockImplementation(() => ({
    myMethod: mockFn,
  })),
}));
```

### Code Quality Standards

- **ESLint**: TypeScript-specific rules with type-checked linting
- **Prettier**: Single quotes, 100 char line width, trailing commas
- **TypeScript**: Strict mode enabled, no implicit any
- **Pre-commit hooks**: Automated formatting and linting on git commit

Run `npm run check` before pushing to ensure all quality checks pass.

## Adding New Features

### New Endpoint

1. **Create service** (if needed) in `services/`:
   - Accept required config in constructor
   - Read environment variables for API keys
   - Implement typed fetch methods

2. **Define models** in `models/[category]/`:
   - Create response type for external API structure
   - Create output type for your endpoint's response format

3. **Create endpoint** in `api/[name].ts`:
   - Extend `ApiEndpoint`
   - Inject service via constructor
   - Implement `getRequiredParams()` and `process()`
   - Export default Vercel handler function

4. **Write tests** in `__tests__/api/[name].test.ts`:
   - Test successful requests with mocked service
   - Test validation errors (missing params, invalid method, auth)
   - Test error handling (service failures)
   - Aim for 80%+ coverage

5. **Update environment**:
   - Add required env vars to `.env.example`
   - Document in README.md

6. **Run quality checks**:
   ```bash
   npm run check  # Ensures tests pass and code quality standards met
   ```

### Modifying Existing Endpoints

- Endpoint logic is in the `process()` method
- Required parameters are defined in `getRequiredParams()`
- External API changes require updating service classes and response types
- Output format changes require updating output types
- **Always update tests** when modifying functionality
- Run `npm run test:watch` during development for instant feedback

## Environment Variables

Required environment variables (see .env.example):

- `OPENWEATHERMAP_API_KEY`: OpenWeatherMap API key (requires One Call API 3.0 subscription)
- `API_TOKEN`: Secure token for endpoint authentication (validate via x-api-token header)

Setup for local development:

```bash
cp .env.example .env.local
# Edit .env.local with actual values
```

## Key Design Decisions

- **No build step**: Vercel compiles TypeScript automatically during dev and deployment
- **Stateless endpoints**: Each endpoint class instance is created per request export
- **Single responsibility**: Endpoints only transform data; services handle external communication
- **Token authentication**: Simple token-based auth via headers (not OAuth/JWT)
- **Node 24+ required**: Uses modern Node.js features and native fetch API
