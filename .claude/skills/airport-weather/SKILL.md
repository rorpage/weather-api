---
name: airport-weather
description: Get comprehensive weather briefing for an airport combining both METAR aviation data and civilian weather forecast.
argument-hint: "[airport_id] [units]"
allowed-tools: Bash
---

# Complete Airport Weather Briefing

Get a comprehensive weather briefing for airport **$0** combining aviation METAR data with civilian weather forecasts.

## Instructions

This skill performs two API calls to provide complete weather information:

### Step 1: Get METAR and Airport Coordinates

```bash
curl -H "x-api-token: ${API_TOKEN}" \
  "http://localhost:3000/api/metar?id=$0"
```

Extract the `latDeg` and `lonDeg` from the airport info response.

### Step 2: Get Civilian Weather Using Coordinates

```bash
curl -H "x-api-token: ${API_TOKEN}" \
  "http://localhost:3000/api/weather?lat={latDeg}&lon={lonDeg}&units=${1:-metric}"
```

### Step 3: Present Combined Information

Format the response in two sections:

**🛩️ Aviation Weather (METAR)**
- Flight category and what it means
- Visibility and ceiling
- Wind conditions
- Altimeter setting
- Raw METAR text

**🌤️ General Weather**
- Current temperature and conditions
- Feels like temperature
- Today's high and low
- Forecast description

Add a summary recommending if conditions are suitable for flying (VFR vs IFR).

## Example Usage

`/airport-weather KJFK` - Complete weather for JFK
`/airport-weather KSEA imperial` - Seattle airport weather in Fahrenheit
