---
name: weather
description: Get current weather and forecast for any location by coordinates. Use when you need temperature, conditions, or forecast data.
argument-hint: "[latitude] [longitude] [units]"
allowed-tools: Bash
---

# Weather by Coordinates Skill

Get current weather and today's forecast for coordinates **$0** (latitude) and **$1** (longitude).

## Instructions

1. Make an HTTP request to the local weather API:
   ```bash
   curl -H "x-api-token: ${API_TOKEN}" \
     "http://localhost:3000/api/weather?lat=$0&lon=$1&units=${2:-metric}"
   ```

2. Parse the JSON response and present:

   - **Current Conditions**:
     - Temperature (with degree symbol)
     - Feels like temperature
     - Weather description (e.g., "clear sky", "light rain")

   - **Today's Forecast**:
     - High temperature
     - Low temperature
     - Expected conditions

3. Add context to make it conversational:
   - "It's quite cold" or "Perfect weather"
   - Suggest appropriate clothing/activities
   - Mention if there's a significant difference between actual and feels-like temp

4. If units parameter is provided:
   - `metric`: Celsius (default)
   - `imperial`: Fahrenheit
   - `standard`: Kelvin

5. If the request fails, check that:
   - The API is running (`npm start`)
   - API_TOKEN environment variable is set
   - Coordinates are valid (-90 to 90 for lat, -180 to 180 for lon)

## Example Usage

`/weather 40.7128 -74.0060` - Weather for New York City (metric)
`/weather 51.5074 -0.1278 imperial` - Weather for London in Fahrenheit
