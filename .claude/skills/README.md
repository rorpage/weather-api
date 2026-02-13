# Weather API Skills for Claude Code

This directory contains Claude Code skills that allow you to query the weather API directly from your development environment.

## Available Skills

### 1. `/metar` - Aviation Weather
Get METAR weather data for any airport.

**Usage:**
```
/metar KJFK
/metar --airport_id EGLL
/metar
```

**Arguments:**
- `airport_id` (optional, default: KUMP) - Airport identifier

**Example Output:**
- Flight category (VFR/IFR/etc)
- Temperature and dewpoint
- Wind conditions
- Visibility
- Sky conditions
- Raw METAR text

---

### 2. `/weather` - Weather by Coordinates
Get current weather and forecast for any location.

**Usage:**
```
/weather --lat 40.7128 --lon -74.0060
/weather --lat 51.5074 --lon -0.1278 --units imperial
```

**Arguments:**
- `lat` (required) - Latitude
- `lon` (required) - Longitude
- `units` (optional, default: metric) - metric, imperial, or standard

**Example Output:**
- Current temperature and conditions
- Feels like temperature
- Today's high and low
- Weather description

---

### 3. `/airport-weather` - Complete Airport Weather Briefing
Get both METAR and civilian weather for an airport.

**Usage:**
```
/airport-weather KJFK
/airport-weather --airport_id KSEA --units imperial
```

**Arguments:**
- `airport_id` (required) - Airport identifier
- `units` (optional, default: metric) - metric or imperial

**Example Output:**
- Complete METAR data
- Current conditions and forecast
- Comprehensive weather briefing

---

### 4. `/compare-weather` - Compare Multiple Airports
Compare weather across multiple locations.

**Usage:**
```
/compare-weather --airports "KJFK,KLAX,KORD"
/compare-weather --airports "EGLL,LFPG,EDDF" --units metric
```

**Arguments:**
- `airports` (required) - Comma-separated airport IDs
- `units` (optional, default: metric) - metric or imperial

**Example Output:**
- Side-by-side weather comparison
- Flight categories
- Recommendations

---

## Setup

### Prerequisites

1. **Weather API running locally:**
   ```bash
   npm run dev
   ```
   The API should be accessible at `http://localhost:3000`

2. **Environment variable set:**
   You need `API_TOKEN` set in your environment:
   ```bash
   export API_TOKEN=your_token_here
   ```

   Or add to your `.env.local`:
   ```
   API_TOKEN=your_secure_token
   ```

### Using the Skills

1. Make sure your weather API is running (`npm run dev`)
2. Ensure `API_TOKEN` is set in your environment
3. In Claude Code, use the skills with `/skill-name`

### Troubleshooting

**"API token not set" error:**
- Make sure `API_TOKEN` environment variable is set
- Restart Claude Code after setting the environment variable

**"Connection refused" error:**
- Make sure the API is running on `http://localhost:3000`
- Check that you ran `npm run dev` or `vercel dev`

**"Invalid API token" error:**
- Verify the `API_TOKEN` in your environment matches the one in `.env.local`

---

## How It Works

These skills use Claude Code's skill system to:
1. Accept arguments from the user
2. Make authenticated HTTP requests to your local API
3. Parse the JSON responses
4. Present the data in a readable format

All skills use the `API_TOKEN` from your environment variables to authenticate with the API.

## Development

To modify or add new skills:
1. Edit the YAML files in this directory
2. Follow the Claude Code skill format
3. Test by invoking the skill in Claude Code
4. Commit changes to share with your team
