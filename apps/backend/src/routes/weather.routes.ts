import { Router, Request, Response } from 'express';
import { getCurrentWeather, getWeatherByCoordinates, getForecast } from '../services/weather.service';

const router = Router();

// GET /api/weather/current?city=London
router.get('/current', async (req: Request, res: Response) => {
  const { city } = req.query;

  if (!city || typeof city !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid query parameter: city',
    });
  }

  const result = await getCurrentWeather(city);
  
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// GET /api/weather/coordinates?lat=30.5&lon=-97.7
router.get('/coordinates', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({
      error: 'Missing query parameters: lat and lon',
    });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      error: 'Invalid coordinates format',
    });
  }

  const result = await getWeatherByCoordinates(latitude, longitude);
  
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// GET /api/weather/forecast?city=London&days=5
router.get('/forecast', async (req: Request, res: Response) => {
  const { city, days } = req.query;

  if (!city || typeof city !== 'string') {
    return res.status(400).json({
      error: 'Missing or invalid query parameter: city',
    });
  }

  const numDays = days ? parseInt(days as string) : 5;

  const result = await getForecast(city, numDays);
  
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

export default router;

