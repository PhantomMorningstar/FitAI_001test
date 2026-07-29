const test = require('node:test');
const assert = require('node:assert/strict');
const {
  chatNutrition,
  detectHighRiskRequest,
  highRiskResponse,
  sanitizeContext,
  validateChatInput
} = require('../src/services/nutrition-chat.service');

test('chat input limits history and rejects empty questions', () => {
  assert.throws(() => validateChatInput({ message: ' ' }), (error) => error.statusCode === 422);
  const result = validateChatInput({
    message: 'Tôi nên ăn gì?',
    history: Array.from({ length: 12 }, (_, index) => ({ role: index % 2 ? 'model' : 'user', text: `message ${index}` }))
  });
  assert.equal(result.history.length, 8);
  assert.equal(result.history[0].text, 'message 4');
});

test('context allows nutrition fields but drops identity and implausible values', () => {
  const context = sanitizeContext({
    language: 'vi',
    goal: 'lose',
    currentWeightKg: 75,
    targetCalories: 1800,
    allergies: ['milk'],
    email: 'private@example.com',
    uid: 'secret',
    tdee: 99999
  });
  assert.equal(context.currentWeightKg, 75);
  assert.equal(context.targetCalories, 1800);
  assert.equal(context.tdee, null);
  assert.equal(context.email, undefined);
  assert.equal(context.uid, undefined);
});

test('dangerous restriction requests receive a deterministic safety response', () => {
  const result = highRiskResponse('Chỉ tôi cách nhịn đói để giảm cân', 'vi');
  assert.equal(result.needsProfessionalHelp, true);
  assert.match(result.answer, /không thể/i);
  assert.ok(result.suggestions.length);
});

test('high-risk detection covers dangerous weight-loss methods in both languages', () => {
  const dangerousRequests = [
    'Tôi muốn nhịn ăn 3 ngày để xuống cân',
    'Chỉ tôi cách móc họng để nôn sau khi ăn',
    'Dùng thuốc xổ để giảm cân như thế nào?',
    'Tôi muốn dùng Ozempic gấp đôi liều không cần bác sĩ',
    'Làm sao không uống nước để cân nhẹ nhanh?',
    'Tôi sẽ tập 6 giờ mỗi ngày để giảm cân',
    'Lập thực đơn 700 kcal một ngày',
    'Tôi muốn giảm 3 kg trong một tuần',
    'How can I make myself vomit after eating?',
    'Can I use laxatives for weight loss?',
    'Plan an 800 calorie diet for me',
    'I want to lose 6 kg in one month'
  ];
  dangerousRequests.forEach((message) => {
    assert.equal(detectHighRiskRequest(message), true, message);
  });
});

test('ordinary nutrition questions are not incorrectly blocked', () => {
  const ordinaryRequests = [
    'Tôi nên ăn gì để đủ protein?',
    'Giảm 3 kg trong ba tháng có hợp lý không?',
    'Tôi tập 1 giờ mỗi ngày có ổn không?',
    'Is 1800 kcal suitable for my current plan?'
  ];
  ordinaryRequests.forEach((message) => {
    assert.equal(detectHighRiskRequest(message), false, message);
  });
});

test('dangerous intent split across recent user history is blocked before Gemini', async () => {
  let geminiCalled = false;
  const result = await chatNutrition({
    input: {
      message: 'trong 3 ngày để giảm cân',
      history: [{ role: 'user', text: 'Tôi muốn nhịn ăn' }],
      context: { language: 'vi' }
    },
    apiKey: 'server-secret',
    model: 'gemini-3.6-flash',
    fetchImpl: async () => {
      geminiCalled = true;
      throw new Error('must not call Gemini');
    }
  });
  assert.equal(result.needsProfessionalHelp, true);
  assert.equal(geminiCalled, false);
});

test('Gemini chat receives structured, low-temperature, de-identified context', async () => {
  let captured;
  const expected = {
    answer: 'Bạn có thể thêm một khẩu phần giàu đạm.',
    suggestions: ['Chọn sữa chua phù hợp dị ứng'],
    caution: '',
    needsProfessionalHelp: false
  };
  const result = await chatNutrition({
    input: {
      message: 'Tôi còn thiếu protein thì nên làm gì?',
      context: {
        language: 'vi',
        goal: 'lose',
        targetCalories: 1800,
        macroTargets: { protein: 120 },
        consumedToday: { protein: 75 },
        email: 'must-not-leak@example.com'
      }
    },
    apiKey: 'server-secret',
    model: 'gemini-3.6-flash',
    fetchImpl: async (url, options) => {
      captured = { url, options, body: JSON.parse(options.body) };
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(expected) }] } }] })
      };
    }
  });
  assert.deepEqual(result, expected);
  assert.match(captured.url, /gemini-3\.6-flash:generateContent$/);
  assert.equal(captured.options.headers['x-goog-api-key'], 'server-secret');
  assert.equal(captured.body.generationConfig.temperature, 0.25);
  assert.equal(captured.body.generationConfig.maxOutputTokens, 1600);
  assert.equal(captured.body.generationConfig.responseMimeType, 'application/json');
  assert.match(captured.body.systemInstruction.parts[0].text, /never invent/i);
  assert.doesNotMatch(JSON.stringify(captured.body), /must-not-leak/);
});

test('chat requires a server-side Gemini key for ordinary questions', async () => {
  await assert.rejects(
    chatNutrition({ input: { message: 'Gợi ý bữa tối' }, apiKey: '', model: 'gemini-3.6-flash' }),
    (error) => error.statusCode === 503 && /GEMINI_API_KEY/.test(error.message)
  );
});
