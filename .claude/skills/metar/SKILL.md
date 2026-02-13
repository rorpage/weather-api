---
name: metar
description: Get METAR aviation weather data for an airport. Use when you need flight category, visibility, wind, temperature, or raw METAR information.
argument-hint: "[airport_id]"
allowed-tools: Bash
---

# METAR Weather Skill

Get METAR aviation weather data for airport **$ARGUMENTS** (default: KUMP if not specified).

## Instructions

1. Make an HTTP request to the local weather API:
   ```bash
   curl -H "x-api-token: ${API_TOKEN}" \
     "http://localhost:3000/api/metar?id=${0:-KUMP}"
   ```

2. Parse the JSON response and present the following information clearly:

   - **Airport ID**: The station identifier
   - **Observation Time**: When the METAR was issued
   - **Flight Category**: VFR, MVFR, IFR, or LIFR (explain what this means)
   - **Temperature**: Current temperature in Celsius
   - **Dewpoint**: Dewpoint in Celsius
   - **Wind**: Direction and speed (explain if calm)
   - **Visibility**: Distance in statute miles
   - **Sky Conditions**: Cloud layers with coverage and altitude
   - **Altimeter**: Barometric pressure setting
   - **Raw METAR**: The complete METAR text

3. Highlight any significant weather concerns (low visibility, strong winds, poor flight category)

4. If the request fails, check that:
   - The API is running (`npm start`)
   - API_TOKEN environment variable is set
   - The airport code is valid

## Example Usage

`/metar KJFK` - Get METAR for JFK International
`/metar` - Get METAR for default airport (KUMP)
