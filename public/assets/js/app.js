// ==========================================
// 🔥 FIREBASE PROJECT CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCZW8xPv4znydLYpRkqwhhv5RBtsW-gVug",
    authDomain: "fitai-test1-2c5b8.firebaseapp.com",
    projectId: "fitai-test1-2c5b8",
    storageBucket: "fitai-test1-2c5b8.firebasestorage.app",
    messagingSenderId: "453755043705",
    appId: "1:453755043705:web:66848b26b375e38f4cb9a8",
    measurementId: "G-X1DRJG10YS"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
auth.useDeviceLanguage();

async function ensureAuthenticatedUser() {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
        const error = new Error('Hãy đăng nhập để lưu và đồng bộ dữ liệu này.');
        error.code = 'auth/sign-in-required';
        throw error;
    }
    return user;
}

async function firebaseAuthenticatedFetch(url, options = {}) {
    const user = await ensureAuthenticatedUser();
    const token = await user.getIdToken();
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...options, headers });
}

async function createOrUpgradeAccount(email, password) {
    const credential = firebase.auth.EmailAuthProvider.credential(email, password);
    const currentUser = auth.currentUser;
    if (currentUser?.isAnonymous) {
        const result = await currentUser.linkWithCredential(credential);
        return result.user;
    }
    const result = await auth.createUserWithEmailAndPassword(email, password);
    return result.user;
}

async function signOutToPrivateGuest() {
    await auth.signOut();
}

function getAuthErrorMessage(error) {
    const messages = {
        'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy chọn Đăng nhập hoặc Quên mật khẩu.',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
        'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
        'auth/operation-not-allowed': 'Đăng nhập bằng email chưa được bật trong Firebase.',
        'auth/too-many-requests': 'Bạn thử quá nhiều lần. Hãy chờ một lúc rồi thử lại.',
        'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hóa.',
        'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
        'auth/network-request-failed': 'Không thể kết nối Firebase. Hãy kiểm tra Internet.',
        'auth/admin-restricted-operation': 'Phương thức đăng nhập này đang bị tắt trong Firebase.',
        'auth/sign-in-required': 'Hãy đăng nhập để lưu và đồng bộ dữ liệu này.'
    };
    return messages[error?.code] || 'Không thể hoàn tất thao tác tài khoản. Vui lòng thử lại.';
}

function showAuthFeedback(outputId, message, isError = false) {
    const output = document.getElementById(outputId);
    if (!output) return;
    output.hidden = false;
    output.textContent = message;
    output.classList.toggle('is-error', isError);
}

let goalCalories = 0;
let consumedCalories = 0;
let consumedProtein = 0;
let consumedCarbs = 0;
let consumedFat = 0;
let consumedFiber = 0;
let macroTargets = null;
let isRefreshingProfileCalculations = false;
let selectedDiaryDateKey = FitAIDateUtils.toDateKey();
let globalProfileData = {};
let latestFoodAnalysis = null;
let latestWeightEntries = [];
let latestActivityEntries = [];
let latestWellnessEntries = [];
let isCheckingReminders = false;
let activeAuthScope = null;
let currentDiaryItemCount = 0;

const LOCAL_STATE_KEYS = Object.freeze({
    onboardingCompleted: 'fitai_onboarding_completed',
    onboardingDraft: 'fitai_onboarding_draft'
});

function getAuthScope(user = auth.currentUser) {
    return user && !user.isAnonymous ? `user_${user.uid}` : 'guest';
}

function scopedLocalStorageKey(baseKey, user = auth.currentUser) {
    return `${baseKey}_${getAuthScope(user)}`;
}

function resetRuntimeUserState() {
    goalCalories = 0;
    consumedCalories = 0;
    consumedProtein = 0;
    consumedCarbs = 0;
    consumedFat = 0;
    consumedFiber = 0;
    macroTargets = null;
    globalProfileData = {};
    latestFoodAnalysis = null;
    latestWeightEntries = [];
    latestActivityEntries = [];
    latestWellnessEntries = [];
    currentDiaryItemCount = 0;

    updateCalorieUI();
    updateDiarySummary();
    renderMealSuggestions({
        available: false,
        reason: 'Đăng nhập hoặc hoàn thành bảng câu hỏi để xem gợi ý món ăn.'
    });

    const emptyTextById = {
        'dash-current-w': '--',
        'dash-bmi': '--',
        'dash-bmi-category': '',
        'dash-bmr': '--',
        'dash-tdee': '--',
        'dash-goal-cal': '--',
        'rep-age': '--',
        'rep-bmi': '--',
        'rep-bmi-category': '',
        'rep-bmr': '--',
        'rep-tdee': '--',
        'rep-maintenance-cal': '--',
        'rep-cal': '--',
        'rep-adjustment-cal': '--',
        'rep-weekly-change': '--',
        'rep-duration': '--',
        'roadmap-goal': '--',
        'roadmap-current': '--',
        'roadmap-target': '--',
        'roadmap-progress': '--',
        'roadmap-weeks': '--'
    };
    Object.entries(emptyTextById).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const diaryList = document.getElementById('diary-list');
    if (diaryList) {
        diaryList.innerHTML = '<li class="food-item" style="color:var(--text-muted)">Đăng nhập để xem nhật ký.</li>';
    }
    renderDiaryCompletionState(false, false);
    const roadmap = document.getElementById('personalized-roadmap');
    if (roadmap) roadmap.replaceChildren();

    if (typeof FitAIWeightUtils !== 'undefined') renderWeightHistory([]);
    if (typeof FitAIActivityUtils !== 'undefined') renderActivityHistory([]);
    if (typeof FitAIWellnessUtils !== 'undefined') renderWellnessHistory([]);
}

function getCurrentLanguage() {
    return window.FitAII18n?.normalizeLanguage(
        localStorage.getItem(window.FitAII18n.STORAGE_KEY)
    ) || 'vi';
}

function translateUI(value) {
    return window.FitAII18n?.translateText(value, getCurrentLanguage()) || value;
}

function updateNotificationPermissionUI() {
    const status = document.getElementById('notification-permission-status');
    const button = document.getElementById('enable-browser-notifications');
    const testButton = document.getElementById('test-browser-notification');
    const secureStatus = document.getElementById('notification-secure-status');
    const workerStatus = document.getElementById('notification-worker-status');
    if (!status) return;
    const secure = window.isSecureContext;
    if (secureStatus) {
        secureStatus.textContent = secure ? 'Kết nối an toàn: đạt' : 'Cần HTTPS hoặc localhost';
        secureStatus.classList.toggle('is-ready', secure);
        secureStatus.classList.toggle('is-error', !secure);
    }
    if (workerStatus) {
        const supported = 'serviceWorker' in navigator;
        workerStatus.textContent = supported ? 'PWA: đang kiểm tra' : 'PWA không được hỗ trợ';
        workerStatus.classList.toggle('is-error', !supported);
        if (supported) {
            navigator.serviceWorker.ready.then(() => {
                workerStatus.textContent = 'PWA: sẵn sàng';
                workerStatus.classList.add('is-ready');
                workerStatus.classList.remove('is-error');
            }).catch(() => {
                workerStatus.textContent = 'PWA chưa sẵn sàng';
                workerStatus.classList.add('is-error');
            });
        }
    }
    if (!('Notification' in window)) {
        status.textContent = 'Trình duyệt không hỗ trợ thông báo hệ thống. Nhắc nhở trong FitAI vẫn hoạt động khi ứng dụng đang mở.';
        if (button) button.disabled = true;
        if (testButton) testButton.disabled = true;
        return;
    }
    const labels = {
        default: 'Chưa yêu cầu quyền',
        granted: 'Đã bật thông báo trình duyệt',
        denied: 'Thông báo đang bị chặn trong cài đặt trình duyệt'
    };
    status.textContent = labels[Notification.permission] || Notification.permission;
    if (button) {
        button.disabled = Notification.permission === 'granted' || !secure;
        button.textContent = Notification.permission === 'granted'
            ? 'Đã bật thông báo trình duyệt'
            : 'Bật thông báo trình duyệt';
    }
    if (testButton) testButton.disabled = Notification.permission !== 'granted' || !secure;
}

async function showFitAINotification(title, options = {}) {
    if (!window.isSecureContext) throw new Error('INSECURE_CONTEXT');
    if (!('Notification' in window)) throw new Error('NOTIFICATION_UNSUPPORTED');
    if (Notification.permission !== 'granted') throw new Error('NOTIFICATION_PERMISSION_REQUIRED');
    const notificationOptions = {
        icon: '/assets/icons/fitai-icon.svg',
        badge: '/assets/icons/fitai-icon.svg',
        ...options
    };
    if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, notificationOptions);
        return 'service-worker';
    }
    new Notification(title, notificationOptions);
    return 'window';
}

function populateReminderSettings(settings) {
    if (!window.FitAIReminderUtils) return;
    const normalized = FitAIReminderUtils.normalizeSettings(settings);
    const enabled = document.getElementById('reminders-enabled');
    if (enabled) enabled.checked = normalized.enabled;
    FitAIReminderUtils.TYPES.forEach((type) => {
        const itemEnabled = document.getElementById(`reminder-${type}-enabled`);
        const itemTime = document.getElementById(`reminder-${type}-time`);
        if (itemEnabled) itemEnabled.checked = normalized.items[type].enabled;
        if (itemTime) itemTime.value = normalized.items[type].time;
    });
    updateNotificationPermissionUI();
}

function readReminderSettingsForm() {
    const items = {};
    FitAIReminderUtils.TYPES.forEach((type) => {
        items[type] = {
            enabled: Boolean(document.getElementById(`reminder-${type}-enabled`)?.checked),
            time: document.getElementById(`reminder-${type}-time`)?.value
        };
    });
    return FitAIReminderUtils.normalizeSettings({
        enabled: Boolean(document.getElementById('reminders-enabled')?.checked),
        items
    });
}

function getReminderSentState(userId) {
    try {
        return JSON.parse(localStorage.getItem(`fitai_reminders_sent_${userId}`) || '{}');
    } catch {
        return {};
    }
}

function showReminderToast(reminders) {
    document.querySelector('.fitai-reminder-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = 'fitai-reminder-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = '<strong>Nhắc nhở FitAI</strong>';
    const body = document.createElement('span');
    body.textContent = reminders.map((reminder) => reminder.body).join(' ');
    toast.appendChild(body);
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 12000);
}

async function getTodayReminderCompletion(user, dateKey) {
    const { start, end } = FitAIDateUtils.getLocalDayRange(dateKey);
    const mealPromise = db.collection('foodDiaries')
        .where('ownerId', '==', user.uid)
        .where('timestamp', '>=', start)
        .where('timestamp', '<', end)
        .limit(1)
        .get()
        .catch(async () => {
            const snapshot = await db.collection('foodDiaries').where('ownerId', '==', user.uid).get();
            return { empty: !snapshot.docs.some((doc) => FitAIDateUtils.belongsToLocalDay(doc.data().timestamp, dateKey)) };
        });
    const [meal, weight, activity, wellness] = await Promise.all([
        mealPromise,
        db.collection('weightEntries').doc(`${user.uid}_${dateKey}`).get(),
        db.collection('activityEntries').doc(`${user.uid}_${dateKey}`).get(),
        db.collection('wellnessEntries').doc(`${user.uid}_${dateKey}`).get()
    ]);
    return {
        meal: !meal.empty,
        weight: weight.exists,
        activity: activity.exists,
        wellness: wellness.exists
    };
}

async function checkDueReminders() {
    const user = auth.currentUser;
    if (!user || !window.FitAIReminderUtils || isCheckingReminders) return;
    const settings = FitAIReminderUtils.normalizeSettings(globalProfileData.reminders);
    if (!settings.enabled) return;
    isCheckingReminders = true;
    try {
        const now = new Date();
        const dateKey = FitAIDateUtils.toDateKey(now);
        const completion = await getTodayReminderCompletion(user, dateKey);
        const sentState = getReminderSentState(user.uid);
        const due = FitAIReminderUtils.getDueReminders(settings, completion, sentState, now);
        if (!due.length) return;
        showReminderToast(due);
        if ('Notification' in window && Notification.permission === 'granted') {
            await Promise.all(due.map((reminder) => (
                showFitAINotification(reminder.title, {
                    body: reminder.body,
                    tag: `fitai-${reminder.type}-${reminder.dateKey}`,
                    data: { url: reminder.type === 'meal' ? '/diary' : '/profile' }
                })
            )));
        }
        due.forEach((reminder) => { sentState[reminder.type] = reminder.dateKey; });
        localStorage.setItem(`fitai_reminders_sent_${user.uid}`, JSON.stringify(sentState));
    } catch (error) {
        console.error('Unable to check reminders:', error);
    } finally {
        isCheckingReminders = false;
    }
}

async function updateDailyFocus() {
    const list = document.getElementById('daily-focus-list');
    const progress = document.getElementById('daily-focus-progress');
    const message = document.getElementById('daily-focus-message');
    if (!list || !window.FitAIDailyFocusUtils) return;
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
        if (progress) progress.textContent = 'Chế độ khách';
        if (message) message.textContent = 'Đăng nhập để FitAI theo dõi những việc bạn đã hoàn thành hôm nay.';
        list.innerHTML = '<a class="daily-focus-task" href="/profile"><span class="daily-task-icon"><i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i></span><span><strong>Đăng nhập để bắt đầu</strong><small>Dữ liệu hằng ngày sẽ được lưu riêng cho tài khoản của bạn.</small></span><span class="daily-task-action">Đăng nhập</span></a>';
        return;
    }
    try {
        const completion = await getTodayReminderCompletion(user, FitAIDateUtils.toDateKey());
        const tasks = FitAIDailyFocusUtils.buildDailyFocus(completion, 3);
        const completedCount = Object.values(completion).filter(Boolean).length;
        if (progress) progress.textContent = `${completedCount}/4 đã hoàn thành`;
        if (message) message.textContent = completedCount === 4 ? 'Bạn đã ghi đủ hôm nay. Hãy tiếp tục ổn định, không cần làm thêm.' : 'Chỉ tập trung vào tối đa ba việc dưới đây.';
        list.replaceChildren(...tasks.map((task) => {
            const link = document.createElement('a');
            link.className = `daily-focus-task${task.completed ? ' is-complete' : ''}`;
            link.href = task.href;
            link.innerHTML = `<span class="daily-task-icon"><i class="fa-solid ${task.completed ? 'fa-check' : task.icon}" aria-hidden="true"></i></span><span><strong>${task.title}</strong><small>${task.completed ? 'Đã hoàn thành hôm nay.' : task.description}</small></span><span class="daily-task-action">${task.completed ? 'Đã xong' : task.action}</span>`;
            return link;
        }));
    } catch (error) {
        console.error('Unable to load daily focus:', error);
        if (progress) progress.textContent = 'Chưa thể tải';
        if (message) {
            const code = error && error.code ? ` (${error.code})` : '';
            message.textContent = `Không thể kiểm tra dữ liệu hôm nay${code}.`;
        }
        list.replaceChildren();
    }
}

function updateEnergyMetricsUI(metrics) {
    if (!metrics) return;
    const categoryLabel = String(metrics.bmiCategory || '').replaceAll('-', ' ');
    const values = {
        'rep-age': metrics.age,
        'rep-bmi': metrics.bmi,
        'rep-bmi-category': categoryLabel ? `(${categoryLabel})` : '',
        'rep-bmr': metrics.bmr,
        'rep-tdee': metrics.tdee,
        'dash-bmi': metrics.bmi,
        'dash-bmi-category': categoryLabel ? `(${categoryLabel})` : '',
        'dash-bmr': metrics.bmr,
        'dash-tdee': metrics.tdee
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && value !== null && value !== undefined) element.textContent = value;
    });
}

