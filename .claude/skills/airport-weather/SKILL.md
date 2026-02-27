---
name: airport-weather
description: Get comprehensive weather briefing for an airport combining both METAR aviation data and civilian weather forecast.
argument-hint: '[airport_id] [units]'
allowed-tools: Bash
---

# Complete Airport Weather Briefing

Get a comprehensive weather briefing for airport **$0**.

## Instructions

**IMPORTANT: Do NOT show raw JSON or curl commands in your response. Only show the final formatted markdown output.**

This skill performs two API calls silently:

### Step 1: Silently Fetch METAR

```bash
metar=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/metar?id=$0")
```

### Step 2: Silently Fetch Weather Forecast

Use approximate coordinates for the airport:

```bash
weather=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/weather?lat={lat}&lon={lon}&units=${1:-metric}")
```

### Step 3: Present Clean Markdown Only

Format in two sections:

**🛩️ Aviation Weather (METAR)**

- Flight category and explanation
- Current conditions (temp, dewpoint, wind)
- Visibility and sky conditions
- Altimeter, raw METAR

**🌤️ General Weather & Forecast**

- Current conditions and feels like
- Today's high and low
- Forecast description

**✈️ Flight Recommendation**

- Summary of flying conditions

## Example Output Style

Use clean markdown with headers, bullet points, and emoji. No JSON visible to user.
