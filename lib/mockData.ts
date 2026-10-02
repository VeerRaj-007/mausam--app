export type City = 'New Delhi' | 'Mumbai' | 'Jaipur' | 'Bengaluru' | 'Chennai';

export type WeatherSnapshot = {
  city: City;
  region: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  rainProbability: number;
  wind: number;
  humidity: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  uv: number;
  aqi: number;
};

export type ForecastDay = {
  day: string;
  icon: string;
  high: number;
  low: number;
  rain: number;
};

const cityWeather: Record<City, WeatherSnapshot> = {
  'New Delhi': { city: 'New Delhi', region: 'Delhi', temperature: 31, feelsLike: 34, condition: 'Partly cloudy', rainProbability: 42, wind: 14, humidity: 58, visibility: 7.8, sunrise: '6:12 am', sunset: '6:14 pm', uv: 6, aqi: 86 },
  Mumbai: { city: 'Mumbai', region: 'Maharashtra', temperature: 29, feelsLike: 32, condition: 'Humid & cloudy', rainProbability: 68, wind: 18, humidity: 76, visibility: 6.2, sunrise: '6:27 am', sunset: '6:31 pm', uv: 5, aqi: 62 },
  Jaipur: { city: 'Jaipur', region: 'Rajasthan', temperature: 34, feelsLike: 35, condition: 'Sunny skies', rainProbability: 18, wind: 11, humidity: 32, visibility: 9.4, sunrise: '6:20 am', sunset: '6:23 pm', uv: 8, aqi: 104 },
  Bengaluru: { city: 'Bengaluru', region: 'Karnataka', temperature: 26, feelsLike: 27, condition: 'Light showers', rainProbability: 58, wind: 13, humidity: 69, visibility: 8.1, sunrise: '6:05 am', sunset: '6:12 pm', uv: 4, aqi: 38 },
  Chennai: { city: 'Chennai', region: 'Tamil Nadu', temperature: 30, feelsLike: 35, condition: 'Warm & breezy', rainProbability: 32, wind: 22, humidity: 78, visibility: 7.1, sunrise: '5:59 am', sunset: '6:04 pm', uv: 7, aqi: 55 },
};

const forecastIcons = ['☁', '☀', '☀', '🌧', '☁', '☀', '🌧'];

// TODO: replace with a real API call. Expected response: { city, temperature, condition, rainProbability, wind, humidity, visibility, sunrise, sunset, uv, aqi }.
export function getCurrentWeather(city: City): WeatherSnapshot { return cityWeather[city]; }

// TODO: replace with a real API call. Expected response: Array<{ day, icon, high, low, rain }>.
export function getForecast(city: City): ForecastDay[] {
  const base = cityWeather[city];
  const labels = ['Today', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  return labels.map((day, index) => ({ day, icon: forecastIcons[index], high: base.temperature + [2, 1, -1, 0, 2, 1, -1][index], low: base.temperature - [7, 7, 8, 8, 7, 6, 8][index], rain: Math.max(8, Math.min(92, base.rainProbability + [-18, 12, 28, -10, -22, 8, 18][index])) }));
}

// TODO: replace with a real API call. Expected response: { aqi, status, color }.
export function getAqi(city: City) { const aqi = cityWeather[city].aqi; return { aqi, status: aqi < 50 ? 'Good' : aqi < 100 ? 'Moderate' : 'Poor', color: aqi < 50 ? '#3d9c83' : aqi < 100 ? '#d28d37' : '#cf5d62' }; }

// TODO: replace with a real API call. Expected response: { uv, label }.
export function getUvIndex(city: City) { const uv = cityWeather[city].uv; return { uv, label: uv < 3 ? 'Low' : uv < 6 ? 'Moderate' : uv < 8 ? 'High' : 'Very high' }; }

// TODO: replace with a real API call. Expected response: { route, status, description, delayRisk, visibilityNote, nowcast }.
export function getHighwayAdvisory(city: City) { const weather = cityWeather[city]; return { route: city === 'Mumbai' ? 'Western Express Highway' : city === 'Bengaluru' ? 'Outer Ring Road' : 'NH 48 · Delhi–Jaipur', status: weather.rainProbability > 60 ? 'Caution' : 'Clear', description: weather.rainProbability > 60 ? 'Wet roads and reduced visibility expected during the evening commute.' : 'Roads are clear. Watch for warm surfaces and regular traffic near junctions.', delayRisk: weather.rainProbability > 60 ? 'High' : weather.rainProbability > 35 ? 'Medium' : 'Low', visibilityNote: `${weather.visibility} km · ${weather.visibility < 7 ? 'haze may slow you down' : 'good visibility'}`, nowcast: weather.rainProbability > 50 ? 'A light shower band may pass through in the next 2 hours.' : 'No significant rain in the next 2 hours.' }; }

// TODO: replace with a real API call. Expected response: { rainfall, advisory, frostAlert, heatAlert }.
export function getAgricultureData(city: City) { const weather = cityWeather[city]; return { rainfall: Math.round(weather.rainProbability * 0.28), advisory: weather.rainProbability > 50 ? 'Postpone irrigation and spraying operations for the next 48 hours in view of expected rainfall.' : 'Good window for irrigation and field work. Keep young plants shaded through the warmest hours.', frostAlert: weather.temperature < 8 ? 'Frost watch' : 'No alert', heatAlert: weather.temperature > 33 ? 'Heat watch' : 'No alert' }; }

// TODO: replace with a real API call. Expected response: { status, description, probability }.
export function getFamilyData(city: City) { const weather = cityWeather[city]; return { schoolStatus: weather.rainProbability > 65 ? 'Disrupted' : weather.rainProbability > 40 ? 'Caution' : 'Clear', schoolText: weather.rainProbability > 65 ? 'Allow extra time and consider a covered route.' : 'A comfortable school run is expected this morning.', probability: weather.rainProbability, alert: weather.rainProbability > 50 ? 'Keep a light rain layer ready for the evening.' : 'No rain alert for the school commute.' }; }

// TODO: replace with a real API call. Expected response: { seaState, advisory, warning }.
export function getMarineData(city: City) { const weather = cityWeather[city]; return { seaState: weather.wind > 20 ? 'Moderate sea state' : 'Calm sea state', advisory: weather.wind > 20 ? 'Use caution near open water and follow local advisories.' : 'Conditions look suitable for a relaxed coastal day.', warning: weather.wind > 20 || weather.rainProbability > 60 ? 'Coastal caution' : 'No active warning' }; }

export function getTravelWarning(city: City) { const weather = cityWeather[city]; return { severity: weather.rainProbability > 60 ? 'Orange' : weather.rainProbability > 35 ? 'Yellow' : 'Clear', description: weather.rainProbability > 60 ? 'Heavy showers possible around the evening window.' : weather.rainProbability > 35 ? 'Carry a compact rain layer for changing conditions.' : 'No active weather warnings for your destination.', packing: weather.temperature > 32 ? 'Pack breathable layers, sun protection, and a refillable bottle.' : 'Pack a light layer and comfortable shoes for mixed conditions.' }; }
