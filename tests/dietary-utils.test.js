const test = require('node:test');
const assert = require('node:assert/strict');
const { findVegetarianConflict } = require('../public/assets/js/dietary-utils');

test('vegetarian food checks flag clear Vietnamese and English meat or fish names', () => {
  ['Cơm gà', 'Bún bò', 'Cá hồi áp chảo', 'Shrimp salad', 'Chicken rice'].forEach((name) => {
    assert.equal(findVegetarianConflict(name, 'vegetarian').conflict, true, name);
  });
});

test('vegetarian food checks do not flag plant foods or omnivore profiles', () => {
  ['Đậu phụ rau củ', 'Cơm chay', 'Oatmeal with banana'].forEach((name) => {
    assert.equal(findVegetarianConflict(name, 'vegetarian').conflict, false, name);
  });
  assert.equal(findVegetarianConflict('Chicken rice', 'omnivore').conflict, false);
});

test('vegan food checks also flag eggs and dairy while allowing plant foods', () => {
  ['Boiled egg', 'Greek yogurt', 'Sữa chua', 'Cheese sandwich'].forEach((name) => {
    assert.equal(findVegetarianConflict(name, 'vegan').conflict, true, name);
  });
  assert.equal(findVegetarianConflict('Đậu phụ rau củ', 'vegan').conflict, false);
});