function updateWeightPlanUI(plan) {
    if (!plan) return;
    const adjustment = plan.adjustmentCalories > 0 ? `+${plan.adjustmentCalories}` : String(plan.adjustmentCalories);
    const duration = plan.estimatedWeeks === null ? 'Kế hoạch duy trì' : `Khoảng ${plan.estimatedWeeks} tuần`;
    const values = {
        'rep-maintenance-cal': plan.maintenanceCalories,
        'rep-cal': plan.targetCalories,
        'rep-adjustment-cal': adjustment,
        'rep-weekly-change': plan.estimatedWeeklyChangeKg,
        'rep-duration': duration,
        'dash-goal-cal': plan.targetCalories,
        'dash-remaining-cal': plan.targetCalories
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    goalCalories = plan.targetCalories;
}

function updateMacroTargetsUI(macros) {
    if (!macros) return;
    macroTargets = macros;
    updateCalorieUI();
}

function renderMealSuggestions(suggestions) {
    const list = document.getElementById('meal-suggestions-list');
    const target = document.getElementById('meal-suggestions-target');
    const guidance = document.getElementById('meal-suggestions-guidance');
    const allocation = document.getElementById('meal-suggestions-allocation');
    const allergyWarning = document.getElementById('meal-allergy-warning');
    const disclaimer = document.getElementById('meal-suggestions-disclaimer');
    if (!list || !target || !guidance || !disclaimer) return;

    list.replaceChildren();
    if (!suggestions?.available) {
        target.textContent = 'Chưa có gợi ý';
        guidance.textContent = suggestions?.reason
            || 'Hoàn thành bảng câu hỏi và kiểm tra an toàn để xem gợi ý món ăn.';
        if (allocation) allocation.hidden = true;
        if (allergyWarning) allergyWarning.hidden = true;
        disclaimer.hidden = true;
        return;
    }

    target.textContent = `${suggestions.basedOn.targetCalories} kcal/ngày · ${suggestions.basedOn.protein} g protein`;
    guidance.textContent = suggestions.guidance;
    if (allocation) allocation.hidden = false;
    if (allergyWarning) allergyWarning.hidden = false;
    suggestions.meals.forEach((meal) => {
        const card = document.createElement('article');
        card.className = 'meal-suggestion-item';
        const heading = document.createElement('h3');
        heading.textContent = meal.label;
        const targetLine = document.createElement('p');
        targetLine.className = 'meal-suggestion-numbers';
        targetLine.textContent = `Ngân sách bữa: ${meal.sharePercent}% · khoảng ${meal.calorieTarget} kcal · ${meal.proteinTarget} g protein`;
        const options = document.createElement('ul');
        meal.options.forEach((option) => {
            const item = document.createElement('li');
            item.textContent = option;
            options.appendChild(item);
        });
        const verificationNote = document.createElement('p');
        verificationNote.className = 'meal-suggestion-verification';
        verificationNote.textContent = 'Ý tưởng món — chưa tính khẩu phần và dinh dưỡng chính xác. Hãy cân và tra cứu USDA.';
        card.append(heading, targetLine, options, verificationNote);
        list.appendChild(card);
    });
    disclaimer.textContent = suggestions.disclaimer;
    disclaimer.hidden = false;
}

function revealMealSuggestions() {
    const section = document.getElementById('meal-suggestions-section');
    const status = document.getElementById('meal-suggestions-status');
    if (!section) return;
    if (status) {
        status.textContent = 'Đã cập nhật gợi ý món ăn theo thông tin mới của bạn.';
        status.hidden = false;
    }
    window.requestAnimationFrame(() => {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        section.focus({ preventScroll: true });
    });
}

function setOnboardingCompleted(value, user = auth.currentUser) {
    localStorage.setItem(
        scopedLocalStorageKey(LOCAL_STATE_KEYS.onboardingCompleted, user),
        value ? 'true' : 'false'
    );
}

function hasOnboardingCompleted(user = auth.currentUser) {
    return localStorage.getItem(
        scopedLocalStorageKey(LOCAL_STATE_KEYS.onboardingCompleted, user)
    ) === 'true';
}

function saveOnboardingDraft(data, user = auth.currentUser) {
    if (!data || typeof data !== 'object') return;
    localStorage.setItem(
        scopedLocalStorageKey(LOCAL_STATE_KEYS.onboardingDraft, user),
        JSON.stringify(data)
    );
}

function loadOnboardingDraft(user = auth.currentUser) {
    const raw = localStorage.getItem(
        scopedLocalStorageKey(LOCAL_STATE_KEYS.onboardingDraft, user)
    );
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (err) {
        return null;
    }
}

function populateOnboardingForm(data) {
    if (!data) return;
    const gender = document.querySelector(`input[name="gender"][value="${data.gender}"]`);
    if (gender) gender.checked = true;
    const dobEl = document.getElementById('quiz-dob');
    if (dobEl && data.dob) dobEl.value = data.dob;
    const heightEl = document.getElementById('quiz-height');
    if (heightEl && data.height) heightEl.value = data.height;
    const weightEl = document.getElementById('quiz-weight');
    if (weightEl && data.weight) weightEl.value = data.weight;
    const activityEl = document.getElementById('work-activity');
    if (activityEl && data.activity) activityEl.value = data.activity;
    const goalEl = document.getElementById('weight-goal');
    if (goalEl && data.goal) goalEl.value = data.goal;
    const targetWeightEl = document.getElementById('target-weight');
    if (targetWeightEl && data.targetWeight) targetWeightEl.value = data.targetWeight;

    document.querySelectorAll('.allergy-chip').forEach(chip => {
        const allergy = chip.dataset.allergy;
        if (Array.isArray(data.allergies) ? data.allergies.includes(allergy) : String(data.allergies).toLowerCase().includes(allergy)) {
            chip.classList.add('selected');
            chip.setAttribute('aria-pressed', 'true');
        } else {
            chip.classList.remove('selected');
            chip.setAttribute('aria-pressed', 'false');
        }
    });
}

function getOnboardingFormData() {
    const selectedGender = document.querySelector('input[name="gender"]:checked');
    const dobEl = document.getElementById('quiz-dob');
    const heightEl = document.getElementById('quiz-height');
    const weightEl = document.getElementById('quiz-weight');
    const goalEl = document.getElementById('weight-goal');
    const activityEl = document.getElementById('work-activity');
    const targetWeightEl = document.getElementById('target-weight');
    const allergies = Array.from(document.querySelectorAll('.allergy-chip.selected')).map(chip => chip.dataset.allergy || chip.textContent.trim());

    return {
        gender: selectedGender ? selectedGender.value : 'Male',
        dob: dobEl ? dobEl.value : '',
        height: heightEl ? heightEl.value : '',
        weight: weightEl ? weightEl.value : '',
        goal: goalEl ? goalEl.value : 'maintain',
        activity: activityEl ? activityEl.value : 'sedentary',
        targetWeight: targetWeightEl ? targetWeightEl.value : '',
        allergies,
        healthContext: {
            pregnant: document.getElementById('health-pregnant')?.checked === true,
            breastfeeding: document.getElementById('health-breastfeeding')?.checked === true,
            eatingDisorderHistory: document.getElementById('health-eating-disorder')?.checked === true,
            clinicianSupervised: document.getElementById('health-clinician-supervised')?.checked === true
        }
    };
}

function restoreOnboardingDraft() {
    const draft = loadOnboardingDraft();
    if (draft) {
        populateOnboardingForm(draft);
    }
}

function updateOnboardingDraft() {
    const data = getOnboardingFormData();
    saveOnboardingDraft(data);
}

function showOnboardingScreen() {
    restoreOnboardingDraft();
    const onboardingScreen = document.getElementById('onboarding-screen');
    const mainAppScreen = document.getElementById('main-app-screen');
    if (onboardingScreen) onboardingScreen.style.display = 'grid';
    if (mainAppScreen) mainAppScreen.style.display = 'none';
    const skipLink = document.getElementById('skip-to-content');
    if (skipLink) skipLink.setAttribute('href', '#onboarding-screen');
}

function showMainAppScreen() {
    const onboardingScreen = document.getElementById('onboarding-screen');
    const mainAppScreen = document.getElementById('main-app-screen');
    if (onboardingScreen) onboardingScreen.style.display = 'none';
    if (mainAppScreen) mainAppScreen.style.display = 'flex';
    const skipLink = document.getElementById('skip-to-content');
    if (skipLink) skipLink.setAttribute('href', '#main-content');
}

function clearAuthForm() {
    const emailEls = [document.getElementById('auth-email'), document.getElementById('overview-auth-email')];
    const passEls = [document.getElementById('auth-password'), document.getElementById('overview-auth-password')];
    emailEls.forEach((emailEl) => { if (emailEl) emailEl.value = ''; });
    passEls.forEach((passEl) => { if (passEl) passEl.value = ''; });
}

// ==========================================
// 🗄️ DATABASE ENGINE CHO HỒ SƠ RIÊNG (PROFILES COLLECTION)
// ==========================================
async function saveProfileToFirebase(profileData) {
    try {
        const user = await ensureAuthenticatedUser();
        await db.collection("profiles").doc(user.uid).set({
            ...profileData,
            ownerId: user.uid,
            accountType: user.isAnonymous ? 'anonymous' : 'registered',
            updatedAt: new Date()
        }, { merge: true });
    } catch (error) {
        console.error('Unable to save profile:', error);
        throw error;
    }
}

async function saveFoodToFirebase(foodData) {
    try {
        const user = await ensureAuthenticatedUser();
        const timestamp = new Date();
        await db.collection("foodDiaries").add({ ownerId: user.uid, ...foodData, timestamp });
        await invalidateDiaryDayCompletion(FitAIDateUtils.toDateKey(timestamp), user);
        await loadDiaryFromFirebase();
    } catch (error) {
        console.error('Unable to save food:', error);
        throw error;
    }
}

function diaryDayStatusRef(user, dateKey) {
    return db.collection('diaryDayStatuses').doc(`${user.uid}_${dateKey}`);
}

function isValidDiaryDateKey(dateKey) {
    try {
        FitAIDateUtils.parseDateKey(dateKey);
        return true;
    } catch {
        return false;
    }
}

async function invalidateDiaryDayCompletion(dateKey, user = auth.currentUser) {
    if (!user || user.isAnonymous || !isValidDiaryDateKey(dateKey)) return;
    const statusRef = diaryDayStatusRef(user, dateKey);
    const snapshot = await statusRef.get();
    if (snapshot.exists) await statusRef.delete();
}

function renderDiaryCompletionState(completed, hasEntries) {
    const button = document.getElementById('complete-diary-day-btn');
    const status = document.getElementById('diary-completion-status');
    const verificationLabel = document.getElementById('diary-verification-label');
    if (button) {
        button.disabled = completed || !hasEntries || !auth.currentUser || auth.currentUser.isAnonymous;
        button.textContent = completed ? 'Đã xác nhận ngày này' : 'Xác nhận đã ghi đủ trong ngày';
    }
    if (verificationLabel) {
        verificationLabel.textContent = completed
            ? 'Người dùng tự xác nhận'
            : 'Chưa tự xác nhận';
        verificationLabel.classList.toggle('is-confirmed', completed);
    }
    if (status) {
        status.textContent = completed
            ? 'Người dùng đã tự xác nhận ngày này được ghi đầy đủ; dữ liệu được dùng để đánh giá kế hoạch.'
            : hasEntries
                ? 'Nếu bạn đã ghi đủ mọi món và đồ uống có năng lượng, hãy xác nhận ngày này.'
                : 'Thêm ít nhất một món trước khi xác nhận.';
    }
}

async function completeDiaryDay(dateKey = selectedDiaryDateKey) {
    const user = await ensureAuthenticatedUser();
    if (!isValidDiaryDateKey(dateKey) || dateKey > FitAIDateUtils.toDateKey()) {
        throw new Error('Ngày nhật ký không hợp lệ.');
    }
    if (currentDiaryItemCount < 1) {
        throw new Error('Hãy thêm ít nhất một món trước khi hoàn tất ngày.');
    }
    const now = new Date();
    await diaryDayStatusRef(user, dateKey).set({
        ownerId: user.uid,
        dateKey,
        completed: true,
        completedAt: now,
        updatedAt: now
    });
    renderDiaryCompletionState(true, true);
}

async function updateFoodDiaryEntry(entryId, changes) {
    const user = await ensureAuthenticatedUser();
    const entryRef = db.collection("foodDiaries").doc(entryId);
    const snapshot = await entryRef.get();
    if (!snapshot.exists || snapshot.data().ownerId !== user.uid) {
        throw new Error('Mục nhật ký này không tồn tại hoặc không thuộc tài khoản của bạn.');
    }
    const dateKey = FitAIDateUtils.toDateKey(FitAIDateUtils.timestampToDate(snapshot.data().timestamp));
    await entryRef.update({ ...changes, ownerId: user.uid, updatedAt: new Date() });
    await invalidateDiaryDayCompletion(dateKey, user);
    await loadDiaryFromFirebase(selectedDiaryDateKey);
}

async function deleteFoodDiaryEntry(entryId) {
    const user = await ensureAuthenticatedUser();
    const entryRef = db.collection("foodDiaries").doc(entryId);
    const snapshot = await entryRef.get();
    if (!snapshot.exists || snapshot.data().ownerId !== user.uid) {
        throw new Error('Mục nhật ký này không tồn tại hoặc không thuộc tài khoản của bạn.');
    }
    const dateKey = FitAIDateUtils.toDateKey(FitAIDateUtils.timestampToDate(snapshot.data().timestamp));
    await entryRef.delete();
    await invalidateDiaryDayCompletion(dateKey, user);
    await loadDiaryFromFirebase(selectedDiaryDateKey);
}

function createFoodDiaryItemElement(item) {
    const li = document.createElement('li');
    const loggedAt = FitAIDateUtils.timestampToDate(item.timestamp);
    const timeLabel = loggedAt ? loggedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const servingGrams = Number(item.servingGrams || 100);
    li.className = 'food-item diary-food-item';

    const summary = document.createElement('div');
    summary.className = 'diary-food-summary';
    const identity = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.foodName || 'Món ăn';
    const meta = document.createElement('small');
    meta.textContent = `${servingGrams} g${timeLabel ? ` • ${timeLabel}` : ''}`;
    identity.append(name, meta);
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${item.calories || 0} kcal • P: ${item.protein || 0}g • C: ${item.carbs || 0}g • F: ${item.fat || 0}g • Xơ: ${item.fiber || 0}g`;

    const actions = document.createElement('div');
    actions.className = 'diary-food-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn btn-secondary diary-entry-edit';
    editButton.innerHTML = '<i class="fa-solid fa-pen"></i><span>Sửa</span>';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn diary-entry-delete';
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i><span>Xóa</span>';
    actions.append(editButton, deleteButton);
    summary.append(identity, badge, actions);

    const editForm = document.createElement('form');
    editForm.className = 'diary-entry-edit-form';
    editForm.hidden = true;
    editForm.innerHTML = `
        <label>Tên món ăn<input name="foodName" type="text" minlength="2" maxlength="120" required></label>
        <label>Khẩu phần (gram)<input name="servingGrams" type="number" min="1" max="2000" step="0.1" required></label>
        <div class="diary-edit-actions">
            <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
            <button type="button" class="btn btn-secondary diary-edit-cancel">Hủy</button>
        </div>
        <p class="field-error diary-entry-error" aria-live="polite"></p>`;
    editForm.elements.foodName.value = item.foodName || '';
    editForm.elements.servingGrams.value = servingGrams;

    editButton.addEventListener('click', () => {
        editForm.hidden = false;
        summary.hidden = true;
        editForm.elements.foodName.focus();
    });
    editForm.querySelector('.diary-edit-cancel').addEventListener('click', () => {
        editForm.hidden = true;
        summary.hidden = false;
    });
    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const errorOutput = editForm.querySelector('.diary-entry-error');
        const foodName = editForm.elements.foodName.value.trim();
        const submitButton = editForm.querySelector('[type="submit"]');
        try {
            if (foodName.length < 2) throw new Error('Tên món phải có ít nhất 2 ký tự.');
            const nutrients = FitAIFoodEntryUtils.scaleFoodEntry(item, editForm.elements.servingGrams.value);
            submitButton.disabled = true;
            errorOutput.textContent = '';
            await updateFoodDiaryEntry(item.id, { foodName, ...nutrients });
        } catch (error) {
            errorOutput.textContent = error.message;
            submitButton.disabled = false;
        }
    });
    deleteButton.addEventListener('click', async () => {
        if (!window.confirm(`Xóa “${item.foodName || 'món này'}” khỏi nhật ký của ngày này?`)) return;
        deleteButton.disabled = true;
        try {
            await deleteFoodDiaryEntry(item.id);
        } catch (error) {
            const status = document.getElementById('diary-action-status');
            if (status) status.textContent = error.message;
            deleteButton.disabled = false;
        }
    });

    li.append(summary, editForm);
    return li;
}

async function loadDiaryFromFirebase(dateKey = selectedDiaryDateKey) {
    const listEl = document.getElementById('diary-list');
    try {
        selectedDiaryDateKey = dateKey;
        const { start, end } = FitAIDateUtils.getLocalDayRange(dateKey);
        const user = await ensureAuthenticatedUser();
        const completionSnapshotPromise = diaryDayStatusRef(user, dateKey).get();
        let ownedSnapshot;
        try {
            ownedSnapshot = await db.collection("foodDiaries")
                .where("ownerId", "==", user.uid)
                .where("timestamp", ">=", start)
                .where("timestamp", "<", end)
                .orderBy("timestamp", "desc")
                .get();
        } catch (queryError) {
            if (queryError.code !== 'failed-precondition') throw queryError;
            console.warn('Firestore diary index is not ready; using the owner-only fallback query.', queryError);
            ownedSnapshot = await db.collection("foodDiaries")
                .where("ownerId", "==", user.uid)
                .get();
        }

        let legacySnapshot = null;
        if (!user.isAnonymous) {
            try {
                legacySnapshot = await db.collection("foodDiaries").where("userId", "==", user.uid).get();
            } catch (legacyError) {
                console.warn('Legacy diary migration query was skipped.', legacyError);
            }
        }
        const documents = new Map(ownedSnapshot.docs
            .filter((doc) => FitAIDateUtils.belongsToLocalDay(doc.data().timestamp, dateKey))
            .map((doc) => [doc.id, doc]));
        if (legacySnapshot) {
            legacySnapshot.docs
                .filter((doc) => FitAIDateUtils.belongsToLocalDay(doc.data().timestamp, dateKey))
                .forEach((doc) => documents.set(doc.id, doc));
            if (!legacySnapshot.empty) {
                const batch = db.batch();
                legacySnapshot.docs.forEach((doc) => batch.update(doc.ref, {
                    ownerId: user.uid,
                    userId: firebase.firestore.FieldValue.delete()
                }));
                await batch.commit();
            }
        }
        const items = Array.from(documents.values())
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (FitAIDateUtils.timestampToDate(b.timestamp)?.getTime() || 0)
                - (FitAIDateUtils.timestampToDate(a.timestamp)?.getTime() || 0));
        currentDiaryItemCount = items.length;
        consumedCalories = items.reduce((sum, item) => sum + Number(item.calories || 0), 0);
        consumedProtein = items.reduce((sum, item) => sum + Number(item.protein || 0), 0);
        consumedCarbs = items.reduce((sum, item) => sum + Number(item.carbs || 0), 0);
        consumedFat = items.reduce((sum, item) => sum + Number(item.fat || 0), 0);
        consumedFiber = items.reduce((sum, item) => sum + Number(item.fiber || 0), 0);
        updateCalorieUI();
        updateDiarySummary();
        const completionSnapshot = await completionSnapshotPromise;
        renderDiaryCompletionState(
            completionSnapshot.exists && completionSnapshot.data().completed === true,
            items.length > 0
        );

        if (!listEl) return;
        listEl.innerHTML = "";
        const actionStatus = document.getElementById('diary-action-status');
        if (actionStatus) actionStatus.textContent = '';
        if (!items.length) {
            listEl.innerHTML = `<li class="food-item" style="color:var(--text-muted)">Không có món ăn nào được ghi cho ngày này.</li>`;
            return;
        }
        items.forEach((item) => listEl.appendChild(createFoodDiaryItemElement(item)));
    } catch (error) {
        console.error('Unable to load diary:', error);
        if (listEl) {
            const code = error.code ? ` (${error.code})` : '';
            listEl.textContent = `Không thể tải nhật ký của ngày này${code}. Vui lòng thử lại.`;
        }
    }
}

function updateDiarySummary() {
    const values = {
        'diary-total-calories': Math.round(consumedCalories),
        'diary-total-protein': `${consumedProtein.toFixed(1)} g`,
        'diary-total-carbs': `${consumedCarbs.toFixed(1)} g`,
        'diary-total-fat': `${consumedFat.toFixed(1)} g`,
        'diary-total-fiber': `${consumedFiber.toFixed(1)} g`
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function drawWeightChart(entries) {
    const canvas = document.getElementById('weight-history-chart');
    if (!canvas || typeof FitAIWeightUtils === 'undefined') return;
    const points = FitAIWeightUtils.normalizeEntries(entries);
    const rollingPoints = FitAIWeightUtils.calculateRollingAverages(points);
    const width = Math.max(canvas.clientWidth || 700, 320);
    const height = 320;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    if (!points.length) {
        context.fillStyle = '#718078';
        context.font = '14px sans-serif';
        context.textAlign = 'center';
        context.fillText(translateUI('Thêm ít nhất một số đo để bắt đầu biểu đồ.'), width / 2, height / 2);
        return;
    }

    const targetWeight = Number(globalProfileData.targetWeight);
    const hasTarget = Number.isFinite(targetWeight);
    const padding = { top: 30, right: 28, bottom: 42, left: 52 };
    const weights = points.map((point) => point.weightKg);
    if (hasTarget) weights.push(targetWeight);
    const minimum = Math.floor(Math.min(...weights) - 1);
    const maximum = Math.ceil(Math.max(...weights) + 1);
    const range = Math.max(maximum - minimum, 1);
    const xFor = (index) => padding.left + (points.length === 1 ? (width - padding.left - padding.right) / 2
        : index / (points.length - 1) * (width - padding.left - padding.right));
    const yFor = (weight) => padding.top + (maximum - weight) / range * (height - padding.top - padding.bottom);

    context.strokeStyle = '#dfe8e4';
    context.lineWidth = 1;
    for (let line = 0; line <= 4; line += 1) {
        const y = padding.top + line / 4 * (height - padding.top - padding.bottom);
        const label = maximum - line / 4 * range;
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(width - padding.right, y);
        context.stroke();
        context.fillStyle = '#718078';
        context.font = '11px sans-serif';
        context.textAlign = 'right';
        context.fillText(`${label.toFixed(1)} kg`, padding.left - 8, y + 4);
    }

    context.strokeStyle = '#9ba9a2';
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.beginPath();
    points.forEach((point, index) => {
        const x = xFor(index);
        const y = yFor(point.weightKg);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    });
    context.stroke();

    points.forEach((point, index) => {
        const x = xFor(index);
        const y = yFor(point.weightKg);
        context.fillStyle = '#9ba9a2';
        context.beginPath();
        context.arc(x, y, 4, 0, Math.PI * 2);
        context.fill();
    });

    context.strokeStyle = '#16a36a';
    context.lineWidth = 4;
    context.beginPath();
    let hasAveragePoint = false;
    rollingPoints.forEach((point, index) => {
        if (point.averageKg === null) return;
        const x = xFor(index);
        const y = yFor(point.averageKg);
        if (!hasAveragePoint) {
            context.moveTo(x, y);
            hasAveragePoint = true;
        } else {
            context.lineTo(x, y);
        }
    });
    if (hasAveragePoint) context.stroke();

    if (hasTarget) {
        const targetY = yFor(targetWeight);
        context.save();
        context.strokeStyle = '#e58a2f';
        context.lineWidth = 2;
        context.setLineDash([7, 5]);
        context.beginPath();
        context.moveTo(padding.left, targetY);
        context.lineTo(width - padding.right, targetY);
        context.stroke();
        context.restore();
        context.fillStyle = '#a05e12';
        context.font = '11px sans-serif';
        context.textAlign = 'right';
        context.fillText(`${translateUI('Mục tiêu')} ${targetWeight.toFixed(1)} kg`, width - padding.right, Math.max(targetY - 6, 26));
    }

    context.font = '11px sans-serif';
    context.textAlign = 'left';
    context.fillStyle = '#9ba9a2';
    context.fillText(`● ${translateUI('Cân nặng hằng ngày')}`, padding.left, 14);
    context.fillStyle = '#16a36a';
    context.fillText(`━ ${translateUI('Trung bình 7 ngày')}`, padding.left + 95, 14);
    if (hasTarget) {
        context.fillStyle = '#e58a2f';
        context.fillText(`┄ ${translateUI('Mục tiêu')}`, padding.left + 210, 14);
    }

    context.fillStyle = '#718078';
    context.font = '11px sans-serif';
    context.textAlign = 'left';
    context.fillText(points[0].dateKey, padding.left, height - 12);
    if (points.length > 1) {
        context.textAlign = 'right';
        context.fillText(points[points.length - 1].dateKey, width - padding.right, height - 12);
    }
}

function renderWeightHistory(entries) {
    if (typeof FitAIWeightUtils === 'undefined') return;
    latestWeightEntries = FitAIWeightUtils.normalizeEntries(entries);
    const trend = FitAIWeightUtils.calculateWeightTrend(latestWeightEntries);
    const rolling = FitAIWeightUtils.calculateRollingAverages(latestWeightEntries);
    const latestAverage = rolling.length ? rolling[rolling.length - 1] : null;
    const progress = FitAIWeightUtils.calculateGoalProgress(
        latestWeightEntries,
        globalProfileData.targetWeight,
        globalProfileData.goal
    );
    const values = {
        'weight-latest': trend.latest ? `${trend.latest.weightKg.toFixed(1)} kg` : '--',
        'weight-seven-day-average': latestAverage && latestAverage.averageKg !== null
            ? `${latestAverage.averageKg.toFixed(2)} kg`
            : '--',
        'weight-total-change': trend.changeKg === null ? '--' : `${trend.changeKg > 0 ? '+' : ''}${trend.changeKg.toFixed(1)} kg`,
        'weight-weekly-rate': trend.weeklyRateKg === null ? '--' : `${trend.weeklyRateKg > 0 ? '+' : ''}${trend.weeklyRateKg.toFixed(2)} kg`,
        'weight-entry-count': trend.count,
        'weight-target': progress.targetWeightKg === null ? '--' : `${progress.targetWeightKg.toFixed(1)} kg`,
        'weight-remaining': progress.remainingKg === null ? '--' : `${progress.remainingKg.toFixed(1)} kg`,
        'weight-progress-percent': progress.progressPercent === null ? '--' : `${progress.progressPercent}%`
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const progressBar = document.getElementById('weight-goal-progress-bar');
    if (progressBar) progressBar.style.width = `${progress.progressPercent || 0}%`;
    const progressStatus = document.getElementById('weight-progress-status');
    if (progressStatus) {
        const changeTowardGoalKg = Number.isFinite(progress.changeTowardGoalKg)
            ? progress.changeTowardGoalKg
            : null;
        const messages = {
            'no-data': 'Thêm số đo để tính tiến độ mục tiêu.',
            'toward-goal': changeTowardGoalKg === null
                ? 'Thêm số đo để tính tiến độ mục tiêu.'
                : `Bạn đã tiến ${changeTowardGoalKg.toFixed(1)} kg về phía mục tiêu.`,
            'away-from-goal': changeTowardGoalKg === null
                ? 'Chưa đủ dữ liệu để đánh giá hướng thay đổi cân nặng.'
                : `Xu hướng mới nhất đang đi lệch mục tiêu ${Math.abs(changeTowardGoalKg).toFixed(1)} kg.`,
            unchanged: 'Cân nặng đã ghi không thay đổi so với số đo ban đầu.',
            reached: 'Cân nặng đã ghi đã đạt mục tiêu đã chọn.',
            maintaining: 'Cân nặng mới nhất đang nằm trong vùng duy trì.',
            'outside-range': 'Cân nặng mới nhất nằm ngoài vùng duy trì ±2 kg.'
        };
        progressStatus.textContent = messages[progress.status] || messages['no-data'];
        progressStatus.classList.toggle('is-positive', ['toward-goal', 'reached', 'maintaining'].includes(progress.status));
        progressStatus.classList.toggle('is-warning', ['away-from-goal', 'outside-range'].includes(progress.status));
    }

    const list = document.getElementById('weight-history-list');
    if (list) {
        list.innerHTML = '';
        [...latestWeightEntries].reverse().forEach((entry, reverseIndex, reversed) => {
            const previous = reversed[reverseIndex + 1];
            const change = previous ? Number((entry.weightKg - previous.weightKg).toFixed(1)) : null;
            const average = rolling.find((point) => point.dateKey === entry.dateKey);
            const row = document.createElement('tr');
            row.innerHTML = `<td>${entry.dateKey}</td><td>${entry.weightKg.toFixed(1)} kg</td><td>${average?.averageKg === null || !average ? '—' : `${average.averageKg.toFixed(2)} kg (${average.sampleCount})`}</td><td>${change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`}</td>`;
            list.appendChild(row);
        });
    }
    drawWeightChart(latestWeightEntries);
}

