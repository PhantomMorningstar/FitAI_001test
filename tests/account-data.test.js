const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  buildAccountExport,
  clearLocalAccountData,
  deleteAccountData,
  loadAccountData,
  serializeValue
} = require('../public/assets/js/account-data-utils');

const readProjectFile = (...parts) => fs.readFileSync(
  path.join(__dirname, '..', ...parts),
  'utf8'
);

test('account export serializes Firestore timestamps and nested values to JSON-safe data', () => {
  const serialized = serializeValue({
    recordedAt: { toDate: () => new Date('2026-10-08T01:00:00.000Z') },
    dates: [new Date('2026-10-07T00:00:00.000Z')],
    nested: { value: 4 }
  });

  assert.deepEqual(serialized, {
    recordedAt: '2026-10-08T01:00:00.000Z',
    dates: ['2026-10-07T00:00:00.000Z'],
    nested: { value: 4 }
  });
});

test('account export uses a versioned format and includes all supplied account data', () => {
  const data = {
    profile: { weight: 68 },
    foodDiaries: [{ calories: 450 }],
    weightEntries: [{ weightKg: 67.5 }],
    activityEntries: [{ steps: 7000 }],
    wellnessEntries: [{ sleepHours: 7.5 }],
    diaryDayStatuses: [{ completed: true }]
  };
  const exported = buildAccountExport({
    uid: 'user-123',
    email: 'user@example.com',
    exportedAt: '2026-10-08T01:00:00.000Z',
    data
  });
  assert.equal(exported.format, 'fitai-account-export');
  assert.equal(exported.version, 1);
  assert.deepEqual(exported.account, { uid: 'user-123', email: 'user@example.com' });
  assert.deepEqual(exported.data, data);
});

test('account deletion clears only local state associated with the deleted UID', () => {
  const values = new Map([
    ['fitai_onboarding_completed_user_user-a', 'true'],
    ['fitai_onboarding_draft_user_user-a', '{}'],
    ['fitai_reminders_sent_user-a', '{}'],
    ['fitai_onboarding_draft_user_user-b', '{}']
  ]);
  const storage = { removeItem: (key) => values.delete(key) };

  clearLocalAccountData(storage, 'user-a');

  assert.deepEqual([...values.keys()], ['fitai_onboarding_draft_user_user-b']);
});

function createMemoryFirestore(records, profiles = {}) {
  const deletedPaths = [];
  const batches = [];
  const collection = (collectionName) => ({
    where(field, operator, value) {
      assert.equal(operator, '==');
      return {
        async get() {
          const documents = records
            .filter((record) => record.collectionName === collectionName && record[field] === value)
            .map((record) => ({
              id: record.id,
              data: () => record,
              ref: { path: `${collectionName}/${record.id}`, collectionName, id: record.id }
            }));
          return { docs: documents, forEach: (callback) => documents.forEach(callback) };
        }
      };
    },
    doc(id) {
      const reference = { path: `${collectionName}/${id}`, collectionName, id };
      if (collectionName !== 'profiles') return reference;
      return {
        ...reference,
        async get() {
          const profile = profiles[id];
          return { exists: Boolean(profile), id, data: () => profile };
        },
        async delete() {
          delete profiles[id];
          deletedPaths.push(reference.path);
        }
      };
    }
  });

  return {
    deletedPaths,
    batches,
    collection,
    batch() {
      const batchReferences = [];
      return {
        delete: (reference) => batchReferences.push(reference),
        async commit() {
          batches.push(batchReferences);
          deletedPaths.push(...batchReferences.map(({ path: documentPath }) => documentPath));
          for (const reference of batchReferences) {
            const recordIndex = records.findIndex((record) => (
              record.collectionName === reference.collectionName && record.id === reference.id
            ));
            if (recordIndex !== -1) records.splice(recordIndex, 1);
          }
        }
      };
    }
  };
}

