import { useQuery } from '@tanstack/react-query';
import {
  getWeatherByCoordinates,
  getWeatherByCity,
  formatWeatherData,
} from '@/api/weatherApi';

/**
 * Hook to fetch weather by coordinates
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} beachName - for cache key
 */
export const useWeatherByCoordinates = (
  latitude,
  longitude,
  beachName = 'beach'
) => {
  return useQuery({
    queryKey: ['weather', beachName, latitude, longitude],
    queryFn: async () => {
      const data = await getWeatherByCoordinates(latitude, longitude);
      return formatWeatherData(data);
    },
    enabled: !!latitude && !!longitude,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 1,
  });
};

/**
 * Hook to fetch weather by city name
 * @param {string} cityName
 */
export const useWeatherByCity = (cityName) => {
  return useQuery({
    queryKey: ['weather', 'city', cityName],
    queryFn: async () => {
      console.log('🔄 Weather hook fetching for:', cityName);
      const data = await getWeatherByCity(cityName);
      const formatted = formatWeatherData(data);
      console.log('📊 Weather hook formatted data:', formatted);
      return formatted;
    },
    enabled: !!cityName,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 2,
    onError: (error) => {
      console.error('⚠️ Weather query error:', error);
    },
  });
};
