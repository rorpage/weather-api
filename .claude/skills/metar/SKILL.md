---
name: metar
description: Get METAR aviation weather data for an airport. Use when you need flight category, visibility, wind, temperature, or raw METAR information.
argument-hint: '[airport_id]'
allowed-tools: Bash
---

# METAR Weather Skill

Get METAR aviation weather data for airport **${0:-KUMP}**.

## Instructions

**IMPORTANT: Do NOT show raw JSON or curl commands in your response. Only show the final formatted markdown output.**

1. Silently fetch the METAR data:

   ```bash
   data=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/metar?id=${0:-KUMP}")
   ```

2. Parse the JSON and present ONLY clean markdown with:
   - Airport ID and observation time
   - Flight category with clear explanation (VFR/MVFR/IFR/LIFR)
   - Temperature and dewpoint in Celsius
   - Wind conditions (direction and speed)
   - Visibility in statute miles
   - Sky conditions (cloud layers)
   - Altimeter setting
   - Raw METAR text
   - Weather assessment

3. Use emoji, headings, and formatting for clarity.

4. Highlight any significant weather concerns.

## Example Output Style

Use headers like `## 🛩️ METAR for AIRPORT`, bullet points, and a final `### Weather Assessment` section.