test('account data export queries each supported collection for the signed-in UID only', async () => {
  const timestamp = { toDate: () => new Date('2026-10-08T01:00:00.000Z') };
  const db = createMemoryFirestore([
    { collectionName: 'foodDiaries', id: 'meal-current', ownerId: 'user-a', calories: 400 },
    { collectionName: 'foodDiaries', id: 'meal-legacy', userId: 'user-a', timestamp },
    { collectionName: 'foodDiaries', id: 'meal-other', ownerId: 'user-b', calories: 900 },
    { collectionName: 'weightEntries', id: 'weight-a', ownerId: 'user-a', weightKg: 68 },
    { collectionName: 'activityEntries', id: 'activity-a', ownerId: 'user-a', steps: 7000 },
    { collectionName: 'wellnessEntries', id: 'wellness-a', ownerId: 'user-a', sleepHours: 7 },
    { collectionName: 'diaryDayStatuses', id: 'status-a', ownerId: 'user-a', completed: true }
  ], { 'user-a': { ownerId: 'user-a', height: 170 } });

  const result = await loadAccountData(db, { uid: 'user-a' });

  assert.deepEqual(result.profile, { ownerId: 'user-a', height: 170, documentId: 'user-a' });
  assert.deepEqual(result.foodDiaries.map(({ documentId }) => documentId), [
    'meal-current',
    'meal-legacy'
  ]);
  assert.equal(result.foodDiaries[1].timestamp, '2026-10-08T01:00:00.000Z');
  assert.equal(result.weightEntries.length, 1);
  assert.equal(result.activityEntries.length, 1);
  assert.equal(result.wellnessEntries.length, 1);
  assert.equal(result.diaryDayStatuses.length, 1);
});

test('account deletion batches owned records, includes legacy diaries, and preserves other UIDs', async () => {
  const records = [
    { collectionName: 'foodDiaries', id: 'meal-current', ownerId: 'user-a' },
    { collectionName: 'foodDiaries', id: 'meal-legacy', userId: 'user-a' },
    { collectionName: 'foodDiaries', id: 'meal-other', ownerId: 'user-b' },
    { collectionName: 'weightEntries', id: 'weight-other', ownerId: 'user-b' },
    ...Array.from({ length: 451 }, (_, index) => ({
      collectionName: 'activityEntries',
      id: `activity-${index}`,
      ownerId: 'user-a'
    }))
  ];
  const profiles = { 'user-a': { ownerId: 'user-a' }, 'user-b': { ownerId: 'user-b' } };
  const db = createMemoryFirestore(records, profiles);

  await deleteAccountData(db, 'user-a');

  assert.equal(db.batches.length, 2);
  assert.deepEqual(db.batches.map((batch) => batch.length), [450, 3]);
  assert.ok(db.deletedPaths.includes('foodDiaries/meal-legacy'));
  assert.ok(db.deletedPaths.includes('profiles/user-a'));
  assert.ok(!db.deletedPaths.includes('foodDiaries/meal-other'));
  assert.ok(!db.deletedPaths.includes('weightEntries/weight-other'));
  assert.deepEqual(records.map(({ id }) => id), ['meal-other', 'weight-other']);
  assert.deepEqual(profiles, { 'user-b': { ownerId: 'user-b' } });
});

test('account data controls require reauthentication and target the active UID', () => {
  const app = readProjectFile('public', 'assets', 'js', 'app.js');
  const profile = readProjectFile('views', 'pages', 'profile.ejs');
  const scripts = readProjectFile('views', 'partials', 'app-scripts.ejs');

  assert.match(profile, /id="export-account-data-btn"/);
  assert.match(profile, /id="delete-account-btn"/);
  assert.match(profile, /id="delete-account-password"/);
  assert.match(scripts, /account-data-utils\.js/);
  assert.match(app, /await user\.reauthenticateWithCredential\(credential\)/);
  assert.match(app, /deleteAccountData\(db, user\.uid\)/);
  assert.match(app, /clearLocalAccountData\(localStorage, user\.uid\)/);
  assert.match(app, /await user\.delete\(\)/);
});
