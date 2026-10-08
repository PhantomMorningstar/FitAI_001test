(function exposeAccountDataUtils(root) {
    function serializeValue(value) {
        if (value instanceof Date) return value.toISOString();
        if (Array.isArray(value)) return value.map(serializeValue);
        if (value && typeof value.toDate === 'function') {
            return value.toDate().toISOString();
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
            );
        }
        return value;
    }

    function buildAccountExport({ uid, email, exportedAt, data }) {
        return {
            format: 'fitai-account-export',
            version: 1,
            exportedAt: new Date(exportedAt).toISOString(),
            account: { uid, email },
            data: Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, serializeValue(value)])
            )
        };
    }

    function clearLocalAccountData(storage, userId) {
        [
            `fitai_onboarding_completed_user_${userId}`,
            `fitai_onboarding_draft_user_${userId}`,
            `fitai_reminders_sent_${userId}`
        ].forEach((key) => storage.removeItem(key));
    }

    function serializeDocuments(snapshots) {
        const documents = new Map();
        snapshots.forEach((snapshot) => {
            snapshot.forEach((document) => {
                documents.set(document.id, {
                    ...serializeValue(document.data()),
                    documentId: document.id
                });
            });
        });
        return [...documents.values()];
    }

    async function loadAccountData(db, user) {
        const [profileSnapshot, ownedDiarySnapshot, legacyDiarySnapshot, weightSnapshot,
            activitySnapshot, wellnessSnapshot, diaryStatusSnapshot] = await Promise.all([
            db.collection('profiles').doc(user.uid).get(),
            db.collection('foodDiaries').where('ownerId', '==', user.uid).get(),
            db.collection('foodDiaries').where('userId', '==', user.uid).get(),
            db.collection('weightEntries').where('ownerId', '==', user.uid).get(),
            db.collection('activityEntries').where('ownerId', '==', user.uid).get(),
            db.collection('wellnessEntries').where('ownerId', '==', user.uid).get(),
            db.collection('diaryDayStatuses').where('ownerId', '==', user.uid).get()
        ]);

        return {
            profile: profileSnapshot.exists
                ? {
                    ...serializeValue(profileSnapshot.data()),
                    documentId: profileSnapshot.id
                }
                : null,
            foodDiaries: serializeDocuments([ownedDiarySnapshot, legacyDiarySnapshot]),
            weightEntries: serializeDocuments([weightSnapshot]),
            activityEntries: serializeDocuments([activitySnapshot]),
            wellnessEntries: serializeDocuments([wellnessSnapshot]),
            diaryDayStatuses: serializeDocuments([diaryStatusSnapshot])
        };
    }

    async function deleteAccountData(db, userId) {
        const queryPlans = [
            ['foodDiaries', 'ownerId'],
            ['foodDiaries', 'userId'],
            ['weightEntries', 'ownerId'],
            ['activityEntries', 'ownerId'],
            ['wellnessEntries', 'ownerId'],
            ['diaryDayStatuses', 'ownerId']
        ];
        const documents = new Map();
        for (const [collectionName, ownerField] of queryPlans) {
            const snapshot = await db.collection(collectionName)
                .where(ownerField, '==', userId)
                .get();
            snapshot.docs.forEach((document) => {
                documents.set(document.ref.path, document.ref);
            });
        }

        const references = [...documents.values()];
        for (let index = 0; index < references.length; index += 450) {
            const batch = db.batch();
            references.slice(index, index + 450).forEach((reference) => batch.delete(reference));
            await batch.commit();
        }

        const profileReference = db.collection('profiles').doc(userId);
        const profileSnapshot = await profileReference.get();
        if (profileSnapshot.exists) await profileReference.delete();
    }

    const utils = {
        buildAccountExport,
        clearLocalAccountData,
        deleteAccountData,
        loadAccountData,
        serializeValue
    };
    if (typeof module !== 'undefined' && module.exports) module.exports = utils;
    if (root) root.FitAIAccountDataUtils = utils;
})(typeof window !== 'undefined' ? window : globalThis);
