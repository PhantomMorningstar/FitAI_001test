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

test('unauthenticated clients cannot read or create profiles', async () => {
  await assertFails(getDoc(doc(guestDb(), 'profiles/user-a')));
  await assertFails(setDoc(doc(guestDb(), 'profiles/user-a'), { ownerId: 'user-a' }));
});

test('users can create and read only their own profile', async () => {
  const userA = dbFor('user-a');
  await assertSucceeds(setDoc(doc(userA, 'profiles/user-a'), { ownerId: 'user-a', weight: 70 }));
  await assertSucceeds(getDoc(doc(userA, 'profiles/user-a')));
  await assertFails(getDoc(doc(dbFor('user-b'), 'profiles/user-a')));
  await assertFails(setDoc(doc(userA, 'profiles/user-b'), { ownerId: 'user-a' }));
});

test('profile ownerId cannot be changed or spoofed', async () => {
  await seed((db) => setDoc(doc(db, 'profiles/user-a'), { ownerId: 'user-a', weight: 70 }));
  await assertFails(updateDoc(doc(dbFor('user-a'), 'profiles/user-a'), { ownerId: 'user-b' }));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'profiles/user-a'), { weight: 71 }));
});

test('profile documents created before ownerId can be migrated only by their matching UID', async () => {
  await seed((db) => setDoc(doc(db, 'profiles/user-a'), { weight: 70 }));
  await assertSucceeds(updateDoc(doc(dbFor('user-a'), 'profiles/user-a'), { ownerId: 'user-a' }));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'profiles/user-a'), { ownerId: 'user-b' }));
});

test('food diary creation requires ownerId to match authenticated UID', async () => {
  const timestamp = Timestamp.now();
  await assertSucceeds(addDoc(collection(dbFor('user-a'), 'foodDiaries'), { ownerId: 'user-a', calories: 400, timestamp }));
  await assertFails(addDoc(collection(dbFor('user-a'), 'foodDiaries'), { ownerId: 'user-b', calories: 400, timestamp }));
  await assertFails(addDoc(collection(guestDb(), 'foodDiaries'), { ownerId: 'user-a', calories: 400, timestamp }));
  await assertFails(addDoc(collection(dbFor('user-a'), 'foodDiaries'), { ownerId: 'user-a', calories: 400 }));
});

test('food diary documents are private to their owner', async () => {
  await seed((db) => setDoc(doc(db, 'foodDiaries/meal-1'), { ownerId: 'user-a', calories: 400 }));
  await assertSucceeds(getDoc(doc(dbFor('user-a'), 'foodDiaries/meal-1')));
  await assertSucceeds(updateDoc(doc(dbFor('user-a'), 'foodDiaries/meal-1'), { calories: 420 }));
  await assertFails(getDoc(doc(dbFor('user-b'), 'foodDiaries/meal-1')));
  await assertFails(deleteDoc(doc(dbFor('user-b'), 'foodDiaries/meal-1')));
});

test('food diary list queries must be restricted to the signed-in owner', async () => {
  await seed(async (db) => {
    await setDoc(doc(db, 'foodDiaries/meal-a'), { ownerId: 'user-a', calories: 400, timestamp: Timestamp.now() });
    await setDoc(doc(db, 'foodDiaries/meal-b'), { ownerId: 'user-b', calories: 500, timestamp: Timestamp.now() });
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
  await seed((db) => setDoc(doc(db, 'foodDiaries/legacy-1'), { userId: 'user-a', calories: 300 }));
  await assertSucceeds(updateDoc(doc(dbFor('user-a'), 'foodDiaries/legacy-1'), {
    ownerId: 'user-a',
    userId: deleteField()
  }));
  await assertFails(updateDoc(doc(dbFor('user-b'), 'foodDiaries/legacy-1'), { ownerId: 'user-b' }));
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
