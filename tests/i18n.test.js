const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeLanguage, STORAGE_KEY, translateText, VI_TO_EN } = require('../public/assets/js/i18n');
const { MEAL_CATALOG } = require('../src/services/meal-suggestion.service');

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

test('overview and profile helper text switch completely between languages', () => {
  const examples = [
    ['Việc tiếp theo của bạn', 'Your next actions'],
    ['FitAI đang chọn những việc quan trọng nhất cho hôm nay.', 'FitAI is selecting the most important actions for today.'],
    ['BMR ước tính', 'Estimated BMR'],
    ['TDEE ước tính', 'Estimated TDEE'],
    ['Hãy ghi ít nhất 4 ngày trước khi so sánh vận động với hồ sơ.', 'Record at least 4 days before comparing observed activity with your profile.'],
    ['Hãy ghi ít nhất 4 ngày để nhận nhận xét về khả năng phục hồi.', 'Record at least 4 days to receive recovery insights.']
  ];

  examples.forEach(([vietnamese, english]) => {
    assert.equal(translateText(vietnamese, 'en'), english);
    assert.equal(translateText(english, 'vi'), vietnamese);
  });
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

test('dietary preference labels translate reliably in both directions', () => {
  assert.equal(translateText('Ăn đa dạng', 'en'), 'Omnivorous');
  assert.equal(translateText('Ăn chay có trứng và sữa', 'en'), 'Lacto-ovo vegetarian');
  assert.equal(translateText('Omnivorous', 'vi'), 'Ăn đa dạng');
  assert.equal(translateText('Lacto-ovo vegetarian', 'vi'), 'Ăn chay có trứng và sữa');
  assert.equal(
    translateText('Thuần chay (không thịt, cá, trứng, sữa)', 'en'),
    'Vegan (no meat, fish, eggs, or dairy)'
  );
});

test('full activity option labels translate in both directions', () => {
  const vietnamese = 'Vận động nhẹ (đi lại thường xuyên)';
  const english = 'Lightly active (regular walking)';
  assert.equal(translateText(vietnamese, 'en'), english);
  assert.equal(translateText(english, 'vi'), vietnamese);
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
    ['Tìm thấy 8 kết quả USDA. Hãy chọn bản ghi và khẩu phần gần đúng nhất.', 'Found 8 USDA results. Choose the closest record and portion.'],
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

test('profile-based meal suggestions translate their labels and dynamic targets', () => {
  assert.equal(translateText('Ý tưởng món ăn theo mục tiêu của bạn', 'en'), 'Meal ideas for your goal');
  assert.equal(translateText('Bữa sáng', 'en'), 'Breakfast');
  assert.equal(translateText('1650 kcal/ngày · 102 g protein', 'en'), '1650 kcal/day · 102 g protein');
  assert.equal(
    translateText('370–450 kcal · khoảng 26 g protein', 'en'),
    '370–450 kcal · about 26 g protein'
  );
  assert.equal(
    translateText('Ngân sách bữa: 25% · khoảng 410 kcal · 26 g protein', 'en'),
    'Meal budget: 25% · about 410 kcal · 26 g protein'
  );
  assert.match(
    translateText('Ý tưởng món — chưa tính khẩu phần và dinh dưỡng chính xác. Hãy cân và tra cứu USDA.', 'en'),
    /portion size and nutrition have not been calculated/
  );
});

test('every meal suggestion, including snacks, has an English translation', () => {
  Object.values(MEAL_CATALOG).flat().forEach(({ name }) => {
    assert.notEqual(translateText(name, 'en'), name, `Missing English translation for: ${name}`);
  });
  assert.equal(translateText('Bữa phụ', 'en'), 'Snack');
});

test('allergy limitations are explicit in both languages', () => {
  const warning = 'FitAI chỉ lọc theo tag của món mẫu; không thể kiểm tra nước sốt, công thức thực tế hoặc nhiễm chéo khi chế biến. Luôn đọc nhãn, kiểm tra đầy đủ thành phần và hỏi người chế biến trước khi ăn.';
  const english = translateText(warning, 'en');
  assert.match(english, /sauces/);
  assert.match(english, /cross-contact/);
  assert.match(english, /read the label/);
});

test('activity TDEE is described as a reference that does not change the plan', () => {
  assert.equal(
    translateText('TDEE tham khảo từ vận động', 'en'),
    'Activity-based reference TDEE'
  );
  const note = translateText(
    'TDEE tham khảo từ vận động chỉ dùng để đối chiếu với hồ sơ. FitAI không tự động thay đổi mục tiêu calorie hoặc kế hoạch của bạn theo con số này.',
    'en'
  );
  assert.match(note, /comparison/);
  assert.match(note, /does not automatically change/);
});

test('missing USDA nutrients are explained without translating them as zero', () => {
  assert.equal(translateText('Không có dữ liệu', 'en'), 'No data');
  assert.equal(
    translateText('Không thể lưu bản ghi này vì USDA thiếu: năng lượng, chất xơ. Hãy chọn bản ghi khác có đủ dữ liệu.', 'en'),
    'This record cannot be saved because USDA is missing: calories, fiber. Choose another record with complete data.'
  );
});

test('dynamic nutrition labels and label-confirmed fiber are translated', () => {
  assert.equal(translateText('Chất đạm:', 'en'), 'Protein:');
  assert.equal(translateText('Tinh bột:', 'en'), 'Carbs:');
  assert.equal(translateText('Chất béo:', 'en'), 'Fat:');
  assert.equal(translateText('Chất xơ:', 'en'), 'Fiber:');
  assert.equal(
    translateText('Chất xơ 0 g do người dùng xác nhận từ nhãn sản phẩm.', 'en'),
    'Fiber 0 g was confirmed by the user from the product label.'
  );
});

test('Firebase-protected AI errors are available in both languages', () => {
  assert.equal(
    translateText('Hãy đăng nhập để sử dụng tính năng AI.', 'en'),
    'Sign in to use AI features.'
  );
  assert.equal(
    translateText('Your sign-in session is invalid or expired. Sign in again.', 'vi'),
    'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Hãy đăng nhập lại.'
  );
});
