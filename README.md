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
npm start
```

The TypeScript files will be automatically compiled by Vercel during development and deployment.

## Testing & Quality

This project uses a comprehensive testing and linting infrastructure to ensure code quality:

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI (browser-based)
npm run test:ui
```

**Test Coverage:** The project maintains 80%+ test coverage for lines/functions and 75%+ for branches, verified on every build.

### Code Quality Checks

```bash
# Run all quality checks (formatting, linting, type-checking, tests)
npm run check

# Format code with Prettier
npm run format

# Check code formatting (doesn't modify files)
npm run format:check

# Lint code with ESLint
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type check with TypeScript
npm run type-check
```

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically run quality checks before each commit:

- **Formats** staged files with Prettier
- **Lints** staged files with ESLint (auto-fixes when possible)
- **Type-checks** the entire project

This ensures all committed code meets quality standards.

### Quality Assurance

All code quality checks are enforced via pre-commit hooks using Husky:

- **Before each commit**: Formats, lints, and type-checks code automatically
- **77 tests** with 97%+ coverage ensure reliability
- **Strict TypeScript** mode catches errors at compile time

This ensures only high-quality, tested code makes it into the repository and gets deployed.

### Testing Stack

- **Vitest**: Fast, modern test runner with native TypeScript support
- **ESLint**: Code linting with TypeScript-specific rules
- **Prettier**: Opinionated code formatting
- **TypeScript**: Strict type checking
- **Husky + lint-staged**: Git hooks for pre-commit checks

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

**Response:**

```json
{
  "icon": "23°",
  "message": "Today: High 28°, low 18°, partly cloudy",
  "title": "23° and scattered clouds. Feels like 20°.",
  "temperature": 23
}
```

- `icon` (string): Temperature with degree symbol for display
- `message` (string): Today's forecast with high, low, and conditions
- `title` (string): Current conditions summary with feels-like temperature
- `temperature` (number): Current temperature as an integer (rounded)

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

### NWS Current Conditions Endpoint

**Endpoint:** `/api/nws-current`

**Method:** `GET`

**Headers:**

- `x-api-token` (required): API token for authentication

**Query Parameters:**

- `lat` (required): Latitude coordinate (US locations only)
- `lon` (required): Longitude coordinate (US locations only)

**Example Request:**

```bash
curl -H "x-api-token: your_token_here" \
  "http://localhost:3000/api/nws-current?lat=39.7684&lon=-86.1581"
```

**Response:**

```json
{
  "start_time": "2026-02-27T12:00:00-05:00",
  "start_time_formatted_time": "12:00",
  "start_time_formatted_datetime": "02/27/2026 12:00 PM",
  "is_daytime": true,
  "temperature": 45,
  "temperature_unit": "F",
  "wind_speed": "10 mph",
  "wind_direction": "NW",
  "short_forecast": "Mostly cloudy",
  "probability_of_precipitation": 20,
  "relative_humidity": 65
}
```

- `start_time` (string): Full ISO 8601 timestamp of the period start (e.g., `"2026-02-27T12:00:00-05:00"`)
- `start_time_formatted_time` (string): Local time of the period in `hh:mm AM/PM` 12-hour format
- `start_time_formatted_datetime` (string): Local date and time formatted as `MM/DD/YYYY HH:MM AM/PM`
- `is_daytime` (boolean): Whether this is a daytime period
- `temperature` (number): Temperature as an integer
- `temperature_unit` (string): `"F"` for Fahrenheit
- `wind_speed` (string): Wind speed (e.g., `"10 mph"`)
- `wind_direction` (string): Cardinal wind direction (e.g., `"NW"`)
- `short_forecast` (string): Brief condition summary (e.g., `"Mostly cloudy"`)
- `probability_of_precipitation` (number | null): Precipitation chance (0–100)
- `relative_humidity` (number | null): Relative humidity (0–100)

### NWS Hourly Forecast Endpoint

**Endpoint:** `/api/nws-forecast`

**Method:** `GET`

**Headers:**

- `x-api-token` (required): API token for authentication

**Query Parameters:**

- `lat` (required): Latitude coordinate (US locations only)
- `lon` (required): Longitude coordinate (US locations only)

**Example Request:**

```bash
curl -H "x-api-token: your_token_here" \
  "http://localhost:3000/api/nws-forecast?lat=39.7684&lon=-86.1581"
```

**Response:**

```json
{
  "periods": [
    {
      "start_time": "2026-02-27T12:00:00-05:00",
      "start_time_formatted_time": "12:00",
      "start_time_formatted_datetime": "02/27/2026 12:00 PM",
      "is_daytime": true,
      "temperature": 45,
      "temperature_unit": "F",
      "wind_speed": "10 mph",
      "wind_direction": "NW",
      "short_forecast": "Mostly cloudy",
      "probability_of_precipitation": 20,
      "relative_humidity": 65
    }
  ]
}
```

- `periods` (array): Up to 12 hourly forecast periods, each with:
  - `start_time` (string): Full ISO 8601 timestamp of the period start
  - `start_time_formatted_time` (string): Local time of the period in `hh:mm AM/PM` 12-hour format
  - `start_time_formatted_datetime` (string): Local date and time formatted as `MM/DD/YYYY HH:MM AM/PM`
  - `is_daytime` (boolean): Whether this is a daytime period
  - `temperature` (number): Temperature as an integer
  - `temperature_unit` (string): `"F"` for Fahrenheit
  - `wind_speed` (string): Wind speed (e.g., `"10 mph"`)
  - `wind_direction` (string): Cardinal wind direction (e.g., `"NW"`)
  - `short_forecast` (string): Brief condition summary (e.g., `"Mostly cloudy"`)
  - `probability_of_precipitation` (number | null): Precipitation chance (0–100)
  - `relative_humidity` (number | null): Relative humidity (0–100)

> **Note:** Both NWS endpoints use the [National Weather Service API](https://api.weather.gov) which only covers US locations. No API key required — NWS data is free and public.

## Deployment

Deploy to Vercel:

```bash
vercel
```

Make sure to add both the `OPENWEATHERMAP_API_KEY` and `API_TOKEN` environment variables in your Vercel project settings.
