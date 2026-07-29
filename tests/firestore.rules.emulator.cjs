const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require('@firebase/rules-unit-testing');
const {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} = require('firebase/firestore');

let environment;

test.before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-fitai',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8')
    }
  });
});

test.beforeEach(async () => environment.clearFirestore());
test.after(async () => environment.cleanup());

const dbFor = (uid) => environment.authenticatedContext(uid).firestore();
const guestDb = () => environment.unauthenticatedContext().firestore();

const seed = (callback) => environment.withSecurityRulesDisabled(async (context) => callback(context.firestore()));

const validStoredProfile = (ownerId = 'user-a', overrides = {}) => ({
  ownerId,
  accountType: 'registered',
  updatedAt: Timestamp.now(),
  gender: 'Male',
  dob: '1995-05-10',
  age: 31,
  height: 175,
  weight: 78,
  activity: 'lightly',
  goal: 'lose',
  targetWeight: 70,
  allergies: [],
  dietaryPreference: 'omnivore',
  healthContext: {
    pregnant: false,
    breastfeeding: false,
    eatingDisorderHistory: false,
    clinicianSupervised: false
  },
  ...overrides
});

const validFoodEntry = (ownerId, timestamp = Timestamp.now()) => ({
  ownerId,
  foodName: 'Chicken rice',
  calories: 520,
  protein: 38,
  carbs: 62,
  fat: 12,
  fiber: 4,
  servingGrams: 350,
  nutritionSource: 'USDA FoodData Central',
  fdcId: 123456,
  dataType: 'Foundation',
  brandName: null,
  gtinUpc: null,
  timestamp
});

test('unauthenticated clients cannot read or create profiles', async () => {
  await assertFails(getDoc(doc(guestDb(), 'profiles/user-a')));
  await assertFails(setDoc(doc(guestDb(), 'profiles/user-a'), { ownerId: 'user-a' }));
});

test('users can create and read only their own profile', async () => {
  const userA = dbFor('user-a');
  await assertSucceeds(setDoc(doc(userA, 'profiles/user-a'), validStoredProfile()));
  await assertSucceeds(getDoc(doc(userA, 'profiles/user-a')));
  await assertFails(getDoc(doc(dbFor('user-b'), 'profiles/user-a')));
  await assertFails(setDoc(doc(userA, 'profiles/user-b'), validStoredProfile()));
});

test('profile ownerId cannot be changed or spoofed', async () => {
  await seed((db) => setDoc(doc(db, 'profiles/user-a'), validStoredProfile()));
  await assertFails(updateDoc(doc(dbFor('user-a'), 'profiles/user-a'), { ownerId: 'user-b' }));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'profiles/user-a'), { weight: 71 }));
});

test('profile documents created before ownerId can be migrated only by their matching UID', async () => {
  const legacyProfile = validStoredProfile();
  delete legacyProfile.ownerId;
  await seed((db) => setDoc(doc(db, 'profiles/user-a'), legacyProfile));
  await assertSucceeds(updateDoc(doc(dbFor('user-a'), 'profiles/user-a'), { ownerId: 'user-a' }));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'profiles/user-a'), { ownerId: 'user-b' }));
});

test('profiles reject malformed, implausible, goal-inconsistent, and unknown fields', async () => {
  const profile = doc(dbFor('user-a'), 'profiles/user-a');
  await assertFails(setDoc(profile, validStoredProfile('user-a', { height: 80 })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { weight: '78' })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { age: 12 })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { activity: 'extreme' })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { goal: 'lose', targetWeight: 90 })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { allergies: ['unknown'] })));
  await assertSucceeds(setDoc(profile, validStoredProfile('user-a', { dietaryPreference: 'vegan' })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { dietaryPreference: 'pescatarian' })));
  await assertFails(setDoc(profile, validStoredProfile('user-a', { admin: true })));
});

