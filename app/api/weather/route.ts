import { NextResponse } from 'next/server';

// Denver coordinates
const LAT = 39.7392;
const LON = -104.9903;

export async function GET() {
  try {
    // Open-Meteo API for current weather and forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_80m,wind_speed_80m,wind_direction_80m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FDenver`;

    const response = await fetch(weatherUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();

    // Get current hour index for 80m (~500ft AGL) data
    const currentHour = new Date().getHours();

    return NextResponse.json({
      current: {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        precipProbability: data.current.precipitation_probability,
        weatherCode: data.current.weather_code,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windGusts: data.current.wind_gusts_10m,
      },
      aloft: {
        windSpeed: data.hourly.wind_speed_80m[currentHour],
        windDirection: data.hourly.wind_direction_80m[currentHour],
        temperature: data.hourly.temperature_80m[currentHour],
      },
      hourly: data.hourly,
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
