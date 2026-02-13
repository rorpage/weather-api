---
name: compare-weather
description: Compare current weather conditions across multiple airports side-by-side. Useful for travel planning or choosing between destinations.
argument-hint: "[airport1] [airport2] [airport3...] [units]"
allowed-tools: Bash
---

# Compare Weather Across Multiple Airports

Compare weather at multiple airports: **$ARGUMENTS**

## Instructions

**IMPORTANT: Do NOT show raw JSON or curl commands in your response. Only show the final formatted markdown output.**

### Step 1: Parse Airport List

Split arguments to get airport codes. Last argument may be units (metric/imperial).

### Step 2: Silently Fetch Data for Each Airport

For each airport, make API calls silently:

```bash
metar=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/metar?id={AIRPORT}")
weather=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/weather?lat={lat}&lon={lon}&units={units}")
```

### Step 3: Present Clean Comparison

Create a markdown table:

| Airport | Temperature | Conditions | Flight Category | Wind | Visibility |
|---------|-------------|------------|----------------|------|------------|

### Step 4: Detailed Analysis

For each airport, show:
- Current conditions summary
- Forecast for today
- Key metrics

### Step 5: Recommendations

- Which airport has best weather?
- Any concerns?
- Best for VFR flying?
- Notable differences

## Example Output Style

Use clean markdown tables with emoji. No JSON visible. Make it easy to scan and compare.
