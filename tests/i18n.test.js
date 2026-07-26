const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLanguage, STORAGE_KEY, translateText, VI_TO_EN } = require('../public/assets/js/i18n');

test('language preference accepts English and defaults everything else to Vietnamese', () => {
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage('vi'), 'vi');
  assert.equal(normalizeLanguage('unknown'), 'vi');
  assert.equal(STORAGE_KEY, 'fitai_language');
});

test('core navigation and health terms have English translations', () => {
  assert.equal(translateText('Tổng quan', 'en'), 'Overview');
  assert.equal(translateText('Nhật ký thực phẩm', 'en'), 'Food diary');
  assert.equal(translateText('Chất đạm', 'en'), 'Protein');
  assert.equal(translateText('Cân nặng', 'en'), 'Weight');
  assert.equal(translateText('Tổng quan', 'vi'), 'Tổng quan');
});

test('translation preserves surrounding whitespace and unknown values', () => {
  assert.equal(translateText('  Đăng nhập\n', 'en'), '  Sign in\n');
  assert.equal(translateText('FitAI', 'en'), 'FitAI');
  assert.ok(Object.keys(VI_TO_EN).length >= 80);
});

test('English source strings are localized back to Vietnamese', () => {
  assert.equal(translateText('Edit', 'vi'), 'Sửa');
  assert.equal(
    translateText('No food items were logged for this date.', 'vi'),
    'Không có món ăn nào được ghi cho ngày này.'
  );
});

test('dynamic progress messages translate without losing their values', () => {
  assert.equal(translateText('2/4 đã hoàn thành', 'en'), '2/4 completed');
  assert.equal(
    translateText('Dựa trên 8 số đo cân nặng và 12 ngày ghi món ăn.', 'en'),
    'Based on 8 weight measurements and 12 food-log days.'
  );
  assert.equal(
    translateText('Based on 8 weight measurements and 12 food-log days.', 'vi'),
    'Dựa trên 8 số đo cân nặng và 12 ngày ghi món ăn.'
  );
});

test('runtime authentication, activity, camera, and roadmap messages translate', () => {
  const examples = [
    ['Đã đăng nhập: user@example.com — email chưa xác minh', 'Signed in: user@example.com — email not verified'],
    ['Mức vận động quan sát phù hợp với hồ sơ. Tiến độ vận động tuần: 120/150 phút.', 'Observed activity matches the profile. Weekly activity progress: 120/150 minutes.'],
    ['Độ tin cậy của gợi ý: 82%.', 'Suggestion confidence: 82%.'],
    ['Tìm thấy 8 kết quả USDA đã xác minh. Hãy chọn bản ghi và khẩu phần gần đúng nhất.', 'Found 8 verified USDA results. Choose the closest record and portion.'],
    ['Giai đoạn 2: Xây dựng dữ liệu nền đáng tin cậy', 'Phase 2: Build a reliable baseline'],
    ['Email chưa xác minh: user@example.com', 'Unverified email: user@example.com']
  ];

  examples.forEach(([vietnamese, english]) => {
    assert.equal(translateText(vietnamese, 'en'), english);
  });
});

test('weight history and plan calibration do not leave Vietnamese units in English mode', () => {
  const examples = [
    ['Ghi một số đo mỗi ngày. Lưu lại cùng ngày sẽ cập nhật số đo cũ.', 'Log one measurement per day. Saving the same date updates the existing measurement.'],
    ['Cân nặng (kg)', 'Weight (kg)'],
    ['-0.31 kg/tuần', '-0.31 kg/week'],
    ['473 kcal/ngày', '473 kcal/day'],
    ['kcal/ngày', 'kcal/day'],
    ['kg/tuần', 'kg/week']
  ];

  examples.forEach(([vietnamese, english]) => {
    assert.equal(translateText(vietnamese, 'en'), english);
  });
});
