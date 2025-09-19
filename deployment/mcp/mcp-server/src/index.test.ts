import { describe, it, expect, jest } from '@jest/globals';
import { FataplusTools } from './tools.js';

// Mock axios
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('FataplusTools', () => {
  let tools: FataplusTools;

  beforeEach(() => {
    tools = new FataplusTools();
    jest.clearAllMocks();
  });

  describe('getWeatherData', () => {
    it('should fetch weather data successfully', async () => {
      const mockWeatherData = {
        temperature: 25,
        humidity: 70,
        conditions: 'sunny'
      };

      mockedAxios.mockResolvedValueOnce({
        data: mockWeatherData
      });

      const result = await tools.getWeatherData({
        location: 'Test Location'
      });

      expect(result).toHaveProperty('content');
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Weather data for Test Location');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/weather',
          params: { location: 'Test Location' }
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('API Error'));

      await expect(tools.getWeatherData({
        location: 'Test Location'
      })).rejects.toThrow('Failed to fetch data from /api/weather');
    });
  });

  describe('getMarketPrices', () => {
    it('should fetch market prices with filters', async () => {
      const mockPriceData = {
        product: 'rice',
        price: 1500,
        currency: 'MGA'
      };

      mockedAxios.mockResolvedValueOnce({
        data: mockPriceData
      });

      const result = await tools.getMarketPrices({
        product: 'rice',
        region: 'Antananarivo'
      });

      expect(result.content[0].text).toContain('rice');
      expect(result.content[0].text).toContain('Antananarivo');
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/market/prices',
          params: {
            product: 'rice',
            region: 'Antananarivo'
          }
        })
      );
    });
  });

  describe('Resource Methods', () => {
    it('should fetch current weather resource', async () => {
      const mockData = { temperature: 22, conditions: 'cloudy' };

      mockedAxios.mockResolvedValueOnce({
        data: mockData
      });

      const result = await tools.getCurrentWeather();

      expect(result.contents[0].uri).toBe('fataplus://weather/current');
      expect(result.contents[0].mimeType).toBe('application/json');
      expect(result.contents[0].text).toBe(JSON.stringify(mockData, null, 2));
    });

    it('should fetch market prices resource', async () => {
      const mockData = { rice: 1500, maize: 1200 };

      mockedAxios.mockResolvedValueOnce({
        data: mockData
      });

      const result = await tools.getCurrentMarketPrices();

      expect(result.contents[0].uri).toBe('fataplus://market/prices');
      expect(result.contents[0].text).toBe(JSON.stringify(mockData, null, 2));
    });
  });
});
