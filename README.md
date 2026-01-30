# Weather API

A TypeScript-based Vercel serverless API that fetches weather data from OpenWeatherMap's 3.0 One Call API and aviation METAR data from Garmin.

## Architecture

This project uses a clean, modular architecture:

- **Base Class Pattern**: All endpoints extend `ApiEndpoint` which handles authentication, validation, and error handling
- **Service Layer**: External API calls are encapsulated in service classes (`OpenWeatherMapService`, `GarminService`)
- **Type Safety**: Full TypeScript coverage with organized models in `models/` directory
- **Separation of Concerns**: Each endpoint focuses purely on data transformation and formatting

### Project Structure

```
api/
  weather.ts          # Weather endpoint (extends ApiEndpoint)
  metar.ts            # METAR endpoint (extends ApiEndpoint)
lib/
  ApiEndpoint.ts      # Base class for all endpoints
  middleware.ts       # Validation utilities
services/
  OpenWeatherMapService.ts  # OWM API client
  GarminService.ts          # Garmin API client
models/
  common/             # Shared models (ValidationError)
  weather/            # Weather-specific models
  metar/              # METAR-specific models
```

### Adding New Endpoints

To add a new endpoint:

1. Create a service class in `services/` for external API communication
2. Define your models in `models/[category]/`
3. Create an endpoint class that extends `ApiEndpoint`:
   ```typescript
   class MyEndpoint extends ApiEndpoint {
     protected getRequiredParams(): string[] {
       return ['param1', 'param2'];
     }

     protected async process(req: VercelRequest): Promise<MyOutput> {
       // Your logic here
     }
   }
   ```

## Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenWeatherMap API key and API token to `.env.local`:
   ```
   OPENWEATHERMAP_API_KEY=your_actual_api_key
   API_TOKEN=your_secure_random_token
   ```

3. Get an API key from [OpenWeatherMap](https://openweathermap.org/api) (requires One Call API 3.0 subscription)

## Development

Install dependencies:
```bash
npm install
```

Install Vercel CLI if you haven't already:
```bash
npm i -g vercel
```

Run the development server:
```bash
npm run dev
```

The TypeScript files will be automatically compiled by Vercel during development and deployment.

## API Usage

### Weather Endpoint

**Endpoint:** `/api/weather`

**Method:** `GET`

**Headers:**
- `x-api-token` (required): API token for authentication

**Query Parameters:**
- `lat` (required): Latitude coordinate
- `lon` (required): Longitude coordinate
- `units` (optional): Units of measurement (`standard`, `metric`, or `imperial`). Default: `metric`

**Example Request:**
```bash
curl -H "x-api-token: your_token_here" \
  "http://localhost:3000/api/weather?lat=40.7128&lon=-74.0060&units=imperial"
```

### METAR Endpoint

**Endpoint:** `/api/metar`

**Method:** `GET`

**Headers:**
- `x-api-token` (required): API token for authentication

**Query Parameters:**
- `id` (optional): Airport identifier (e.g., KUMP, KJFK). Default: `KUMP`

**Example Request:**
```bash
curl -H "x-api-token: your_token_here" \
  "http://localhost:3000/api/metar?id=KJFK"
```

## Deployment

Deploy to Vercel:
```bash
vercel
```

Make sure to add both the `OPENWEATHERMAP_API_KEY` and `API_TOKEN` environment variables in your Vercel project settings.
