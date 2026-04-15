/**
 * Open-Meteo — free, no API key required.
 * @see https://open-meteo.com/
 */

export interface WeatherSnapshot {
  temperatureC: number;
  relativeHumidityPct: number;
  precipitationMm: number;
  cloudCoverPct: number;
  windSpeedKmh: number;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("current", [
    "temperature_2m",
    "relative_humidity_2m",
    "precipitation",
    "cloud_cover",
    "wind_speed_10m",
  ].join(","));

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) throw new Error("Weather request failed");
  const data = (await res.json()) as {
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      precipitation: number;
      cloud_cover: number;
      wind_speed_10m: number;
    };
  };

  const c = data.current;
  return {
    temperatureC: c.temperature_2m,
    relativeHumidityPct: c.relative_humidity_2m,
    precipitationMm: c.precipitation,
    cloudCoverPct: c.cloud_cover,
    windSpeedKmh: c.wind_speed_10m,
  };
}

export async function fetchForecastRainDays(
  lat: number,
  lng: number,
  days = 7
): Promise<number[]> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("daily", "precipitation_sum");
  url.searchParams.set("forecast_days", String(days));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Forecast request failed");
  const data = (await res.json()) as {
    daily: { precipitation_sum: number[] };
  };
  return data.daily.precipitation_sum;
}