test('profile derived values and reminder settings are range checked', async () => {
  const profile = doc(dbFor('user-a'), 'profiles/user-a');
  await assertSucceeds(setDoc(profile, validStoredProfile('user-a', {
    metrics: { bmi: 25.5, bmr: 1700, tdee: 2300 },
    plan: { targetCalories: 1900, maintenanceCalories: 2300 },
    macros: { targetCalories: 1900, protein: 125, carbs: 210, fat: 55, fiber: 27 },
    safety: { allowed: true },
    mealSuggestions: { available: true }
  })));
  await assertSucceeds(updateDoc(profile, {
    reminders: {
      enabled: true,
      items: {
        meal: { enabled: true, time: '20:00' },
        weight: { enabled: true, time: '08:00' },
        activity: { enabled: false, time: '20:30' },
        wellness: { enabled: false, time: '21:00' }
      }
    },
    updatedAt: Timestamp.now()
  }));
  await assertFails(updateDoc(profile, {
    'plan.targetCalories': 500,
    updatedAt: Timestamp.now()
  }));
  await assertFails(updateDoc(profile, {
    'reminders.items.meal.time': '99:99',
    updatedAt: Timestamp.now()
  }));
});

test('food diary creation requires ownerId to match authenticated UID', async () => {
  const timestamp = Timestamp.now();
  const missingTimestamp = validFoodEntry('user-a', timestamp);
  delete missingTimestamp.timestamp;
  await assertSucceeds(addDoc(collection(dbFor('user-a'), 'foodDiaries'), validFoodEntry('user-a', timestamp)));
  await assertFails(addDoc(collection(dbFor('user-a'), 'foodDiaries'), validFoodEntry('user-b', timestamp)));
  await assertFails(addDoc(collection(guestDb(), 'foodDiaries'), validFoodEntry('user-a', timestamp)));
  await assertFails(addDoc(collection(dbFor('user-a'), 'foodDiaries'), missingTimestamp));
});

test('food diary rejects negative, implausible, malformed, and unknown values', async () => {
  const diary = collection(dbFor('user-a'), 'foodDiaries');
  await assertFails(addDoc(diary, { ...validFoodEntry('user-a'), calories: -1 }));
  await assertFails(addDoc(diary, { ...validFoodEntry('user-a'), protein: 2001 }));
  await assertFails(addDoc(diary, { ...validFoodEntry('user-a'), servingGrams: 0 }));
  await assertFails(addDoc(diary, { ...validFoodEntry('user-a'), servingGrams: 2001 }));
  await assertFails(addDoc(diary, { ...validFoodEntry('user-a'), calories: '520' }));
  await assertFails(addDoc(diary, { ...validFoodEntry('user-a'), admin: true }));
});

test('food diary documents are private to their owner', async () => {
  await seed((db) => setDoc(doc(db, 'foodDiaries/meal-1'), validFoodEntry('user-a')));
  await assertSucceeds(getDoc(doc(dbFor('user-a'), 'foodDiaries/meal-1')));
  await assertSucceeds(updateDoc(doc(dbFor('user-a'), 'foodDiaries/meal-1'), { calories: 420 }));
  await assertFails(updateDoc(doc(dbFor('user-a'), 'foodDiaries/meal-1'), { calories: -10 }));
  await assertFails(updateDoc(doc(dbFor('user-a'), 'foodDiaries/meal-1'), { servingGrams: 5000 }));
  await assertFails(getDoc(doc(dbFor('user-b'), 'foodDiaries/meal-1')));
  await assertFails(deleteDoc(doc(dbFor('user-b'), 'foodDiaries/meal-1')));
});

test('food diary list queries must be restricted to the signed-in owner', async () => {
  await seed(async (db) => {
    await setDoc(doc(db, 'foodDiaries/meal-a'), validFoodEntry('user-a'));
    await setDoc(doc(db, 'foodDiaries/meal-b'), validFoodEntry('user-b'));
  });
  const ownQuery = query(collection(dbFor('user-a'), 'foodDiaries'), where('ownerId', '==', 'user-a'));
  const otherQuery = query(collection(dbFor('user-a'), 'foodDiaries'), where('ownerId', '==', 'user-b'));
  const ownSnapshot = await assertSucceeds(getDocs(ownQuery));
  assert.equal(ownSnapshot.size, 1);
  await assertFails(getDocs(collection(dbFor('user-a'), 'foodDiaries')));
  await assertFails(getDocs(otherQuery));
  await assertFails(getDocs(query(collection(guestDb(), 'foodDiaries'), where('ownerId', '==', 'user-a'))));
});