async function loadWeightHistory() {
    if (!document.getElementById('weight-history-section')) return;
    try {
        const user = await ensureAuthenticatedUser();
        let snapshot;
        try {
            snapshot = await db.collection('weightEntries')
                .where('ownerId', '==', user.uid)
                .orderBy('dateKey', 'desc')
                .get();
        } catch (error) {
            if (error.code !== 'failed-precondition') throw error;
            snapshot = await db.collection('weightEntries').where('ownerId', '==', user.uid).get();
        }
        renderWeightHistory(snapshot.docs.map((document) => document.data()));
    } catch (error) {
        console.error('Unable to load weight history:', error);
        const status = document.getElementById('weight-entry-status');
        if (status) status.textContent = `Không thể tải lịch sử cân nặng${error.code ? ` (${error.code})` : ''}.`;
    }
}

function renderActivityHistory(entries) {
    if (typeof FitAIActivityUtils === 'undefined') return;
    latestActivityEntries = FitAIActivityUtils.normalizeEntries(entries);
    const summary = FitAIActivityUtils.summarizeActivity(latestActivityEntries, globalProfileData.metrics?.bmr);
    const labels = { sedentary: 'Ít vận động', lightly: 'Vận động nhẹ', moderately: 'Vận động vừa' };
    const confidenceLabels = { insufficient: 'Chưa đủ', medium: 'Tin cậy vừa', high: 'Tin cậy cao' };
    const values = {
        'activity-average-steps': summary.averageSteps === null ? '--' : summary.averageSteps.toLocaleString(),
        'activity-total-minutes': `${summary.activeMinutes} phút`,
        'activity-observed-level': summary.observedActivity ? labels[summary.observedActivity] : '--',
        'activity-adjusted-tdee': summary.adjustedTdee === null ? '--' : `${summary.adjustedTdee} kcal`,
        'activity-confidence': `${confidenceLabels[summary.confidence]} (${summary.sampleDays}/7 ngày)`
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    const progress = document.getElementById('activity-guideline-progress');
    if (progress) progress.style.width = `${summary.guidelinePercent}%`;
    const guidance = document.getElementById('activity-guidance');
    if (guidance) {
        if (summary.confidence === 'insufficient') {
            guidance.textContent = 'Hãy ghi ít nhất 4 trong 7 ngày trước khi so sánh vận động với hồ sơ.';
        } else if (summary.observedActivity !== globalProfileData.activity) {
            guidance.textContent = `Mức vận động quan sát là ${labels[summary.observedActivity]}, còn hồ sơ là ${labels[globalProfileData.activity] || globalProfileData.activity}. Hãy xem lại trước khi đổi mục tiêu năng lượng.`;
        } else {
            guidance.textContent = `Mức vận động quan sát phù hợp với hồ sơ. Tiến độ vận động tuần: ${summary.activeMinutes}/150 phút.`;
        }
    }

    const list = document.getElementById('activity-history-list');
    if (list) {
        list.replaceChildren(...[...latestActivityEntries].reverse().slice(0, 14).map((entry) => {
            const row = document.createElement('tr');
            const date = document.createElement('td');
            date.textContent = entry.dateKey;
            const steps = document.createElement('td');
            steps.textContent = entry.steps.toLocaleString();
            const minutes = document.createElement('td');
            minutes.textContent = `${entry.activeMinutes} phút`;
            row.append(date, steps, minutes);
            return row;
        }));
    }
}

async function loadActivityHistory() {
    if (!document.getElementById('activity-history-section')) return;
    try {
        const user = await ensureAuthenticatedUser();
        let snapshot;
        try {
            snapshot = await db.collection('activityEntries')
                .where('ownerId', '==', user.uid)
                .orderBy('dateKey', 'desc')
                .get();
        } catch (error) {
            if (error.code !== 'failed-precondition') throw error;
            snapshot = await db.collection('activityEntries').where('ownerId', '==', user.uid).get();
        }
        renderActivityHistory(snapshot.docs.map((document) => document.data()));
    } catch (error) {
        console.error('Unable to load activity history:', error);
        const status = document.getElementById('activity-entry-status');
        if (status) status.textContent = `Không thể tải lịch sử vận động${error.code ? ` (${error.code})` : ''}.`;
    }
}

function renderWellnessHistory(entries) {
    if (typeof FitAIWellnessUtils === 'undefined') return;
    latestWellnessEntries = FitAIWellnessUtils.normalizeEntries(entries);
    const summary = FitAIWellnessUtils.summarizeWellness(latestWellnessEntries);
    const values = {
        'wellness-average-sleep': summary.averageSleepHours === null ? '--' : `${summary.averageSleepHours} giờ`,
        'wellness-average-stress': summary.averageStress === null ? '--' : `${summary.averageStress}/5`,
        'wellness-sleep-goal-days': `${summary.sleepGoalDays}/${summary.sampleDays}`,
        'wellness-high-stress-days': summary.highStressDays,
        'wellness-sample-days': `${summary.sampleDays}/7`
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    const insight = document.getElementById('wellness-insight');
    if (insight) {
        const messages = {
            insufficient: 'Hãy ghi ít nhất 4 ngày trước khi sử dụng xu hướng ngủ hoặc stress.',
            balanced: 'Dữ liệu ngủ và stress hiện chưa cho thấy cảnh báo phục hồi.',
            'short-sleep': 'Thời gian ngủ trung bình dưới 7 giờ. Hãy ưu tiên lịch ngủ ổn định trước khi siết kế hoạch dinh dưỡng.',
            'high-stress': 'Stress trung bình đang cao. Hãy xem lại trở ngại và thói quen phục hồi trước khi diễn giải thay đổi cân nặng ngắn hạn.',
            'sleep-and-stress': 'Thiếu ngủ và stress cao đang xuất hiện cùng nhau. Hãy tập trung phục hồi và tìm hỗ trợ chuyên môn nếu tình trạng kéo dài.'
        };
        insight.textContent = messages[summary.insight];
        insight.classList.toggle('is-warning', !['insufficient', 'balanced'].includes(summary.insight));
    }
    const stressLabels = ['Rất thấp', 'Thấp', 'Vừa', 'Cao', 'Rất cao'];
    const list = document.getElementById('wellness-history-list');
    if (list) {
        list.replaceChildren(...[...latestWellnessEntries].reverse().slice(0, 14).map((entry) => {
            const row = document.createElement('tr');
            const date = document.createElement('td');
            date.textContent = entry.dateKey;
            const sleep = document.createElement('td');
            sleep.textContent = `${entry.sleepHours.toFixed(1)} giờ`;
            const stress = document.createElement('td');
            stress.textContent = `${entry.stressLevel}/5 — ${stressLabels[entry.stressLevel - 1]}`;
            row.append(date, sleep, stress);
            return row;
        }));
    }
}

async function loadWellnessHistory() {
    if (!document.getElementById('wellness-history-section')) return;
    try {
        const user = await ensureAuthenticatedUser();
        let snapshot;
        try {
            snapshot = await db.collection('wellnessEntries')
                .where('ownerId', '==', user.uid)
                .orderBy('dateKey', 'desc')
                .get();
        } catch (error) {
            if (error.code !== 'failed-precondition') throw error;
            snapshot = await db.collection('wellnessEntries').where('ownerId', '==', user.uid).get();
        }
        renderWellnessHistory(snapshot.docs.map((document) => document.data()));
    } catch (error) {
        console.error('Unable to load wellness history:', error);
        const status = document.getElementById('wellness-entry-status');
        if (status) status.textContent = `Không thể tải lịch sử giấc ngủ và stress${error.code ? ` (${error.code})` : ''}.`;
    }
}

function renderPersonalizedRoadmap(roadmap) {
    const container = document.getElementById('personalized-roadmap');
    if (!container || !roadmap) return;
    const values = {
        'roadmap-goal': roadmap.goalLabel,
        'roadmap-current': roadmap.currentWeightKg === null ? '--' : `${roadmap.currentWeightKg.toFixed(1)} kg`,
        'roadmap-target': roadmap.targetWeightKg === null ? '--' : `${roadmap.targetWeightKg.toFixed(1)} kg`,
        'roadmap-progress': roadmap.progressPercent === null ? '--' : `${roadmap.progressPercent}%`,
        'roadmap-weeks': roadmap.estimatedWeeksRemaining === null ? 'Đánh giá lại mỗi 2 tuần' : `Khoảng ${roadmap.estimatedWeeksRemaining} tuần`
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const status = document.getElementById('roadmap-status');
    if (status) {
        status.textContent = roadmap.ready
            ? `Dựa trên ${roadmap.weightMeasurements} số đo cân nặng và ${roadmap.diaryDays} ngày ghi món ăn.`
            : 'Hoàn thiện hồ sơ trước khi FitAI xây dựng lộ trình cá nhân.';
    }

    const icons = { completed: 'fa-check', active: 'fa-circle-dot', upcoming: 'fa-lock' };
    container.replaceChildren(...roadmap.phases.map((phase, index) => {
        const item = document.createElement('article');
        item.className = `timeline-item ${phase.status}`;
        const icon = document.createElement('div');
        icon.className = 'timeline-icon';
        icon.innerHTML = `<i class="fa-solid ${icons[phase.status]}"></i>`;
        const info = document.createElement('div');
        info.className = 'timeline-info';
        const title = document.createElement('h4');
        title.textContent = `Giai đoạn ${index + 1}: ${phase.title}`;
        const description = document.createElement('p');
        description.textContent = phase.description;
        const meta = document.createElement('div');
        meta.className = 'roadmap-phase-meta';
        const statusLabels = { completed: 'Hoàn thành', active: 'Đang thực hiện', upcoming: 'Sắp tới' };
        meta.textContent = `${phase.duration} • ${statusLabels[phase.status]}`;
        const action = document.createElement('div');
        action.className = 'roadmap-phase-action';
        action.textContent = `Hành động tiếp theo: ${phase.action}`;
        info.append(title, description, meta, action);
        item.append(icon, info);
        return item;
    }));
}

function renderPlanCalibration(calibration) {
    const message = document.getElementById('calibration-message');
    if (!message || !calibration) return;
    const formatRate = (value) => Number.isFinite(value)
        ? `${value > 0 ? '+' : ''}${value.toFixed(2)} kg/tuần`
        : '--';
    const values = {
        'calibration-planned-rate': formatRate(calibration.plannedWeeklyRateKg),
        'calibration-observed-rate': formatRate(calibration.observedWeeklyRateKg),
        'calibration-average-intake': calibration.averageLoggedCalories === null ? '--' : `${calibration.averageLoggedCalories} kcal/ngày`,
        'calibration-observed-tdee': calibration.observedTdee === null ? '--' : `${calibration.observedTdee} kcal/ngày`
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const confidence = document.getElementById('calibration-confidence');
    const recommendation = document.getElementById('calibration-recommendation');
    const req = calibration.requirements;
    if (!calibration.ready) {
        if (confidence) confidence.textContent = calibration.status === 'health-review' ? 'Cần chuyên gia' : 'Chưa đủ tin cậy';
        if (calibration.status === 'health-review') {
            message.textContent = 'FitAI không tự hiệu chỉnh kế hoạch khi hồ sơ có giới hạn sức khỏe cần chuyên gia theo dõi.';
        } else if (calibration.status === 'safety-blocked') {
            message.textContent = 'Mức calorie đề xuất không vượt qua kiểm tra an toàn.';
        } else if (calibration.status === 'data-quality') {
            message.textContent = 'Dữ liệu hiện tạo ra TDEE quan sát không hợp lý. Hãy kiểm tra lại khẩu phần và số đo trước khi điều chỉnh.';
        } else {
            message.textContent = `Đã có ${req.weightEntries}/${req.requiredWeightEntries} số đo, ${req.diaryDays}/${req.requiredDiaryDays} ngày ghi món ăn và ${req.spanDays}/${req.requiredSpanDays} ngày theo dõi.`;
        }
        if (recommendation) {
            recommendation.textContent = calibration.status === 'safety-blocked'
                ? 'Không áp dụng thay đổi. Hãy giữ mục tiêu hiện tại hoặc trao đổi với chuyên gia dinh dưỡng.'
                : 'Giữ nguyên mục tiêu hiện tại và tiếp tục thu thập dữ liệu.';
        }
        return;
    }

    const statusMessages = {
        'on-track': 'Xu hướng thực tế đang phù hợp với kế hoạch.',
        'too-fast': 'Cân nặng đang thay đổi nhanh hơn kế hoạch.',
        'too-slow': 'Cân nặng đang thay đổi chậm hơn kế hoạch.',
        'wrong-direction': 'Xu hướng cân nặng đang đi ngược mục tiêu.',
        drifting: 'Cân nặng đang lệch khỏi vùng duy trì.'
    };
    message.textContent = statusMessages[calibration.status] || 'Đã hoàn thành đánh giá dữ liệu thực tế.';
    if (confidence) confidence.textContent = calibration.confidence === 'high' ? 'Tin cậy cao' : 'Tin cậy vừa';
    if (recommendation) {
        const baseRecommendation = calibration.adjustmentCalories === 0
            ? `Giữ mục tiêu ${calibration.currentTargetCalories} kcal/ngày và đánh giá lại sau 7 ngày.`
            : `Có thể thử ${calibration.suggestedTargetCalories} kcal/ngày (${calibration.adjustmentCalories > 0 ? '+' : ''}${calibration.adjustmentCalories} kcal) trong 7–14 ngày, sau đó đánh giá lại. Đề xuất này chưa được tự động áp dụng.`;
        const warning = calibration.safety?.warnings?.[0]?.message;
        recommendation.textContent = warning
            ? `${baseRecommendation} Lưu ý an toàn: ${warning}`
            : baseRecommendation;
    }
}

async function applyCalibrationSafety(calibration) {
    if (!calibration?.ready || calibration.adjustmentCalories === 0) return calibration;
    const response = await fetch('/api/profile/calibration-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            profile: globalProfileData,
            proposedTargetCalories: calibration.suggestedTargetCalories
        })
    });
    const payload = await response.json();
    if (payload.safety?.allowed) {
        return { ...calibration, safety: payload.safety };
    }
    if (payload.safety) {
        return {
            ...calibration,
            ready: false,
            status: 'safety-blocked',
            proposedTargetCalories: calibration.suggestedTargetCalories,
            suggestedTargetCalories: null,
            safety: payload.safety
        };
    }
    throw new Error(payload.errors?.proposedTargetCalories || payload.error || 'Không thể kiểm tra an toàn cho đề xuất calorie.');
}

async function loadPersonalizedRoadmap() {
    if (!document.getElementById('personalized-roadmap')) return;
    const status = document.getElementById('roadmap-status');
    try {
        const user = await ensureAuthenticatedUser();
        const [weightSnapshot, diarySnapshot, completionSnapshot] = await Promise.all([
            db.collection('weightEntries').where('ownerId', '==', user.uid).get(),
            db.collection('foodDiaries').where('ownerId', '==', user.uid).get(),
            db.collection('diaryDayStatuses').where('ownerId', '==', user.uid).get()
        ]);
        const completedDateKeys = new Set(completionSnapshot.docs
            .map((document) => document.data())
            .filter((statusEntry) => statusEntry.completed === true)
            .map((statusEntry) => statusEntry.dateKey));
        const weights = weightSnapshot.docs.map((document) => document.data());
        const diaryEntries = diarySnapshot.docs.map((document) => {
            const data = document.data();
            const timestamp = FitAIDateUtils.timestampToDate(data.timestamp);
            return {
                dateKey: timestamp ? FitAIDateUtils.toDateKey(timestamp) : '',
                calories: Number(data.calories),
                completed: timestamp
                    ? completedDateKeys.has(FitAIDateUtils.toDateKey(timestamp))
                    : false
            };
        });
        const roadmap = FitAIRoadmapUtils.buildPersonalizedRoadmap(
            globalProfileData,
            weights,
            diaryEntries,
            FitAIWeightUtils
        );
        renderPersonalizedRoadmap(roadmap);
        if (window.FitAIPlanCalibrationUtils) {
            const calibration = FitAIPlanCalibrationUtils.buildPlanCalibration(
                globalProfileData,
                weights,
                diaryEntries,
                FitAIWeightUtils
            );
            renderPlanCalibration(await applyCalibrationSafety(calibration));
        }
    } catch (error) {
        console.error('Unable to build personalized roadmap:', error);
        if (status) status.textContent = `Không thể tải dữ liệu lộ trình${error.code ? ` (${error.code})` : ''}.`;
    }
}

// ==========================================
// 📊 INTERACTIVE PROGRESS UPDATE ENGINE
// ==========================================
function updateCalorieUI() {
    const hasCalculatedGoal = goalCalories > 0;
    let remaining = hasCalculatedGoal ? goalCalories - consumedCalories : 0;
    if (remaining < 0) remaining = 0;

    const dashRemaining = document.getElementById('dash-remaining-cal');
    const dashConsumed = document.getElementById('dash-consumed-cal');
    if (dashRemaining) dashRemaining.innerText = hasCalculatedGoal ? remaining : '--';
    if (dashConsumed) dashConsumed.innerText = consumedCalories;

    const circle = document.getElementById('calorie-progress-circle');
    const pct = hasCalculatedGoal ? Math.min(consumedCalories / goalCalories, 1) : 0;
    const offset = 440 - (pct * 440);
    if(circle) circle.style.strokeDashoffset = offset;

    const targets = macroTargets || {};
    const macroValues = {
        protein: { consumed: consumedProtein, target: Number(targets.protein) },
        carbs: { consumed: consumedCarbs, target: Number(targets.carbs) },
        fats: { consumed: consumedFat, target: Number(targets.fat) },
        fiber: { consumed: consumedFiber, target: Number(targets.fiber) }
    };

    const macroP = document.getElementById('macro-p-val');
    const macroC = document.getElementById('macro-c-val');
    const macroF = document.getElementById('macro-f-val');
    const macroFiber = document.getElementById('macro-fiber-val');
    const labels = { protein: macroP, carbs: macroC, fats: macroF, fiber: macroFiber };

    Object.entries(macroValues).forEach(([name, values]) => {
        const consumed = Number.isFinite(values.consumed) ? values.consumed.toFixed(0) : '0';
        const hasTarget = Number.isFinite(values.target) && values.target > 0;
        if (labels[name]) labels[name].innerText = `${consumed}/${hasTarget ? values.target : '--'}g`;
        const bar = document.querySelector(`.macro-progress-fill.${name}`);
        if (bar) {
            const percent = hasTarget ? Math.min((values.consumed / values.target) * 100, 100) : 0;
            bar.style.width = `${percent}%`;
        }
    });
}

function updateProfileUI(data) {
    if(!data) return;
    const profGender = document.getElementById('prof-gender');
    const profHeight = document.getElementById('prof-height');
    const profWeight = document.getElementById('prof-weight');
    const profGoal = document.getElementById('prof-goal');

    if (profGender) profGender.innerText = data.gender || '-';
    if (profHeight) profHeight.innerText = data.height || '-';
    if (profWeight) profWeight.innerText = data.weight || '-';
    const healthFields = {
        'health-pregnant': data.healthContext?.pregnant,
        'health-breastfeeding': data.healthContext?.breastfeeding,
        'health-eating-disorder': data.healthContext?.eatingDisorderHistory,
        'health-clinician-supervised': data.healthContext?.clinicianSupervised
    };
    Object.entries(healthFields).forEach(([id, checked]) => {
        const input = document.getElementById(id);
        if (input) input.checked = checked === true;
    });
    
    let goalText = "Duy trì cân nặng";
    if (data.goal === 'lose') goalText = "Giảm cân";
    if (data.goal === 'gain') goalText = "Tăng cân";
    if (profGoal) profGoal.innerText = goalText;
    updateEnergyMetricsUI(data.metrics);
    updateWeightPlanUI(data.plan);
    updateMacroTargetsUI(data.macros);
    renderMealSuggestions(data.mealSuggestions);
    populateReminderSettings(data.reminders);
    if (latestWeightEntries.length) renderWeightHistory(latestWeightEntries);
    if (latestActivityEntries.length) renderActivityHistory(latestActivityEntries);

    if ((!data.macros || !data.mealSuggestions) && data.dob && !isRefreshingProfileCalculations) {
        isRefreshingProfileCalculations = true;
        requestProfileValidation(data)
            .then(async (result) => {
                if (!result.valid || !result.macros) return;
                globalProfileData = {
                    ...globalProfileData,
                    ...result.data,
                    metrics: result.metrics,
                    plan: result.plan,
                    macros: result.macros,
                    mealSuggestions: result.mealSuggestions,
                    safety: result.safety
                };
                updateMacroTargetsUI(result.macros);
                renderMealSuggestions(result.mealSuggestions);
                saveOnboardingDraft(globalProfileData);
                if (auth.currentUser && !auth.currentUser.isAnonymous) {
                    await saveProfileToFirebase(globalProfileData);
                }
            })
            .catch(() => {})
            .finally(() => { isRefreshingProfileCalculations = false; });
    }
}

// ==========================================
// 🕹️ DOM OBJECT EVENT INITIALIZERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const getEl = id => document.getElementById(id);

    updateNotificationPermissionUI();
    const notificationButton = getEl('enable-browser-notifications');
    if (notificationButton) {
        notificationButton.addEventListener('click', async () => {
            if (!('Notification' in window)) return;
            const status = getEl('test-notification-status');
            try {
                const permission = await Notification.requestPermission();
                if (status) {
                    status.textContent = permission === 'granted'
                        ? 'Đã cấp quyền. Bạn có thể bấm “Gửi thông báo thử”.'
                        : 'Quyền thông báo chưa được cấp. Hãy kiểm tra cài đặt trang trong trình duyệt.';
                }
            } catch {
                if (status) status.textContent = 'Không thể yêu cầu quyền thông báo trên trình duyệt này.';
            } finally {
                updateNotificationPermissionUI();
            }
        });
    }
    const testNotificationButton = getEl('test-browser-notification');
    if (testNotificationButton) {
        testNotificationButton.addEventListener('click', async () => {
            const status = getEl('test-notification-status');
            testNotificationButton.disabled = true;
            if (status) status.textContent = 'Đang gửi thông báo thử…';
            try {
                await showFitAINotification('FitAI đã bật thông báo', {
                    body: 'Thông báo cục bộ đang hoạt động trên thiết bị này.',
                    tag: `fitai-test-${Date.now()}`,
                    data: { url: '/profile' }
                });
                if (status) status.textContent = 'Đã gửi. Hãy kiểm tra khu vực thông báo của thiết bị.';
            } catch (error) {
                const messages = {
                    INSECURE_CONTEXT: 'Thông báo cần HTTPS hoặc localhost.',
                    NOTIFICATION_UNSUPPORTED: 'Trình duyệt này không hỗ trợ thông báo.',
                    NOTIFICATION_PERMISSION_REQUIRED: 'Hãy bật quyền thông báo trước.'
                };
                if (status) status.textContent = messages[error.message] || 'Không thể gửi thông báo thử. Hãy kiểm tra quyền và PWA.';
            } finally {
                updateNotificationPermissionUI();
            }
        });
    }

    const reminderForm = getEl('reminder-settings-form');
    if (reminderForm) {
        reminderForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const status = getEl('reminder-settings-status');
            const saveButton = getEl('save-reminder-settings');
            if (saveButton) saveButton.disabled = true;
            if (status) status.textContent = 'Đang lưu cài đặt nhắc nhở...';
            try {
                const reminders = readReminderSettingsForm();
                globalProfileData = { ...globalProfileData, reminders };
                await saveProfileToFirebase({ reminders });
                if (status) {
                    status.textContent = reminders.enabled
                        ? 'Đã lưu nhắc nhở. FitAI sẽ bỏ qua thói quen đã hoàn thành hôm nay.'
                        : 'Đã tắt nhắc nhở.';
                }
                await checkDueReminders();
            } catch (error) {
                console.error('Unable to save reminders:', error);
                if (status) status.textContent = 'Không thể lưu cài đặt nhắc nhở. Vui lòng thử lại.';
            } finally {
                if (saveButton) saveButton.disabled = false;
            }
        });
    }

    document.querySelectorAll('.reset-password-btn').forEach((button) => {
        button.addEventListener('click', async () => {
            const emailInput = getEl(button.dataset.emailInput);
            const statusOutput = getEl(button.dataset.statusOutput);
            const email = emailInput?.value.trim() || '';
            if (!statusOutput) return;

            statusOutput.hidden = false;
            statusOutput.classList.remove('is-error');
            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                statusOutput.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.';
                statusOutput.classList.add('is-error');
                emailInput?.focus();
                return;
            }

            button.disabled = true;
            statusOutput.textContent = 'Đang gửi email đặt lại mật khẩu...';
            try {
                await auth.sendPasswordResetEmail(email);
                statusOutput.textContent = 'Nếu email này có tài khoản, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra hộp thư đến và thư rác.';
            } catch (error) {
                if (error.code === 'auth/too-many-requests') {
                    statusOutput.textContent = 'Bạn đã thử quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.';
                } else if (error.code === 'auth/invalid-email') {
                    statusOutput.textContent = 'Vui lòng nhập địa chỉ email hợp lệ.';
                } else {
                    statusOutput.textContent = 'Hiện chưa thể gửi email đặt lại mật khẩu. Vui lòng thử lại.';
                }
                statusOutput.classList.add('is-error');
                console.error('Password reset failed:', error);
            } finally {
                button.disabled = false;
            }
        });
    });

    initializeOnboardingFlow();

    function initializeOnboardingFlow() {

    // Allergy chip selection handling
    const allergyChips = document.querySelectorAll('.allergy-chip');
    allergyChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const selected = this.classList.toggle('selected');
            this.setAttribute('aria-pressed', String(selected));
        });
    });

    // Gender selection interaction
    const optionBoxes = document.querySelectorAll('.option-box');
    if(optionBoxes.length > 0) optionBoxes[0].classList.add('selected');
    optionBoxes.forEach(box => {
        box.addEventListener('click', function() {
            optionBoxes.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            const radio = this.querySelector('input[type="radio"]');
            if(radio) radio.checked = true;
        });
    });

    // Onboarding / overview toggle handling
    const onboardingScreen = getEl('onboarding-screen');
    const mainAppScreen = getEl('main-app-screen');
    const overviewAuthForm = getEl('overview-auth-form');
    const overviewLoginBtn = getEl('overview-login-btn');
    const overviewLogoutBtn = getEl('overview-logout-btn');
    const continueToAppBtn = getEl('continue-to-app-btn');
    const overviewSigninBtn = getEl('overview-signin-btn');
    const overviewSignupBtn = getEl('overview-signup-btn');
    const overviewEmail = getEl('overview-auth-email');
    const overviewPassword = getEl('overview-auth-password');

    // Food image recognition controls
    const foodUploadInput = getEl('food-upload');
    const uploadImageBtn = getEl('upload-image-btn');
    const recognizeFoodBtn = getEl('recognize-food-btn');
    const foodPreview = getEl('food-preview');
    const analysisResult = getEl('analysis-result');
    const analysisFoodName = getEl('analysis-food-name');
    const analysisCalories = getEl('analysis-calories');
    const analysisProtein = getEl('analysis-protein');
    const analysisCarbs = getEl('analysis-carbs');
    const analysisFat = getEl('analysis-fat');
    const analysisFiber = getEl('analysis-fiber');
    const analysisDataQuality = getEl('analysis-data-quality');
    const addFoodBtn = getEl('add-food-btn');
    const foodSearchQuery = getEl('food-search-query');
    const foodServingGrams = getEl('food-serving-grams');
    const foodSearchStatus = getEl('food-search-status');
    const foodResultSelect = getEl('food-result-select');
    const foodPortionSelect = getEl('food-portion-select');
    const foodPortionLabel = getEl('food-portion-label');
    const analysisSource = getEl('analysis-source');
    const analyzePhotoBtn = getEl('analyze-photo-btn');
    const visionStatus = getEl('vision-status');
    const visionFoodCandidates = getEl('vision-food-candidates');
    const visionCandidatesLabel = getEl('vision-candidates-label');
    const visionConfidence = getEl('vision-confidence');
    const confirmFoodCandidateBtn = getEl('confirm-food-candidate-btn');
    let foodSearchResults = [];
    let selectedFoodImageDataUrl = '';

    function resetFoodAnalysis() {
        latestFoodAnalysis = null;
        if (analysisFoodName) analysisFoodName.innerText = '...';
        if (analysisCalories) analysisCalories.innerText = '-- kcal';
        if (analysisProtein) analysisProtein.innerText = '-- g';
        if (analysisCarbs) analysisCarbs.innerText = '-- g';
        if (analysisFat) analysisFat.innerText = '-- g';
        if (analysisFiber) analysisFiber.innerText = '-- g';
        if (analysisDataQuality) {
            analysisDataQuality.hidden = true;
            analysisDataQuality.textContent = '';
        }
        if (addFoodBtn) addFoodBtn.disabled = true;
        if (recognizeFoodBtn) recognizeFoodBtn.disabled = false;
        if (analysisResult) analysisResult.style.display = 'none';
        if (foodPortionSelect) foodPortionSelect.style.display = 'none';
        if (foodPortionLabel) foodPortionLabel.style.display = 'none';
        if (visionFoodCandidates) visionFoodCandidates.style.display = 'none';
        if (visionCandidatesLabel) visionCandidatesLabel.style.display = 'none';
        if (visionConfidence) visionConfidence.hidden = true;
        if (confirmFoodCandidateBtn) confirmFoodCandidateBtn.style.display = 'none';
    }

    if (continueToAppBtn) {
        continueToAppBtn.addEventListener('click', () => {
            updateOnboardingDraft();
            setOnboardingCompleted(true);
            showMainAppScreen();
        });
    }

    if (overviewLoginBtn) {
        overviewLoginBtn.addEventListener('click', () => {
            if (overviewAuthForm) overviewAuthForm.style.display = overviewAuthForm.style.display === 'none' ? 'block' : 'none';
        });
    }

    function setOverviewAuthState(user) {
        if (overviewLogoutBtn) {
            overviewLogoutBtn.style.display = user ? 'inline-block' : 'none';
            if (user) overviewLogoutBtn.disabled = false;
        }
        if (overviewLoginBtn) overviewLoginBtn.style.display = user ? 'none' : 'inline-block';
        if (overviewAuthForm) overviewAuthForm.style.display = user ? 'none' : 'none';
        const accountStatus = document.getElementById('account-status');
        if (accountStatus) {
            accountStatus.innerHTML = '';
            const icon = document.createElement('i');
            icon.className = user ? 'fa-solid fa-circle-check' : 'fa-solid fa-user-shield';
            const verification = user && !user.emailVerified ? ' — email chưa xác minh' : '';
            accountStatus.append(icon, document.createTextNode(user
                ? ` Đã đăng nhập: ${user.email}${verification}`
                : ' Chế độ khách — dữ liệu cloud chưa được lưu'));
        }
    }

    function setProfileAuthState(user) {
        const isRegistered = Boolean(user && !user.isAnonymous);
        const authBox = document.getElementById('auth-container');
        const profileBox = document.getElementById('authenticated-profile-container');
        const settingsBtn = document.getElementById('settings-toggle-btn');
        const profilePage = document.getElementById('profile-page');
        const profileLogoutBtn = document.getElementById('btn-logout');
        const verificationStatus = document.getElementById('account-verification-status');
        const resendVerificationBtn = document.getElementById('resend-verification-btn');

        if (authBox) authBox.style.display = isRegistered ? 'none' : 'block';
        if (profileBox) profileBox.style.display = isRegistered ? 'flex' : 'none';
        if (profileLogoutBtn) profileLogoutBtn.disabled = !isRegistered;
        if (verificationStatus) {
            verificationStatus.textContent = isRegistered
                ? (user.emailVerified
                    ? `Email đã xác minh: ${user.email}`
                    : `Email chưa xác minh: ${user.email}`)
                : '';
        }
        if (resendVerificationBtn) {
            resendVerificationBtn.hidden = !isRegistered || user.emailVerified;
        }
        if (settingsBtn) {
            settingsBtn.style.display = isRegistered && profilePage ? 'block' : 'none';
        }
    }

    if (overviewSigninBtn) {
        overviewSigninBtn.addEventListener('click', async () => {
            if (!overviewEmail || !overviewPassword) return;
            const email = overviewEmail.value.trim();
            const pass = overviewPassword.value.trim();
            if (!validateAuthForm(email, pass, 'overview-reset-status')) return;
            overviewSigninBtn.disabled = true;
            try {
                const credential = await auth.signInWithEmailAndPassword(email, pass);
                setProfileAuthState(credential.user);
                setOverviewAuthState(credential.user);
                clearAuthForm();
                showAuthFeedback('overview-reset-status', 'Đăng nhập thành công.');
            } catch (error) {
                showAuthFeedback('overview-reset-status', getAuthErrorMessage(error), true);
            } finally {
                overviewSigninBtn.disabled = false;
            }
        });
    }

    if (overviewSignupBtn) {
        overviewSignupBtn.addEventListener('click', async () => {
            if (!overviewEmail || !overviewPassword) return;
            const email = overviewEmail.value.trim();
            const pass = overviewPassword.value.trim();
            if (!validateAuthForm(email, pass, 'overview-reset-status')) return;
            overviewSignupBtn.disabled = true;
            try {
                const user = await createOrUpgradeAccount(email, pass);
                let verificationSent = true;
                try {
                    await user.sendEmailVerification();
                } catch {
                    verificationSent = false;
                }
                clearAuthForm();
                showAuthFeedback('overview-reset-status', verificationSent
                    ? 'Đăng ký thành công. Hãy kiểm tra email xác minh.'
                    : 'Đăng ký thành công, nhưng chưa gửi được email xác minh. Bạn có thể gửi lại trong Hồ sơ.');
            } catch (error) {
                showAuthFeedback('overview-reset-status', getAuthErrorMessage(error), true);
            } finally {
                overviewSignupBtn.disabled = false;
            }
        });
    }

    if (overviewLogoutBtn) {
        overviewLogoutBtn.addEventListener('click', async () => {
            overviewLogoutBtn.disabled = true;
            try {
                await signOutToPrivateGuest();
                alert('Đã đăng xuất.');
            } catch (error) {
                overviewLogoutBtn.disabled = false;
                alert(getAuthErrorMessage(error));
            }
        });
    }

    const editQuestionsBtn = getEl('edit-questions-btn');
    if (editQuestionsBtn) {
        editQuestionsBtn.addEventListener('click', () => {
            setOnboardingCompleted(false);
            resetOnboardingFlow();
            showOnboardingScreen();
        });
    }

    if (uploadImageBtn && foodUploadInput) {
        uploadImageBtn.addEventListener('click', (event) => {
            event.preventDefault();
            foodUploadInput.value = '';
            foodUploadInput.click();
        });
    }

    if (foodUploadInput) {
        foodUploadInput.addEventListener('click', () => {
            foodUploadInput.value = '';
            selectedFoodImageDataUrl = '';
        });
    }

    function showFoodAnalysis(result) {
        latestFoodAnalysis = result;
        const formatNutrient = (value, unit) => value === null || value === undefined
            ? 'Không có dữ liệu'
            : `${value} ${unit}`;
        const nutrientLabels = {
            calories: 'năng lượng',
            protein: 'chất đạm',
            carbs: 'tinh bột',
            fat: 'chất béo',
            fiber: 'chất xơ'
        };
        const missingNutrients = Array.isArray(result.missingNutrients)
            ? result.missingNutrients
            : [];
        if (analysisFoodName) analysisFoodName.innerText = result.name;
        if (analysisCalories) analysisCalories.innerText = formatNutrient(result.calories, 'kcal');
        if (analysisProtein) analysisProtein.innerText = formatNutrient(result.protein, 'g');
        if (analysisCarbs) analysisCarbs.innerText = formatNutrient(result.carbs, 'g');
        if (analysisFat) analysisFat.innerText = formatNutrient(result.fat, 'g');
        if (analysisFiber) analysisFiber.innerText = formatNutrient(result.fiber, 'g');
        if (analysisSource) {
            analysisSource.textContent = result.fdcId
                ? `${result.grams} g • ${result.source} • FDC ${result.fdcId}`
                : `${result.grams} g • ${result.source}`;
        }
        if (analysisDataQuality) {
            analysisDataQuality.hidden = missingNutrients.length === 0;
            analysisDataQuality.textContent = missingNutrients.length
                ? `Không thể lưu bản ghi này vì USDA thiếu: ${missingNutrients.map((name) => nutrientLabels[name] || name).join(', ')}. Hãy chọn bản ghi khác có đủ dữ liệu.`
                : '';
        }
        if (addFoodBtn) addFoodBtn.disabled = missingNutrients.length > 0;
        if (analysisResult) analysisResult.style.display = 'flex';
    }

    if (foodUploadInput) {
        foodUploadInput.addEventListener('change', async () => {
            const file = foodUploadInput.files[0];
            if (!file) {
                resetFoodAnalysis();
                return;
            }
            resetFoodAnalysis();
            if (visionStatus) visionStatus.textContent = 'Đang tối ưu ảnh để phân tích...';
            if (analyzePhotoBtn) analyzePhotoBtn.disabled = true;
            try {
                selectedFoodImageDataUrl = await FitAIImageUtils.prepareImageFile(file);
                if (foodPreview) {
                    foodPreview.src = selectedFoodImageDataUrl;
                    foodPreview.style.display = 'block';
                }
                if (analyzePhotoBtn) analyzePhotoBtn.disabled = false;
                if (visionStatus) visionStatus.textContent = 'Ảnh đã sẵn sàng. Nhấn “Phân tích ảnh bằng AI” để nhận gợi ý.';
            } catch (error) {
                selectedFoodImageDataUrl = '';
                if (foodPreview) foodPreview.style.display = 'none';
                if (visionStatus) visionStatus.textContent = error.message;
            }
        });
    }

    async function loadSelectedFoodDetails(food, grams) {
        if (!food) return;
        if (foodSearchStatus) foodSearchStatus.textContent = 'Đang tải khẩu phần và dữ liệu dinh dưỡng USDA...';
        const response = await fetch(`/api/nutrition/foods/${encodeURIComponent(food.fdcId)}?grams=${encodeURIComponent(grams)}`);
        const payload = await readJsonResponse(response);
        if (!response.ok) throw new Error(payload.error || 'Không thể tải chi tiết thực phẩm USDA.');
        showFoodAnalysis(payload.food);

        if (foodPortionSelect && foodPortionLabel) {
            const portions = payload.portions || [];
            foodPortionSelect.replaceChildren();
            if (portions.length) {
                const customOption = document.createElement('option');
                customOption.value = String(grams);
                customOption.textContent = `Khẩu phần tự nhập — ${grams} g`;
                foodPortionSelect.appendChild(customOption);
                portions.forEach((portion) => {
                    const option = document.createElement('option');
                    option.value = String(portion.gramWeight);
                    option.textContent = `${portion.label} — ${portion.gramWeight} g`;
                    foodPortionSelect.appendChild(option);
                });
                foodPortionSelect.style.display = 'block';
                foodPortionLabel.style.display = 'block';
            } else {
                foodPortionSelect.style.display = 'none';
                foodPortionLabel.style.display = 'none';
            }
        }
        if (foodSearchStatus) foodSearchStatus.textContent = `Đã tải bản ghi ${food.dataType} từ USDA. Hãy chọn đúng thực phẩm và kiểm tra khẩu phần.`;
    }

    if (foodResultSelect) {
        foodResultSelect.addEventListener('change', async () => {
            const selected = foodSearchResults[Number(foodResultSelect.value)];
            if (!selected) return;
            try {
                await loadSelectedFoodDetails(selected, Number(foodServingGrams?.value || 100));
            } catch (error) {
                if (foodSearchStatus) foodSearchStatus.textContent = error.message;
            }
        });
    }

    if (foodPortionSelect) {
        foodPortionSelect.addEventListener('change', async () => {
            const selected = foodSearchResults[Number(foodResultSelect?.value || 0)];
            const grams = Number(foodPortionSelect.value);
            if (!selected || !grams) return;
            try {
                if (foodServingGrams) foodServingGrams.value = grams;
                const response = await fetch(`/api/nutrition/foods/${encodeURIComponent(selected.fdcId)}?grams=${encodeURIComponent(grams)}`);
                const payload = await readJsonResponse(response);
                if (!response.ok) throw new Error(payload.error || 'Không thể tính khẩu phần USDA này.');
                showFoodAnalysis(payload.food);
            } catch (error) {
                if (foodSearchStatus) foodSearchStatus.textContent = error.message;
            }
        });
    }

    async function readJsonResponse(response) {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Máy chủ trả về dữ liệu không hợp lệ. Hãy khởi động lại npm run dev và thử lại.');
        }
        return response.json();
    }

    function applyVisionCandidate(candidate) {
        if (!candidate || !foodSearchQuery) return;
        foodSearchQuery.value = candidate.name;
    }

    if (visionFoodCandidates) {
        visionFoodCandidates.addEventListener('change', () => {
            const candidate = JSON.parse(visionFoodCandidates.value);
            if (visionConfidence) {
                const percent = Math.round(candidate.confidence * 100);
                visionConfidence.textContent = `Độ tin cậy của gợi ý: ${percent}%.`;
                visionConfidence.className = `vision-confidence ${candidate.confidence < 0.55 ? 'is-low' : candidate.confidence < 0.8 ? 'is-medium' : 'is-high'}`;
            }
        });
    }

    if (confirmFoodCandidateBtn) {
        confirmFoodCandidateBtn.addEventListener('click', () => {
            if (!visionFoodCandidates?.value) return;
            applyVisionCandidate(JSON.parse(visionFoodCandidates.value));
            if (recognizeFoodBtn) recognizeFoodBtn.disabled = false;
            if (visionStatus) visionStatus.textContent = 'Đã xác nhận tên món. Hãy nhập khối lượng đã cân rồi tra cứu USDA.';
        });
    }

    if (foodSearchQuery) {
        foodSearchQuery.addEventListener('input', () => {
            if (foodSearchQuery.value.trim().length >= 2 && recognizeFoodBtn) recognizeFoodBtn.disabled = false;
        });
    }

    if (analyzePhotoBtn) {
        analyzePhotoBtn.addEventListener('click', async () => {
            if (!selectedFoodImageDataUrl) return;
            analyzePhotoBtn.disabled = true;
            if (visionStatus) visionStatus.textContent = 'AI đang kiểm tra món ăn trong ảnh...';
            try {
                const response = await firebaseAuthenticatedFetch('/api/vision/recognize-food', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageDataUrl: selectedFoodImageDataUrl })
                });
                const payload = await readJsonResponse(response);
                if (!response.ok) throw new Error(payload.error || 'Không thể phân tích ảnh này.');
                if (!payload.isFood || !payload.candidates?.length) {
                    throw new Error(payload.note || 'Không nhận diện được món ăn. Hãy thử ảnh rõ hơn.');
                }

                visionFoodCandidates.replaceChildren(...payload.candidates.map((candidate) => {
                    const option = document.createElement('option');
                    option.value = JSON.stringify(candidate);
                    option.textContent = `${candidate.name} — độ tin cậy ${Math.round(candidate.confidence * 100)}%`;
                    return option;
                }));
                visionFoodCandidates.style.display = 'block';
                if (visionCandidatesLabel) visionCandidatesLabel.style.display = 'block';
                visionFoodCandidates.dispatchEvent(new Event('change'));
                if (confirmFoodCandidateBtn) confirmFoodCandidateBtn.style.display = 'block';
                if (recognizeFoodBtn) recognizeFoodBtn.disabled = true;
                if (visionStatus) {
                    const confidenceMessage = payload.confidenceLevel === 'low'
                        ? 'Độ tin cậy thấp; hãy kiểm tra kỹ hoặc dùng ảnh rõ hơn.'
                        : payload.confidenceLevel === 'medium'
                            ? 'Độ tin cậy vừa; cần xác nhận trước khi tiếp tục.'
                            : 'Độ tin cậy cao nhưng vẫn cần bạn xác nhận.';
                    visionStatus.textContent = `${payload.note || ''} ${confidenceMessage}`;
                }
            } catch (error) {
                if (visionStatus) visionStatus.textContent = error.message;
            } finally {
                analyzePhotoBtn.disabled = false;
            }
        });
    }

    if (recognizeFoodBtn) {
        recognizeFoodBtn.addEventListener('click', async () => {
            const query = foodSearchQuery?.value.trim() || '';
            const grams = Number(foodServingGrams?.value || 100);
            if (query.length < 2) {
                if (foodSearchStatus) foodSearchStatus.textContent = 'Hãy nhập tên món có ít nhất 2 ký tự.';
                foodSearchQuery?.focus();
                return;
            }

            recognizeFoodBtn.disabled = true;
            if (foodSearchStatus) foodSearchStatus.textContent = 'Đang tìm trên USDA FoodData Central...';
            try {
                const response = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}&grams=${encodeURIComponent(grams)}`);
                const payload = await readJsonResponse(response);
                if (!response.ok) throw new Error(payload.error || 'Không thể tìm kiếm thực phẩm.');
                foodSearchResults = payload.foods || [];
                if (!foodSearchResults.length) throw new Error('Không tìm thấy món phù hợp. Hãy thử tên tiếng Anh ngắn và tổng quát hơn.');

                if (foodResultSelect) {
                    foodResultSelect.replaceChildren(...foodSearchResults.map((food, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = `${food.name} (${food.dataType})`;
                        return option;
                    }));
                }
                await loadSelectedFoodDetails(foodSearchResults[0], grams);
                if (foodSearchStatus) foodSearchStatus.textContent = `Tìm thấy ${foodSearchResults.length} kết quả USDA. Hãy chọn bản ghi và khẩu phần gần đúng nhất.`;
            } catch (error) {
                resetFoodAnalysis();
                if (foodSearchStatus) foodSearchStatus.textContent = error.message;
            } finally {
                recognizeFoodBtn.disabled = false;
            }
        });
    }

    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', async () => {
            if (!latestFoodAnalysis) return;
            if (latestFoodAnalysis.nutritionComplete === false
                || latestFoodAnalysis.missingNutrients?.length) {
                if (foodSearchStatus) {
                    foodSearchStatus.textContent = 'Không thể lưu món có dữ liệu dinh dưỡng bị thiếu. Hãy chọn bản ghi USDA khác.';
                }
                return;
            }
            addFoodBtn.disabled = true;
            try {
                await saveFoodToFirebase({
                    foodName: latestFoodAnalysis.name,
                    calories: latestFoodAnalysis.calories,
                    protein: latestFoodAnalysis.protein,
                    carbs: latestFoodAnalysis.carbs,
                    fat: latestFoodAnalysis.fat,
                    fiber: latestFoodAnalysis.fiber,
                    servingGrams: latestFoodAnalysis.grams,
                    nutritionSource: latestFoodAnalysis.source,
                    fdcId: latestFoodAnalysis.fdcId || null,
                    dataType: latestFoodAnalysis.dataType,
                    brandName: latestFoodAnalysis.brandName || null,
                    gtinUpc: latestFoodAnalysis.gtinUpc || null
                });
                if (foodSearchStatus) foodSearchStatus.textContent = `Đã thêm ${latestFoodAnalysis.name} vào nhật ký.`;
                if (foodUploadInput) foodUploadInput.value = '';
            } catch (error) {
                if (foodSearchStatus) foodSearchStatus.textContent = getAuthErrorMessage(error);
                addFoodBtn.disabled = false;
            }
        });
    }

    resetFoodAnalysis();

    const weightEntryForm = getEl('weight-entry-form');
    const weightEntryDate = getEl('weight-entry-date');
    const weightEntryKg = getEl('weight-entry-kg');
    const weightEntryStatus = getEl('weight-entry-status');
    const saveWeightEntryBtn = getEl('save-weight-entry-btn');

    if (weightEntryDate) {
        weightEntryDate.value = FitAIDateUtils.toDateKey();
        weightEntryDate.max = FitAIDateUtils.toDateKey();
    }

    if (weightEntryForm) {
        weightEntryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const dateKey = weightEntryDate?.value || '';
            const weightKg = Number(weightEntryKg?.value);
            if (!dateKey || dateKey > FitAIDateUtils.toDateKey()) {
                if (weightEntryStatus) weightEntryStatus.textContent = 'Hãy chọn hôm nay hoặc một ngày trước đó.';
                return;
            }
            if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 350) {
                if (weightEntryStatus) weightEntryStatus.textContent = 'Cân nặng phải nằm trong khoảng 30–350 kg.';
                return;
            }

            if (saveWeightEntryBtn) saveWeightEntryBtn.disabled = true;
            if (weightEntryStatus) weightEntryStatus.textContent = 'Đang lưu số đo...';
            try {
                const user = await ensureAuthenticatedUser();
                const measurementDate = FitAIDateUtils.parseDateKey(dateKey);
                measurementDate.setHours(12, 0, 0, 0);
                await db.collection('weightEntries').doc(`${user.uid}_${dateKey}`).set({
                    ownerId: user.uid,
                    dateKey,
                    weightKg: Number(weightKg.toFixed(1)),
                    measuredAt: measurementDate,
                    updatedAt: new Date()
                });
                if (weightEntryStatus) weightEntryStatus.textContent = `Đã lưu ${weightKg.toFixed(1)} kg cho ngày ${dateKey}.`;
                await loadWeightHistory();
            } catch (error) {
                console.error('Unable to save weight:', error);
                if (weightEntryStatus) weightEntryStatus.textContent = error.code?.startsWith('auth/')
                    ? getAuthErrorMessage(error)
                    : 'Không thể lưu cân nặng. Vui lòng thử lại.';
            } finally {
                if (saveWeightEntryBtn) saveWeightEntryBtn.disabled = false;
            }
        });
        window.addEventListener('resize', () => drawWeightChart(latestWeightEntries));
    }

    const activityEntryForm = getEl('activity-entry-form');
    const activityEntryDate = getEl('activity-entry-date');
    const activityEntrySteps = getEl('activity-entry-steps');
    const activityEntryMinutes = getEl('activity-entry-minutes');
    const activityEntryStatus = getEl('activity-entry-status');
    const saveActivityEntryBtn = getEl('save-activity-entry-btn');

    if (activityEntryDate) {
        activityEntryDate.value = FitAIDateUtils.toDateKey();
        activityEntryDate.max = FitAIDateUtils.toDateKey();
    }

    if (activityEntryForm) {
        activityEntryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const dateKey = activityEntryDate?.value || '';
            const steps = Number(activityEntrySteps?.value);
            const activeMinutes = Number(activityEntryMinutes?.value);
            if (!dateKey || dateKey > FitAIDateUtils.toDateKey()) {
                if (activityEntryStatus) activityEntryStatus.textContent = 'Hãy chọn hôm nay hoặc một ngày trước đó.';
                return;
            }
            if (!Number.isInteger(steps) || steps < 0 || steps > 100000) {
                if (activityEntryStatus) activityEntryStatus.textContent = 'Số bước phải là số nguyên trong khoảng 0–100.000.';
                return;
            }
            if (!Number.isInteger(activeMinutes) || activeMinutes < 0 || activeMinutes > 1440) {
                if (activityEntryStatus) activityEntryStatus.textContent = 'Số phút vận động phải nằm trong khoảng 0–1.440.';
                return;
            }

            if (saveActivityEntryBtn) saveActivityEntryBtn.disabled = true;
            if (activityEntryStatus) activityEntryStatus.textContent = 'Đang lưu vận động...';
            try {
                const user = await ensureAuthenticatedUser();
                const measuredAt = FitAIDateUtils.parseDateKey(dateKey);
                measuredAt.setHours(12, 0, 0, 0);
                await db.collection('activityEntries').doc(`${user.uid}_${dateKey}`).set({
                    ownerId: user.uid,
                    dateKey,
                    steps,
                    activeMinutes,
                    measuredAt,
                    updatedAt: new Date()
                });
                if (activityEntryStatus) activityEntryStatus.textContent = `Đã lưu ${steps.toLocaleString('vi-VN')} bước và ${activeMinutes} phút vận động cho ngày ${dateKey}.`;
                await loadActivityHistory();
            } catch (error) {
                console.error('Unable to save activity:', error);
                if (activityEntryStatus) activityEntryStatus.textContent = error.code?.startsWith('auth/')
                    ? getAuthErrorMessage(error)
                    : 'Không thể lưu vận động. Vui lòng thử lại.';
            } finally {
                if (saveActivityEntryBtn) saveActivityEntryBtn.disabled = false;
            }
        });
    }

    const wellnessEntryForm = getEl('wellness-entry-form');
    const wellnessEntryDate = getEl('wellness-entry-date');
    const wellnessSleepHours = getEl('wellness-sleep-hours');
    const wellnessStressLevel = getEl('wellness-stress-level');
    const wellnessEntryStatus = getEl('wellness-entry-status');
    const saveWellnessEntryBtn = getEl('save-wellness-entry-btn');

    if (wellnessEntryDate) {
        wellnessEntryDate.value = FitAIDateUtils.toDateKey();
        wellnessEntryDate.max = FitAIDateUtils.toDateKey();
    }

    if (wellnessEntryForm) {
        wellnessEntryForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const dateKey = wellnessEntryDate?.value || '';
            const sleepHours = Number(wellnessSleepHours?.value);
            const stressLevel = Number(wellnessStressLevel?.value);
            if (!dateKey || dateKey > FitAIDateUtils.toDateKey()) {
                if (wellnessEntryStatus) wellnessEntryStatus.textContent = 'Hãy chọn hôm nay hoặc một ngày trước đó.';
                return;
            }
            if (!Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) {
                if (wellnessEntryStatus) wellnessEntryStatus.textContent = 'Thời gian ngủ phải nằm trong khoảng 0–24 giờ.';
                return;
            }
            if (!Number.isInteger(stressLevel) || stressLevel < 1 || stressLevel > 5) {
                if (wellnessEntryStatus) wellnessEntryStatus.textContent = 'Hãy chọn mức stress từ 1 đến 5.';
                return;
            }

            if (saveWellnessEntryBtn) saveWellnessEntryBtn.disabled = true;
            if (wellnessEntryStatus) wellnessEntryStatus.textContent = 'Đang lưu dữ liệu phục hồi...';
            try {
                const user = await ensureAuthenticatedUser();
                const measuredAt = FitAIDateUtils.parseDateKey(dateKey);
                measuredAt.setHours(12, 0, 0, 0);
                await db.collection('wellnessEntries').doc(`${user.uid}_${dateKey}`).set({
                    ownerId: user.uid,
                    dateKey,
                    sleepHours: Number(sleepHours.toFixed(1)),
                    stressLevel,
                    measuredAt,
                    updatedAt: new Date()
                });
                if (wellnessEntryStatus) wellnessEntryStatus.textContent = `Đã lưu ${sleepHours.toFixed(1)} giờ ngủ và mức stress ${stressLevel}/5 cho ngày ${dateKey}.`;
                await loadWellnessHistory();
            } catch (error) {
                console.error('Unable to save wellness data:', error);
                if (wellnessEntryStatus) wellnessEntryStatus.textContent = error.code?.startsWith('auth/')
                    ? getAuthErrorMessage(error)
                    : 'Không thể lưu giấc ngủ và stress. Vui lòng thử lại.';
            } finally {
                if (saveWellnessEntryBtn) saveWellnessEntryBtn.disabled = false;
            }
        });
    }

    const diaryDatePicker = getEl('diary-date-picker');
    const diaryDateTitle = getEl('diary-date-title');
    const diaryTodayBtn = getEl('diary-today-btn');
    const completeDiaryDayBtn = getEl('complete-diary-day-btn');

    function setDiaryDate(dateKey, shouldLoad = true) {
        selectedDiaryDateKey = dateKey;
        if (diaryDatePicker) diaryDatePicker.value = dateKey;
        if (diaryDateTitle) {
            const date = FitAIDateUtils.parseDateKey(dateKey);
            const locale = getCurrentLanguage() === 'en' ? 'en-US' : 'vi-VN';
            diaryDateTitle.textContent = dateKey === FitAIDateUtils.toDateKey()
                ? "Nhật ký thực phẩm hôm nay"
                : `${translateUI('Nhật ký thực phẩm')} — ${date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        }
        if (shouldLoad && auth.currentUser) loadDiaryFromFirebase(dateKey);
    }

    if (diaryDatePicker) {
        diaryDatePicker.max = FitAIDateUtils.toDateKey();
        diaryDatePicker.addEventListener('change', () => {
            if (diaryDatePicker.value) setDiaryDate(diaryDatePicker.value);
        });
        setDiaryDate(selectedDiaryDateKey, false);
    }

    document.querySelectorAll('.diary-date-step').forEach((button) => {
        button.addEventListener('click', () => {
            const nextDate = FitAIDateUtils.shiftDateKey(selectedDiaryDateKey, Number(button.dataset.days));
            if (nextDate <= FitAIDateUtils.toDateKey()) setDiaryDate(nextDate);
        });
    });

    if (diaryTodayBtn) {
        diaryTodayBtn.addEventListener('click', () => setDiaryDate(FitAIDateUtils.toDateKey()));
    }

    if (completeDiaryDayBtn) {
        completeDiaryDayBtn.addEventListener('click', async () => {
            const actionStatus = getEl('diary-action-status');
            completeDiaryDayBtn.disabled = true;
            try {
                await completeDiaryDay(selectedDiaryDateKey);
                if (actionStatus) actionStatus.textContent = 'Bạn đã tự xác nhận nhật ký ngày này là đầy đủ.';
            } catch (error) {
                if (actionStatus) actionStatus.textContent = error.message;
                renderDiaryCompletionState(false, currentDiaryItemCount > 0);
            }
        });
    }

    document.addEventListener('fitai:languagechange', () => {
        updateNotificationPermissionUI();
        setDiaryDate(selectedDiaryDateKey, false);
        drawWeightChart(latestWeightEntries);
    });

    // Initialize weekly calendar
    const calendarContainer = document.getElementById('dynamic-calendar');
    if (calendarContainer) {
        const todayDate = new Date();
        const dayOfWeekNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        for (let i = -3; i <= 4; i++) {
            const currentLoopDate = new Date();
            currentLoopDate.setDate(todayDate.getDate() + i);
            const dayNum = currentLoopDate.getDate();
            const dayTxt = dayOfWeekNames[currentLoopDate.getDay()];
            
            const dayElement = document.createElement('div');
            dayElement.className = 'cal-day' + (i === 0 ? ' active' : '');
            dayElement.innerHTML = `<span class="day-txt">${dayTxt}</span><span class="day-num">${dayNum}</span>`;
            dayElement.addEventListener('click', () => {
                document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('active'));
                dayElement.classList.add('active');
                setDiaryDate(FitAIDateUtils.toDateKey(currentLoopDate));
            });
            calendarContainer.appendChild(dayElement);
        }
    }

    // Top gear settings button
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    if (settingsToggleBtn) {
        settingsToggleBtn.addEventListener('click', () => {
            const panel = document.getElementById('settings-panel');
            if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
    }

    // Monitor auth state and read from dedicated 'profiles' database
    auth.onAuthStateChanged(async user => {
        const authScope = getAuthScope(user);
        const authScopeChanged = activeAuthScope !== null && activeAuthScope !== authScope;
        activeAuthScope = authScope;
        if (authScopeChanged) resetRuntimeUserState();

        const onboardingScreen = document.getElementById('onboarding-screen');
        const mainAppScreen = document.getElementById('main-app-screen');

        if (!user || user.isAnonymous) {
            setProfileAuthState(null);
            const settingsPanel = document.getElementById('settings-panel');
            if (settingsPanel) settingsPanel.style.display = 'none';
            setOverviewAuthState(null);
            if (hasOnboardingCompleted()) {
                showMainAppScreen();
            } else {
                showOnboardingScreen();
            }
            return;
        }
        
        if (user) {
            const isRegistered = true;
            setProfileAuthState(user);
            setOverviewAuthState(isRegistered ? user : null);
            // Đọc hồ sơ theo đúng UID và bỏ kết quả nếu tài khoản đã đổi trong lúc chờ.
            const requestedScope = authScope;
            try {
                const doc = await db.collection("profiles").doc(user.uid).get();
                if (activeAuthScope !== requestedScope) return;
                if (doc.exists) {
                    globalProfileData = doc.data();
                    setOnboardingCompleted(true, user);
                    saveOnboardingDraft(globalProfileData, user);
                    updateProfileUI(globalProfileData);
                    showMainAppScreen();
                } else {
                    resetRuntimeUserState();
                    setOnboardingCompleted(false, user);
                    showOnboardingScreen();
                }
                loadPersonalizedRoadmap();
                checkDueReminders();
            } catch (error) {
                if (activeAuthScope !== requestedScope) return;
                console.error('Unable to load profile:', error);
                resetRuntimeUserState();
                showOnboardingScreen();
            }
            loadDiaryFromFirebase();
            loadWeightHistory();
            loadActivityHistory();
            loadWellnessHistory();
            updateDailyFocus();
        }
    });

    window.setInterval(checkDueReminders, 60 * 1000);
    window.addEventListener('focus', checkDueReminders);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkDueReminders();
    });

    const onboardingDone = hasOnboardingCompleted();
    if (onboardingDone) {
        showMainAppScreen();
    } else {
        showOnboardingScreen();
    }

    function validateEmail(email) {
        return typeof email === 'string' && email.includes('@') && email.includes('.') && email.indexOf('@') > 0 && email.indexOf('@') < email.length - 1;
    }

    function validateAuthForm(email, password, outputId) {
        if (!email || !password) {
            showAuthFeedback(outputId, 'Vui lòng nhập đầy đủ email và mật khẩu.', true);
            return false;
        }
        if (!validateEmail(email)) {
            showAuthFeedback(outputId, 'Email không hợp lệ. Ví dụ: user@example.com.', true);
            return false;
        }
        if (password.length < 6) {
            showAuthFeedback(outputId, 'Mật khẩu phải có ít nhất 6 ký tự.', true);
            return false;
        }
        return true;
    }

    // SIGN UP ACCOUNT
    const btnSignup = document.getElementById('btn-signup');
    if (btnSignup) {
        btnSignup.addEventListener('click', async () => {
            const emailEl = document.getElementById('auth-email');
            const passEl = document.getElementById('auth-password');
            if (!emailEl || !passEl) return;
            const email = emailEl.value.trim();
            const pass = passEl.value.trim();
            if (!validateAuthForm(email, pass, 'profile-reset-status')) return;
            btnSignup.disabled = true;
            try {
                const user = await createOrUpgradeAccount(email, pass);
                let verificationSent = true;
                try {
                    await user.sendEmailVerification();
                } catch {
                    verificationSent = false;
                }
                clearAuthForm();
                showAuthFeedback('profile-reset-status', verificationSent
                    ? 'Đăng ký thành công. Hãy kiểm tra email xác minh.'
                    : 'Đăng ký thành công, nhưng chưa gửi được email xác minh. Bạn có thể gửi lại trong Hồ sơ.');
            } catch (error) {
                showAuthFeedback('profile-reset-status', getAuthErrorMessage(error), true);
            } finally {
                btnSignup.disabled = false;
            }
        });
    }

    // SIGN IN ACCOUNT
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const emailEl = document.getElementById('auth-email');
            const passEl = document.getElementById('auth-password');
            if (!emailEl || !passEl) return;
            const email = emailEl.value.trim();
            const pass = passEl.value.trim();
            if (!validateAuthForm(email, pass, 'profile-reset-status')) return;
            btnLogin.disabled = true;
            try {
                const credential = await auth.signInWithEmailAndPassword(email, pass);
                setProfileAuthState(credential.user);
                setOverviewAuthState(credential.user);
                clearAuthForm();
                showAuthFeedback('profile-reset-status', 'Đăng nhập thành công.');
            } catch (error) {
                showAuthFeedback('profile-reset-status', getAuthErrorMessage(error), true);
            } finally {
                btnLogin.disabled = false;
            }
        });
    }

    // LOG OUT ACCOUNT
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            btnLogout.disabled = true;
            try {
                await signOutToPrivateGuest();
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) settingsPanel.style.display = 'none';
                alert('Đã đăng xuất.');
            } catch (error) {
                btnLogout.disabled = false;
                alert(getAuthErrorMessage(error));
            }
        });
    }

    const resendVerificationBtn = document.getElementById('resend-verification-btn');
    if (resendVerificationBtn) {
        resendVerificationBtn.addEventListener('click', async () => {
            resendVerificationBtn.disabled = true;
            try {
                const user = await ensureAuthenticatedUser();
                await user.sendEmailVerification();
                showAuthFeedback('verification-action-status', 'Đã gửi lại email xác minh. Hãy kiểm tra cả thư rác.');
            } catch (error) {
                showAuthFeedback('verification-action-status', getAuthErrorMessage(error), true);
            } finally {
                resendVerificationBtn.disabled = false;
            }
        });
    }

    // INTERACTIVE AI MEAL ANALYSIS ASSISTANT
    const aiChatSendBtn = document.getElementById('ai-chat-send-btn');
    // ĐIỀU HƯỚNG QUY TRÌNH KHẢO SÁT KHỞI ĐỘNG (ONBOARDING)
    const validationFields = {
        dob: 'quiz-dob', height: 'quiz-height', weight: 'quiz-weight',
        activity: 'work-activity', goal: 'weight-goal', targetWeight: 'target-weight'
    };

    function getAge(dateOfBirth) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || '')) return null;
        const birthDate = new Date(`${dateOfBirth}T00:00:00`);
        if (Number.isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) age -= 1;
        return age;
    }

    const nutritionChatForm = document.getElementById('nutrition-chat-form');
    const nutritionChatHistory = [];
    if (nutritionChatForm && aiChatSendBtn) {
        nutritionChatForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const inputField = document.getElementById('ai-chat-input');
            const chatHistory = document.getElementById('ai-chat-history');
            const status = document.getElementById('nutrition-chat-status');
            if (!inputField || !chatHistory || inputField.value.trim().length < 2) {
                inputField?.focus();
                return;
            }
            const message = inputField.value.trim();
            const userDiv = document.createElement('div');
            userDiv.className = 'chat-msg user-msg';
            userDiv.textContent = `Bạn: ${message}`;
            chatHistory.appendChild(userDiv);
            inputField.value = '';
            aiChatSendBtn.disabled = true;
            if (status) {
                status.hidden = false;
                status.classList.remove('is-error');
                status.textContent = 'FitAI đang chuẩn bị câu trả lời...';
            }
            try {
                const response = await firebaseAuthenticatedFetch('/api/nutrition/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message,
                        history: nutritionChatHistory.slice(-8),
                        context: {
                            language: localStorage.getItem('fitai_language') === 'en' ? 'en' : 'vi',
                            goal: globalProfileData.goal,
                            currentWeightKg: globalProfileData.weight,
                            targetWeightKg: globalProfileData.targetWeight,
                            bmi: globalProfileData.metrics?.bmi,
                            tdee: globalProfileData.metrics?.tdee,
                            targetCalories: globalProfileData.plan?.targetCalories,
                            macroTargets: globalProfileData.macros,
                            consumedToday: {
                                calories: consumedCalories,
                                protein: consumedProtein,
                                carbs: consumedCarbs,
                                fat: consumedFat,
                                fiber: consumedFiber
                            },
                            allergies: globalProfileData.allergies
                        }
                    })
                });
                const payload = await readJsonResponse(response);
                if (!response.ok) throw new Error(payload.error || 'Không thể nhận câu trả lời từ trợ lý AI.');
                const answerDiv = document.createElement('div');
                answerDiv.className = 'chat-msg ai-msg';
                const label = document.createElement('strong');
                label.textContent = 'FitAI:';
                const answer = document.createElement('p');
                answer.textContent = payload.answer;
                answerDiv.append(label, answer);
                if (payload.suggestions?.length) {
                    const list = document.createElement('ul');
                    list.className = 'nutrition-chat-suggestions';
                    payload.suggestions.forEach((suggestion) => {
                        const item = document.createElement('li');
                        item.textContent = suggestion;
                        list.appendChild(item);
                    });
                    answerDiv.appendChild(list);
                }
                if (payload.caution) {
                    const caution = document.createElement('p');
                    caution.className = 'nutrition-chat-caution';
                    caution.textContent = payload.caution;
                    answerDiv.appendChild(caution);
                }
                chatHistory.appendChild(answerDiv);
                nutritionChatHistory.push({ role: 'user', text: message }, { role: 'model', text: payload.answer });
                if (nutritionChatHistory.length > 8) nutritionChatHistory.splice(0, nutritionChatHistory.length - 8);
                if (status) status.hidden = true;
            } catch (error) {
                if (status) {
                    status.hidden = false;
                    status.textContent = error.message;
                    status.classList.add('is-error');
                }
            } finally {
                aiChatSendBtn.disabled = false;
                chatHistory.scrollTop = chatHistory.scrollHeight;
                inputField.focus();
            }
        });
    }

    function validateOnboardingStep(step, data = getOnboardingFormData()) {
        const errors = {};
        const height = Number(data.height);
        const weight = Number(data.weight);
        const targetWeight = Number(data.targetWeight);
        if (step === 1) {
            const age = getAge(data.dob);
            if (age === null) errors.dob = 'Please enter a valid date of birth.';
            else if (age < 18) errors.dob = 'FitAI currently supports adults aged 18 or older.';
            else if (age > 100) errors.dob = 'Please verify your date of birth.';
            if (!data.height || !Number.isFinite(height) || height < 120 || height > 230) errors.height = 'Height must be between 120 and 230 cm.';
            if (!data.weight || !Number.isFinite(weight) || weight < 35 || weight > 300) errors.weight = 'Current weight must be between 35 and 300 kg.';
        }
        if (step === 2 && !['sedentary', 'lightly', 'moderately'].includes(data.activity)) errors.activity = 'Please select a valid activity level.';
        if (step === 3) {
            if (!['lose', 'maintain', 'gain'].includes(data.goal)) errors.goal = 'Please select a valid weight goal.';
            if (!data.targetWeight || !Number.isFinite(targetWeight) || targetWeight < 35 || targetWeight > 300) errors.targetWeight = 'Cân nặng mục tiêu phải nằm trong khoảng 35–300 kg.';
            else if (data.goal === 'lose' && targetWeight >= weight) errors.targetWeight = 'A weight-loss target must be lower than your current weight.';
            else if (data.goal === 'gain' && targetWeight <= weight) errors.targetWeight = 'A weight-gain target must be higher than your current weight.';
            else if (data.goal === 'maintain' && Math.abs(targetWeight - weight) > 2) errors.targetWeight = 'A maintenance target must stay within 2 kg of your current weight.';
        }
        return errors;
    }

    function clearValidationErrors() {
        Object.values(validationFields).forEach((id) => {
            document.getElementById(id)?.classList.remove('input-invalid');
            const error = document.getElementById(`${id}-error`);
            if (error) error.textContent = '';
        });
        const summary = document.getElementById('validation-summary');
        if (summary) { summary.hidden = true; summary.textContent = ''; }
    }

    function showValidationErrors(errors) {
        clearValidationErrors();
        const messages = Object.entries(errors);
        messages.forEach(([field, message]) => {
            const inputId = validationFields[field];
            document.getElementById(inputId)?.classList.add('input-invalid');
            const error = document.getElementById(`${inputId}-error`);
            if (error) error.textContent = message;
        });
        const summary = document.getElementById('validation-summary');
        if (summary && messages.length) {
            summary.textContent = messages.map(([, message]) => message).join(' ');
            summary.hidden = false;
        }
        const firstInputId = validationFields[messages[0]?.[0]];
        if (firstInputId) document.getElementById(firstInputId)?.focus();
    }

    function showSafetyFeedback(safety) {
        const container = document.getElementById('safety-feedback');
        if (!container) return;
        container.hidden = true;
        container.className = 'safety-feedback';
        container.replaceChildren();
        if (!safety || safety.status === 'ok') return;

        const blocked = !safety.allowed;
        const issues = blocked ? safety.blockers : safety.warnings;
        const heading = document.createElement('strong');
        heading.textContent = blocked ? 'Kế hoạch này chưa thể được sử dụng an toàn.' : 'Hãy xem lại các lưu ý an toàn sau.';
        const list = document.createElement('ul');
        issues.forEach(({ message }) => {
            const item = document.createElement('li');
            item.textContent = message;
            list.appendChild(item);
        });
        container.append(heading, list);
        container.classList.add(blocked ? 'is-blocked' : 'is-warning');
        container.hidden = false;
        if (blocked) container.focus?.();
    }

    async function requestProfileValidation(profileData) {
        const response = await fetch('/api/profile/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        const payload = await response.json();
        if (!response.ok && !payload.valid && !payload.safety) return payload;
        return payload;
    }

    let currentStep = 1;
    const totalSteps = 4;
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const quizProgress = document.getElementById('quiz-progress');

    function setQuizProgress() {
        if (!quizProgress) return;
        quizProgress.style.width = ((currentStep - 1) / (totalSteps - 1)) * 100 + '%';
    }

    function showQuizStep(step, hidePrevious = true) {
        const currentStepEl = document.querySelector(`.quiz-step[data-step="${currentStep}"]`);
        const nextStepEl = document.querySelector(`.quiz-step[data-step="${step}"]`);
        if (hidePrevious && currentStepEl) currentStepEl.classList.remove('active');
        if (nextStepEl) nextStepEl.classList.add('active');
        currentStep = step;
    }

    function resetOnboardingFlow() {
        document.querySelectorAll('.quiz-step').forEach((stepElement, index) => {
            stepElement.classList.toggle('active', index === 0);
        });
        currentStep = 1;
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.innerText = 'Tiếp theo';
        clearValidationErrors();
        setQuizProgress();
    }

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', async () => {
            if (currentStep < totalSteps) {
                const errors = validateOnboardingStep(currentStep);
                if (Object.keys(errors).length) {
                    showValidationErrors(errors);
                    return;
                }
                clearValidationErrors();
                if (currentStep === 3) {
                    let previewResult;
                    try {
                        previewResult = await requestProfileValidation(getOnboardingFormData());
                    } catch (error) {
                        showValidationErrors({ form: 'Không thể tính ước lượng năng lượng. Vui lòng thử lại.' });
                        return;
                    }
                    if (!previewResult.valid) {
                        showValidationErrors(previewResult.errors);
                        return;
                    }
                    showSafetyFeedback(previewResult.safety);
                    if (!previewResult.safety?.allowed) return;
                    updateEnergyMetricsUI(previewResult.metrics);
                    updateWeightPlanUI(previewResult.plan);
                    updateMacroTargetsUI(previewResult.macros);
                    renderMealSuggestions(previewResult.mealSuggestions);
                    const weightGoalEl = document.getElementById('weight-goal');
                    const repGoalEl = document.getElementById('rep-goal');
                    const goal = weightGoalEl ? weightGoalEl.value : 'maintain';
                    if (repGoalEl) repGoalEl.innerText = goal === 'lose' ? 'Giảm cân' : (goal === 'gain' ? 'Tăng cân' : 'Duy trì cân nặng');
                }
                showQuizStep(currentStep + 1);
                prevBtn.style.display = 'block';
                nextBtn.innerText = currentStep + 1 === totalSteps ? 'Hoàn tất và đồng bộ' : 'Tiếp theo';
            } else {
                await finishOnboarding();
            }
            setQuizProgress();
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                showQuizStep(currentStep - 1);
                nextBtn.innerText = 'Tiếp theo';
                if (currentStep === 1) prevBtn.style.display = 'none';
            }
            setQuizProgress();
        });
    }

    async function finishOnboarding() {
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        const dobEl = document.getElementById('quiz-dob');
        const heightEl = document.getElementById('quiz-height');
        const weightEl = document.getElementById('quiz-weight');
        const goalEl = document.getElementById('weight-goal');
        const activityEl = document.getElementById('work-activity');
        const targetWeightEl = document.getElementById('target-weight');

        if (!selectedGender || !dobEl || !heightEl || !weightEl || !goalEl || !activityEl || !targetWeightEl) {
            return;
        }

        const draftData = getOnboardingFormData();
        const profileData = {
            gender: selectedGender.value,
            dob: dobEl.value,
            height: Number(heightEl.value),
            weight: Number(weightEl.value),
            goal: goalEl.value,
            activity: activityEl.value,
            targetWeight: Number(targetWeightEl.value),
            allergies: draftData.allergies
            ,healthContext: draftData.healthContext
        };

        let validationResult;
        try {
            validationResult = await requestProfileValidation(profileData);
        } catch (error) {
            showValidationErrors({ form: 'Không thể xác thực hồ sơ. Vui lòng thử lại.' });
            return;
        }
        if (!validationResult.valid) {
            showValidationErrors(validationResult.errors);
            return;
        }
        showSafetyFeedback(validationResult.safety);
        if (!validationResult.safety?.allowed) return;
        clearValidationErrors();
        globalProfileData = {
            ...validationResult.data,
            metrics: validationResult.metrics,
            plan: validationResult.plan,
            macros: validationResult.macros,
            mealSuggestions: validationResult.mealSuggestions,
            safety: validationResult.safety
        };
        updateEnergyMetricsUI(validationResult.metrics);
        updateWeightPlanUI(validationResult.plan);
        updateMacroTargetsUI(validationResult.macros);
        renderMealSuggestions(validationResult.mealSuggestions);

        const dashCurrentW = document.getElementById('dash-current-w');
        const dashGoalCal = document.getElementById('dash-goal-cal');
        if (dashCurrentW) dashCurrentW.innerText = globalProfileData.weight + ' kg';
        if (dashGoalCal) dashGoalCal.innerText = goalCalories;

        if (auth.currentUser && !auth.currentUser.isAnonymous) {
            try {
                await saveProfileToFirebase(globalProfileData);
            } catch (error) {
                showValidationErrors({ form: 'Không thể đồng bộ hồ sơ. Vui lòng kiểm tra kết nối và thử lại.' });
                return;
            }
        }
        updateProfileUI(globalProfileData);
        saveOnboardingDraft(globalProfileData);

        setOnboardingCompleted(true);
        showMainAppScreen();
        updateCalorieUI();
        revealMealSuggestions();
    }
    }
});
