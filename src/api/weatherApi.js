import axios from 'axios';

const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo-key';

/**
 * Get current weather for a location by coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise} Weather data
 */
export const getWeatherByCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(WEATHER_API_BASE, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: WEATHER_API_KEY,
        units: 'metric', // Use Celsius
      },
    });
    return response.data;
  } catch (error) {
    console.error('Weather API Error:', error.message);
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
    const response = await axios.get(WEATHER_API_BASE, {
      params: {
        q: cityName,
        appid: WEATHER_API_KEY,
        units: 'metric', // Use Celsius
      },
    });
    return response.data;
  } catch (error) {
    console.error('Weather API Error:', error.message);
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