test('legacy diary documents can be migrated only by the matching userId', async () => {
  const legacy = validFoodEntry('user-a');
  delete legacy.ownerId;
  legacy.userId = 'user-a';
  await seed((db) => setDoc(doc(db, 'foodDiaries/legacy-1'), legacy));
  await assertSucceeds(updateDoc(doc(dbFor('user-a'), 'foodDiaries/legacy-1'), {
    ownerId: 'user-a',
    userId: deleteField()
  }));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'foodDiaries/legacy-1'), { ownerId: 'user-b' }));
});

test('diary completion status is private, dated, and accepts only completed days', async () => {
  const timestamp = Timestamp.now();
  const validStatus = {
    ownerId: 'user-a',
    dateKey: '2026-07-29',
    completed: true,
    completedAt: timestamp,
    updatedAt: timestamp
  };
  const ownStatus = doc(dbFor('user-a'), 'diaryDayStatuses/user-a_2026-07-29');
  await assertSucceeds(setDoc(ownStatus, validStatus));
  await assertSucceeds(getDoc(ownStatus));
  await assertFails(getDoc(doc(dbFor('user-b'), 'diaryDayStatuses/user-a_2026-07-29')));
  await assertFails(setDoc(
    doc(dbFor('user-a'), 'diaryDayStatuses/user-b_2026-07-29'),
    validStatus
  ));
  await assertFails(setDoc(
    doc(dbFor('user-a'), 'diaryDayStatuses/user-a_2026-07-30'),
    { ...validStatus, dateKey: '2026-07-30', completed: false }
  ));
  await assertFails(updateDoc(ownStatus, { completed: false }));
  await assertSucceeds(deleteDoc(ownStatus));
});

test('weight history accepts valid owner measurements and rejects spoofing', async () => {
  const timestamp = Timestamp.now();
  const validEntry = {
    ownerId: 'user-a',
    dateKey: '2026-07-23',
    weightKg: 70.5,
    measuredAt: timestamp,
    updatedAt: timestamp
  };
  await assertSucceeds(setDoc(doc(dbFor('user-a'), 'weightEntries/user-a_2026-07-23'), validEntry));
  await assertSucceeds(getDoc(doc(dbFor('user-a'), 'weightEntries/user-a_2026-07-23')));
  await assertFails(getDoc(doc(dbFor('user-b'), 'weightEntries/user-a_2026-07-23')));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'weightEntries/user-a_2026-07-23'), { weightKg: 60 }));
  await assertFails(deleteDoc(doc(dbFor('user-b'), 'weightEntries/user-a_2026-07-23')));
  await assertFails(setDoc(doc(dbFor('user-a'), 'weightEntries/user-b_2026-07-23'), validEntry));
  await assertFails(setDoc(doc(dbFor('user-a'), 'weightEntries/user-a_2026-07-24'), {
    ...validEntry,
    dateKey: '2026-07-24',
    weightKg: 20
  }));
});

test('users can check whether their own dated daily records exist', async () => {
  const userA = dbFor('user-a');
  const ownPaths = [
    'weightEntries/user-a_2026-07-25',
    'activityEntries/user-a_2026-07-25',
    'wellnessEntries/user-a_2026-07-25'
  ];

  for (const pathName of ownPaths) {
    const snapshot = await assertSucceeds(getDoc(doc(userA, pathName)));
    assert.equal(snapshot.exists(), false);
  }

  await assertFails(getDoc(doc(userA, 'weightEntries/user-b_2026-07-25')));
  await assertFails(getDoc(doc(userA, 'activityEntries/user-b_2026-07-25')));
  await assertFails(getDoc(doc(userA, 'wellnessEntries/user-b_2026-07-25')));
});

