---
name: runway-wind
description: Get runway wind favorability for an airport, showing which runway end is best to use given current wind. Use when you need crosswind/headwind analysis or a visual runway diagram.
argument-hint: '[airport_id]'
allowed-tools: Bash
---

# Runway Wind Skill

Get runway wind favorability for airport **${0:-KUMP}**.

## Instructions

**IMPORTANT: Do NOT show raw JSON or curl commands in your response. Only show the final formatted markdown output.**

1. Silently fetch the runway wind data:

   ```bash
   data=$(curl -s -H "x-api-token: ${API_TOKEN}" "http://localhost:3000/api/runway-wind?id=${0:-KUMP}")
   ```

2. Parse the JSON and present ONLY clean markdown with:
   - Airport name and current wind (direction and speed)
   - The best runway to use, called out clearly
   - A table of every runway with each end's crosswind, headwind, wind angle, and favorability
   - A note that a PNG airport diagram is available at `/api/runway-wind?id=${0:-KUMP}&format=png` (add `&theme=dark` for a dark-background version)

3. Use emoji, headings, and formatting for clarity.

4. Explain favorability in plain language: "very_favorable" means close to a direct headwind, "favorable" means a moderate crosswind, "not_favorable" means a significant crosswind or tailwind component.

## Example Output Style

Use headers like `## 🛬 Runway Wind for AIRPORT`, a markdown table for the runway breakdown, and a final `### Recommended Runway` callout.
