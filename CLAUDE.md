# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript-based Vercel serverless API that provides weather data from OpenWeatherMap's 3.0 One Call API and aviation METAR data from Garmin. Built with a clean, modular architecture emphasizing type safety and separation of concerns.

## Development Commands

This project uses Vercel CLI for development and deployment. There are no npm scripts defined.

**Prerequisites:**

- Node.js >= 24.x
- Vercel CLI installed globally: `npm i -g vercel`

**Development:**

```bash
vercel dev
```

Starts the Vercel development server on http://localhost:3000. TypeScript files are automatically compiled by Vercel.

**Deployment:**

```bash
vercel
```

Deploys to Vercel. Ensure `OPENWEATHERMAP_API_KEY` and `API_TOKEN` environment variables are set in Vercel project settings.

**Type Checking:**

```bash
npx tsc --noEmit
```

Manually run TypeScript compiler to check for type errors without emitting files.

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

4. **Update environment**:
   - Add required env vars to `.env.example`
   - Document in README.md

### Modifying Existing Endpoints

- Endpoint logic is in the `process()` method
- Required parameters are defined in `getRequiredParams()`
- External API changes require updating service classes and response types
- Output format changes require updating output types

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
