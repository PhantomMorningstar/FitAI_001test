const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractOutputText,
  normalizeRecognitionResult,
  recognizeFood,
  validateImageDataUrl
} = require('../src/services/food-vision.service');

const tinyJpeg = 'data:image/jpeg;base64,/9j/2Q==';

test('food vision accepts supported data URLs and rejects unsafe input', () => {
  assert.equal(validateImageDataUrl(tinyJpeg).valid, true);
  assert.equal(validateImageDataUrl('data:text/html;base64,PGgxPng8L2gxPg==').valid, false);
  assert.equal(validateImageDataUrl('https://example.com/image.jpg').valid, false);
});

test('food vision requires a server-side Gemini API key', async () => {
  await assert.rejects(
    recognizeFood({ imageDataUrl: tinyJpeg, apiKey: '', model: 'gemini-3.6-flash' }),
    (error) => error.statusCode === 503 && /GEMINI_API_KEY/.test(error.message)
  );
});

test('food vision sends image input and returns structured candidates', async () => {
  const expected = {
    isFood: true,
    candidates: [{ name: 'fried chicken', preparation: 'fried', confidence: 0.91 }],
    note: 'Confirm the cooking method.'
  };
  let request;
  const result = await recognizeFood({
    imageDataUrl: tinyJpeg,
    apiKey: 'server-secret',
    model: 'gemini-3.6-flash',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(expected) }] } }]
        })
      };
    }
  });

  const body = JSON.parse(request.options.body);
  assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
  assert.equal(request.options.headers['x-goog-api-key'], 'server-secret');
  assert.equal(body.contents[0].parts[1].inline_data.mime_type, 'image/jpeg');
  assert.equal(body.generationConfig.responseMimeType, 'application/json');
  assert.deepEqual(body.generationConfig.responseJsonSchema.required, ['isFood', 'candidates', 'note']);
  assert.deepEqual(result, {
    ...expected,
    confidenceLevel: 'high',
    requiresConfirmation: true
  });
});

test('output text extraction joins Gemini text parts', () => {
  assert.equal(extractOutputText({ candidates: [{ content: { parts: [{ text: '{' }, { text: '}' }] } }] }), '{}');
});

test('recognition results are normalized and assigned a confidence level', () => {
  assert.deepEqual(normalizeRecognitionResult({
    isFood: true,
    candidates: [
      { name: ' chicken ', preparation: ' grilled ', confidence: 0.64 },
      { name: '', preparation: 'unknown', confidence: 0.9 },
      { name: 'rice', preparation: 'steamed', confidence: 4 }
    ],
    note: ' Please confirm. '
  }), {
    isFood: true,
    candidates: [{ name: 'chicken', preparation: 'grilled', confidence: 0.64 }],
    note: 'Please confirm.',
    confidenceLevel: 'medium',
    requiresConfirmation: true
  });
  assert.throws(() => normalizeRecognitionResult({ isFood: true, candidates: [] }), /invalid/);
});