test('activity history accepts valid owner data and rejects spoofing', async () => {
  const timestamp = Timestamp.now();
  const validEntry = {
    ownerId: 'user-a',
    dateKey: '2026-07-23',
    steps: 8000,
    activeMinutes: 35,
    measuredAt: timestamp,
    updatedAt: timestamp
  };
  const entry = doc(dbFor('user-a'), 'activityEntries/user-a_2026-07-23');
  await assertSucceeds(setDoc(entry, validEntry));
  await assertSucceeds(getDoc(entry));
  await assertFails(getDoc(doc(dbFor('user-b'), 'activityEntries/user-a_2026-07-23')));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'activityEntries/user-a_2026-07-23'), { steps: 1 }));
  await assertFails(deleteDoc(doc(dbFor('user-b'), 'activityEntries/user-a_2026-07-23')));
  await assertFails(setDoc(doc(dbFor('user-a'), 'activityEntries/user-b_2026-07-23'), validEntry));
  await assertFails(setDoc(doc(dbFor('user-a'), 'activityEntries/user-a_2026-07-24'), {
    ...validEntry,
    dateKey: '2026-07-24',
    steps: 100001
  }));
});

test('wellness history accepts valid owner data and rejects spoofing', async () => {
  const timestamp = Timestamp.now();
  const validEntry = {
    ownerId: 'user-a',
    dateKey: '2026-07-23',
    sleepHours: 7.5,
    stressLevel: 3,
    measuredAt: timestamp,
    updatedAt: timestamp
  };
  const entry = doc(dbFor('user-a'), 'wellnessEntries/user-a_2026-07-23');
  await assertSucceeds(setDoc(entry, validEntry));
  await assertSucceeds(getDoc(entry));
  await assertFails(getDoc(doc(dbFor('user-b'), 'wellnessEntries/user-a_2026-07-23')));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'wellnessEntries/user-a_2026-07-23'), { stressLevel: 1 }));
  await assertFails(deleteDoc(doc(dbFor('user-b'), 'wellnessEntries/user-a_2026-07-23')));
  await assertFails(setDoc(doc(dbFor('user-a'), 'wellnessEntries/user-b_2026-07-23'), validEntry));
  await assertFails(setDoc(doc(dbFor('user-a'), 'wellnessEntries/user-a_2026-07-24'), {
    ...validEntry,
    dateKey: '2026-07-24',
    stressLevel: 6
  }));
});

test('owner-scoped history queries return only the current user records', async () => {
  const timestamp = Timestamp.now();
  await seed(async (db) => {
    await setDoc(doc(db, 'weightEntries/user-a_2026-07-23'), {
      ownerId: 'user-a', dateKey: '2026-07-23', weightKg: 70, measuredAt: timestamp, updatedAt: timestamp
    });
    await setDoc(doc(db, 'weightEntries/user-b_2026-07-23'), {
      ownerId: 'user-b', dateKey: '2026-07-23', weightKg: 80, measuredAt: timestamp, updatedAt: timestamp
    });
  });
  const ownQuery = query(collection(dbFor('user-a'), 'weightEntries'), where('ownerId', '==', 'user-a'));
  const ownSnapshot = await assertSucceeds(getDocs(ownQuery));
  assert.equal(ownSnapshot.size, 1);
  await assertFails(getDocs(collection(dbFor('user-a'), 'weightEntries')));
  await assertFails(getDocs(query(collection(dbFor('user-a'), 'weightEntries'), where('ownerId', '==', 'user-b'))));
});

test('all unknown collections are denied by default', async () => {
  await assertFails(setDoc(doc(dbFor('user-a'), 'admin/secret'), { enabled: true }));
  await assertFails(getDoc(doc(dbFor('user-a'), 'admin/secret')));
});

test('test environment is configured', () => {
  assert.ok(environment);
});
