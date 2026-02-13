---
name: compare-weather
description: Compare current weather conditions across multiple airports side-by-side. Useful for travel planning or choosing between destinations.
argument-hint: "[airport1] [airport2] [airport3...] [units]"
allowed-tools: Bash
---

# Compare Weather Across Multiple Airports

Compare weather at multiple airports: **$ARGUMENTS**

## Instructions

This skill fetches weather for multiple airports and presents a comparison.

### Step 1: Parse Airport List

Split the arguments to get individual airport codes. The last argument may be units (metric/imperial).

### Step 2: Fetch Data for Each Airport

For each airport code, make two API calls:

1. **Get METAR** (for coordinates and flight category):
```bash
curl -H "x-api-token: ${API_TOKEN}" \
  "http://localhost:3000/api/metar?id={AIRPORT}"
```

2. **Get Weather** (using coordinates from METAR):
```bash
curl -H "x-api-token: ${API_TOKEN}" \
  "http://localhost:3000/api/weather?lat={lat}&lon={lon}&units={units}"
```

### Step 3: Present Comparison Table

Create a clear comparison showing for each airport:

| Airport | Temperature | Conditions | Flight Category | Wind | Visibility |
|---------|-------------|------------|----------------|------|------------|
| KJFK    | 15°C        | Clear sky  | VFR            | 10kt | 10 SM      |
| KLAX    | 22°C        | Partly cloudy | VFR         | 5kt  | 10 SM      |

### Step 4: Provide Recommendations

- Which airport has the best weather?
- Any weather concerns at specific locations?
- Best choice for VFR flying?
- Temperature differences to note

## Example Usage

`/compare-weather KJFK KLAX KORD` - Compare three major airports
`/compare-weather KSEA KPDX imperial` - Seattle vs Portland in Fahrenheit
