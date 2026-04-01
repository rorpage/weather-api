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

## Cockpit UI

The root page (`/`) serves a steam-gauge cockpit instrument panel that displays live METAR aviation weather data. It auto-fetches data on load and remembers the last used airport in `localStorage`.

**Features:**
- Six SVG circle gauges: Flight Category, Temperature, Wind, Altimeter, Visibility, Dewpoint
- Flight Category gauge uses color-coded rings: VFR (green), MVFR (blue), IFR (red), LIFR (magenta)
- Wind gauge shows a compass rose with a directional arc tick on the bezel and speed/direction in the center
- Sky conditions info strip and full raw METAR string displayed below the gauges
- No authentication required — calls the public `/api/metar` endpoint directly

The cockpit HTML is in `public/index.html`, all styles live in `public/cockpit.css`, and all gauge rendering logic lives in `public/cockpit.js`.

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
- **125+ tests** with 97%+ coverage ensure reliability
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

> **Authentication:** None required — this endpoint is publicly accessible without an `x-api-token` header.

**Query Parameters:**

- `id` (optional): Airport ICAO identifier (e.g., KUMP, KJFK). Default: `KUMP`

**Example Request:**

```bash
curl "http://localhost:3000/api/metar?id=KJFK"
```

**Response:**

```json
{
  "id": "KJFK",
  "raw_text": "KJFK 011551Z 27012KT 10SM FEW050 SCT080 18/07 A2994 RMK AO2 SLP142",
  "observation_time": "15:51 L",
  "temperature": 18,
  "dewpoint": 7,
  "wind": {
    "direction": 270,
    "speed": 12
  },
  "visibility": 10,
  "altimeter": 29.94,
  "flight_category": "VFR",
  "sky_conditions": [
    { "coverage": "FEW", "base_feet": 5000, "description": "Few at 5000ft" },
    { "coverage": "SCT", "base_feet": 8000, "description": "Scattered at 8000ft" }
  ]
}
```

- `id` (string): Airport ICAO identifier
- `raw_text` (string): Full raw METAR string
- `observation_time` (string): Local observation time (e.g., `"15:51 L"`)
- `temperature` (number): Temperature in °C
- `dewpoint` (number): Dewpoint temperature in °C
- `wind.direction` (number): Wind direction in degrees (0–360)
- `wind.speed` (number): Wind speed in knots
- `visibility` (number): Visibility in statute miles (SM)
- `altimeter` (number): Altimeter setting in inHg
- `flight_category` (string): `"VFR"`, `"MVFR"`, `"IFR"`, or `"LIFR"`
- `sky_conditions` (array): Cloud layers, each with `coverage`, `base_feet`, and `description`

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
