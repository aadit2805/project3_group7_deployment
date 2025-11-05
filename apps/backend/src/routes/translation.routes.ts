import { Router, Request, Response } from 'express';
import { translateText, detectLanguage } from '../services/translation.service';

const router = Router();

// POST /api/translation/translate
router.post('/translate', async (req: Request, res: Response) => {
  const { text, targetLanguage, sourceLanguage } = req.body;

  if (!text || !targetLanguage) {
    return res.status(400).json({
      error: 'Missing required fields: text and targetLanguage',
    });
  }

  const result = await translateText(text, targetLanguage, sourceLanguage);

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

// POST /api/translation/detect
router.post('/detect', async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: 'Missing required field: text',
    });
  }

  const result = await detectLanguage(text);

  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

export default router;
