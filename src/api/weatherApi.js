import axios from 'axios';

const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// Beach name mapping to OpenWeatherMap recognized cities
const BEACH_NAME_MAPPING = {
  unawatuna: 'Unawatuna, LK',
  unawattuna: 'Unawatuna, LK',
  mirissa: 'Mirissa, LK',
  hikkaduwa: 'Hikkaduwa, LK',
  weligama: 'Weligama, LK',
  bentota: 'Bentota, LK',
  bentotas: 'Bentota, LK',
  negombo: 'Negombo, LK',
  beruwala: 'Beruwala, LK',
  colombo: 'Colombo, LK',
  galle: 'Galle, LK',
  matara: 'Matara, LK',
  trincomalee: 'Trincomalee, LK',
  arugambe: 'Arugambe, LK',
  batticaloa: 'Batticaloa, LK',
  'mount lavinia': 'Mount Lavinia, LK',
  wellawatta: 'Wellawatta, LK',
  dehiwala: 'Dehiwala, LK',
  moratuwa: 'Moratuwa, LK',
  kalutara: 'Kalutara, LK',
};

// Get the proper beach name for OpenWeatherMap API
const getProperBeachName = (beachName) => {
  if (!beachName) return null;
  const normalized = beachName.toLowerCase().trim();

  // First try exact match in mapping
  if (BEACH_NAME_MAPPING[normalized]) {
    console.log(
      '✓ Found exact mapping for:',
      beachName,
      '->',
      BEACH_NAME_MAPPING[normalized]
    );
    return BEACH_NAME_MAPPING[normalized];
  }

  // Try partial match
  for (const [key, value] of Object.entries(BEACH_NAME_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      console.log('✓ Found partial mapping for:', beachName, '->', value);
      return value;
    }
  }

  // If no mapping found, append Sri Lanka (LK) as fallback
  console.log(
    '⚠️ No mapping found for:',
    beachName,
    '- using as is with LK suffix'
  );
  return `${beachName}, LK`;
};

// Debug log to verify API key is loaded
if (!WEATHER_API_KEY) {
  console.warn('⚠️ VITE_OPENWEATHER_API_KEY is not set in .env file');
} else {
  console.log('✓ Weather API key loaded successfully');
}

/**
 * Get current weather for a location by coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise} Weather data
 */
export const getWeatherByCoordinates = async (latitude, longitude) => {
  try {
    if (!WEATHER_API_KEY) {
      console.error('Weather API key is missing');
      return null;
    }
    const response = await axios.get(WEATHER_API_BASE, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric', // Use Celsius
      },
    });
    console.log('✓ Weather API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Weather API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return null;
  }
};

/**
 * Get weather for a city name
 * @param {string} cityName
 * @returns {Promise} Weather data
 */
export const getWeatherByCity = async (cityName) => {
  try {
    if (!WEATHER_API_KEY) {
      console.error('Weather API key is missing');
      return null;
    }
    if (!cityName) {
      console.warn('City name is empty');
      return null;
    }

    const properCityName = getProperBeachName(cityName);
    console.log(
      '📍 Fetching weather for:',
      cityName,
      '-> mapped to:',
      properCityName
    );

    const response = await axios.get(WEATHER_API_BASE, {
      params: {
        q: properCityName,
        appid: WEATHER_API_KEY,
        units: 'metric', // Use Celsius
      },
    });
    console.log(
      '✓ Weather API response for',
      properCityName,
      ':',
      response.data
    );
    return response.data;
  } catch (error) {
    console.error('❌ Weather API Error for', cityName, ':', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return null;
  }
};

/**
 * Format weather data for display
 * @param {Object} weatherData - Raw weather data from API
 * @returns {Object} Formatted weather data
 */
export const formatWeatherData = (weatherData) => {
  if (!weatherData) return null;

  return {
    location: weatherData.name,
    description: weatherData.weather?.[0]?.main || 'Unknown',
    condition: weatherData.weather?.[0]?.main || 'Unknown',
    temperature: Math.round(weatherData.main?.temp || 0),
    feelsLike: Math.round(weatherData.main?.feels_like || 0),
    humidity: weatherData.main?.humidity || 0,
    windSpeed: Math.round(weatherData.wind?.speed * 3.6 || 0), // Convert m/s to km/h
    icon: weatherData.weather?.[0]?.icon || '01d',
    pressure: weatherData.main?.pressure || 0,
    cloudiness: weatherData.clouds?.all || 0,
  };
};

/**
 * Get weather icon URL from OpenWeatherMap
 * @param {string} iconCode - Icon code from API
 * @returns {string} Icon URL
 */
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};
