---
name: weather
description: Get current weather and forecast for any location by coordinates. Use when you need temperature, conditions, or forecast data.
argument-hint: "[latitude] [longitude] [units]"
allowed-tools: Bash
---

# Weather by Coordinates Skill

Get current weather and today's forecast for coordinates **$0** (latitude) and **$1** (longitude).

## Instructions

**IMPORTANT: Do NOT show raw JSON or curl commands in your response. Only show the final formatted markdown output.**

1. Silently fetch the weather data:
   ```bash
   data=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/weather?lat=$0&lon=$1&units=${2:-metric}")
   ```

2. Parse the JSON and present ONLY clean markdown with:
   - Current temperature and conditions
   - Feels like temperature
   - Today's high and low
   - Weather description
   - Contextual advice (e.g., "Perfect weather for outdoor activities")

3. Use emoji and formatting for visual clarity.

4. Units:
   - `metric` (default): Celsius
   - `imperial`: Fahrenheit
   - `standard`: Kelvin

## Example Output Style

Use headers like `## 🌤️ Weather for Location`, bullet points, and add helpful context about conditions.
