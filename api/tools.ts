import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiEndpoint } from '../lib/ApiEndpoint';
import type { ToolsOutput } from '../models/tools/ToolsOutput';

const TOOLS: ToolsOutput = {
  tools: [
    {
      name: 'get_current_weather',
      description:
        'Get current weather conditions and a daily summary for a location using OpenWeatherMap. Returns the current temperature, description (e.g. "light rain"), feels-like temperature, and today\'s high/low.',
      input_schema: {
        type: 'object',
        properties: {
          latitude: {
            type: 'string',
            description: 'Latitude of the location (e.g. "39.7684")',
          },
          longitude: {
            type: 'string',
            description: 'Longitude of the location (e.g. "-86.1581")',
          },
          units: {
            type: 'string',
            description:
              'Temperature unit system. Defaults to "metric" (Celsius). Use "imperial" for Fahrenheit or "standard" for Kelvin.',
            enum: ['metric', 'imperial', 'standard'],
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
    {
      name: 'get_aviation_metar',
      description:
        'Get the latest METAR aviation weather report for an airport. Returns flight category (VFR/IFR/etc.), visibility, wind direction and speed, sky conditions, temperature, dewpoint, altimeter setting, and the raw METAR string.',
      input_schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description:
              'ICAO airport identifier (e.g. "KORD" for Chicago O\'Hare, "KLAX" for Los Angeles). Defaults to "KUMP" if omitted.',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_nws_current_conditions',
      description:
        'Get the current weather conditions for a location from the US National Weather Service. Returns temperature, wind speed and direction, short forecast description, probability of precipitation, and relative humidity.',
      input_schema: {
        type: 'object',
        properties: {
          latitude: {
            type: 'string',
            description: 'Latitude of the location (e.g. "39.7684")',
          },
          longitude: {
            type: 'string',
            description: 'Longitude of the location (e.g. "-86.1581")',
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
    {
      name: 'get_nws_hourly_forecast',
      description:
        'Get the next 12 hours of hourly forecast data for a location from the US National Weather Service. Each period includes temperature, wind, short forecast description, probability of precipitation, and relative humidity.',
      input_schema: {
        type: 'object',
        properties: {
          latitude: {
            type: 'string',
            description: 'Latitude of the location (e.g. "39.7684")',
          },
          longitude: {
            type: 'string',
            description: 'Longitude of the location (e.g. "-86.1581")',
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
  ],
};

class ToolsEndpoint extends ApiEndpoint {
  protected requiresAuth(): boolean {
    return false;
  }

  protected getRequiredParams(): string[] {
    return [];
  }

  protected process(_request: VercelRequest): Promise<ToolsOutput> {
    return Promise.resolve(TOOLS);
  }
}

const endpoint = new ToolsEndpoint();

export default async function handler(request: VercelRequest, response: VercelResponse) {
  return endpoint.handle(request, response);
}
