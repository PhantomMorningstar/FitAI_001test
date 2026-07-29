const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { calculateWeightPlan } = require('../src/services/weight-plan.service');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('goal time is explicitly disclosed as a rough estimate, not a promise', () => {
  const overview = read('views/pages/index.ejs');
  const roadmap = read('views/pages/roadmap.ejs');
  assert.match(overview, /Thời gian đạt mục tiêu là ước tính thô, không phải cam kết/);
  assert.match(roadmap, /Thời gian đạt mục tiêu là ước tính thô, không phải cam kết/);
  assert.match(overview, /kết quả thực tế có thể khác/);
});

test('weight plan metadata records the projection limitation', () => {
  const plan = calculateWeightPlan(
    { goal: 'lose', weight: 80, targetWeight: 72 },
    { tdee: 2200, bmiCategory: 'overweight' }
  );
  assert.equal(plan.assumptions.estimateIsLinear, true);
  assert.equal(plan.assumptions.activityRemainsStable, true);
  assert.equal(plan.assumptions.projectionIsEstimateNotPromise, true);
});
