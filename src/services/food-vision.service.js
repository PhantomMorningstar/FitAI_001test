const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function validateImageDataUrl(imageDataUrl) {
  if (typeof imageDataUrl !== 'string') return { valid: false, error: 'A meal image is required.' };
  const match = imageDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match || !ALLOWED_IMAGE_TYPES.has(match[1].toLowerCase())) {
    return { valid: false, error: 'Use a JPEG, PNG, WebP, or GIF image.' };
  }
  const bytes = Math.floor(match[2].length * 3 / 4);
  if (bytes > MAX_IMAGE_BYTES) return { valid: false, error: 'The image must be 5 MB or smaller.' };
  return { valid: true, bytes };
}

function extractOutputText(payload) {
  return payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('') || '';
}

function normalizeRecognitionResult(result) {
  if (!result || typeof result !== 'object' || typeof result.isFood !== 'boolean') throw new Error('invalid');
  const candidates = Array.isArray(result.candidates)
    ? result.candidates.map((candidate) => ({
      name: typeof candidate?.name === 'string' ? candidate.name.trim().slice(0, 80) : '',
      preparation: typeof candidate?.preparation === 'string' ? candidate.preparation.trim().slice(0, 60) : 'unknown',
      confidence: Number(candidate?.confidence)
    })).filter((candidate) => candidate.name
      && Number.isFinite(candidate.confidence)
      && candidate.confidence >= 0
      && candidate.confidence <= 1).slice(0, 3)
    : [];
  if (result.isFood && !candidates.length) throw new Error('invalid');
  const topConfidence = candidates.length ? Math.max(...candidates.map((candidate) => candidate.confidence)) : 0;
  return {
    isFood: result.isFood,
    candidates,
    note: typeof result.note === 'string' ? result.note.trim().slice(0, 300) : '',
    confidenceLevel: topConfidence >= 0.8 ? 'high' : topConfidence >= 0.55 ? 'medium' : 'low',
    requiresConfirmation: true
  };
}

async function recognizeFood({ imageDataUrl, apiKey, model, fetchImpl = fetch }) {
  const validation = validateImageDataUrl(imageDataUrl);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.statusCode = 422;
    throw error;
  }
  if (!apiKey) {
    const error = new Error('AI photo recognition is not configured. Add GEMINI_API_KEY to .env.');
    error.statusCode = 503;
    throw error;
  }

  const schema = {
    type: 'object',
    properties: {
      isFood: { type: 'boolean' },
      candidates: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Concise English food name suitable for USDA search.' },
            preparation: { type: 'string', description: 'Visible cooking method or unknown.' },
            confidence: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['name', 'preparation', 'confidence'],
          additionalProperties: false
        }
      },
      note: { type: 'string' }
    },
    required: ['isFood', 'candidates', 'note'],
    additionalProperties: false
  };

  const response = await fetchImpl(`${GEMINI_API_ROOT}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: 'Identify the main visible food for USDA database search. Return concise English food names and visible preparation methods. Never estimate calories, nutrients, portion weight, oil, sauces, or hidden ingredients. A mixed plate may produce up to three visible food candidates. Lower confidence when the image, ingredients, or preparation are uncertain.'
          },
          {
            inline_data: {
              mime_type: imageDataUrl.slice(5, imageDataUrl.indexOf(';')),
              data: imageDataUrl.slice(imageDataUrl.indexOf(',') + 1)
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: schema
      }
    }),
    signal: AbortSignal.timeout(30000)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(response.status === 429
      ? 'AI recognition rate limit was reached. Please try again later.'
      : (payload.error?.message || 'Gemini photo recognition is temporarily unavailable.'));
    error.statusCode = response.status === 429 ? 429 : 502;
    throw error;
  }

  const outputText = extractOutputText(payload);
  if (!outputText) {
    const error = new Error('AI could not produce a food suggestion for this image.');
    error.statusCode = 422;
    throw error;
  }
  try {
    return normalizeRecognitionResult(JSON.parse(outputText));
  } catch {
    const error = new Error('AI returned an invalid food-recognition result. Please try again.');
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { extractOutputText, normalizeRecognitionResult, recognizeFood, validateImageDataUrl };
