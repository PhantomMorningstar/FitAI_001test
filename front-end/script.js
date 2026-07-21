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
let localUserId = "guest_user";

let goalCalories = 1450;
let consumedCalories = 0;
let globalProfileData = {};
let latestFoodAnalysis = null;

function setOnboardingCompleted(value) {
    localStorage.setItem('fitai_onboarding_completed', value ? 'true' : 'false');
}

function hasOnboardingCompleted() {
    return localStorage.getItem('fitai_onboarding_completed') === 'true';
}

function clearAuthForm() {
    const emailEl = document.getElementById('auth-email');
    const passEl = document.getElementById('auth-password');
    if (emailEl) emailEl.value = '';
    if (passEl) passEl.value = '';
}

// ==========================================
// 🗄️ DATABASE ENGINE CHO HỒ SƠ RIÊNG (PROFILES COLLECTION)
// ==========================================
function saveProfileToFirebase(profileData) {
    if(auth.currentUser) {
        // Store personal data in a dedicated 'profiles' collection
        db.collection("profiles").doc(auth.currentUser.uid).set({
            ...profileData,
            updatedAt: new Date()
        }, { merge: true })
        .then(() => console.log("Profile updated in dedicated profiles collection."));
    } else {
        // If user is a guest without a registered account
        db.collection("profiles").add({
            userId: localUserId,
            ...profileData,
            createdAt: new Date()
        });
    }
}

function saveFoodToFirebase(foodData) {
    const uid = auth.currentUser ? auth.currentUser.uid : localUserId;
    db.collection("foodDiaries").add({ userId: uid, ...foodData, timestamp: new Date() })
    .then(() => {
        consumedCalories += foodData.calories;
        updateCalorieUI();
        loadDiaryFromFirebase();
    });
}

function loadDiaryFromFirebase() {
    const listEl = document.getElementById('diary-list');
    if(!listEl) return;
    const uid = auth.currentUser ? auth.currentUser.uid : localUserId;
    db.collection("foodDiaries").where("userId", "==", uid).get().then((querySnapshot) => {
        listEl.innerHTML = "";
        if (querySnapshot.empty) {
            listEl.innerHTML = `<li class="food-item" style="color:var(--text-muted)">No food items have been logged today yet.</li>`;
            return;
        }
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const li = document.createElement('li');
            li.className = 'food-item';
            li.innerHTML = `<div><strong>${item.foodName}</strong></div><span class="badge">${item.calories} kcal • P: ${item.protein || 0}g • Fiber: ${item.fiber || 0}g</span>`;
            listEl.appendChild(li);
        });
    });
}

// ==========================================
// 📊 INTERACTIVE PROGRESS UPDATE ENGINE
// ==========================================
function updateCalorieUI() {
    let remaining = goalCalories - consumedCalories;
    if (remaining < 0) remaining = 0;

    const dashRemaining = document.getElementById('dash-remaining-cal');
    const dashConsumed = document.getElementById('dash-consumed-cal');
    if (dashRemaining) dashRemaining.innerText = remaining;
    if (dashConsumed) dashConsumed.innerText = consumedCalories;

    const circle = document.getElementById('calorie-progress-circle');
    const pct = Math.min(consumedCalories / goalCalories, 1);
    const offset = 440 - (pct * 440);
    if(circle) circle.style.strokeDashoffset = offset;

    let pG = Math.min((consumedCalories * 0.08), 120).toFixed(0);
    let cG = Math.min((consumedCalories * 0.12), 180).toFixed(0);
    let fG = Math.min((consumedCalories * 0.04), 60).toFixed(0);

    const macroP = document.getElementById('macro-p-val');
    const macroC = document.getElementById('macro-c-val');
    const macroF = document.getElementById('macro-f-val');
    if (macroP) macroP.innerText = `${pG}/120g`;
    if (macroC) macroC.innerText = `${cG}/180g`;
    if (macroF) macroF.innerText = `${fG}/60g`;

    const proteinBar = document.querySelector('.macro-progress-fill.protein');
    const carbsBar = document.querySelector('.macro-progress-fill.carbs');
    const fatsBar = document.querySelector('.macro-progress-fill.fats');
    if (proteinBar) proteinBar.style.width = (pG / 120 * 100) + '%';
    if (carbsBar) carbsBar.style.width = (cG / 180 * 100) + '%';
    if (fatsBar) fatsBar.style.width = (fG / 60 * 100) + '%';
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
    
    let goalText = "Maintain Weight";
    if (data.goal === 'lose') goalText = "Lose Weight";
    if (data.goal === 'gain') goalText = "Gain Weight";
    if (profGoal) profGoal.innerText = goalText;
}

// ==========================================
// 🕹️ DOM OBJECT EVENT INITIALIZERS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const getEl = id => document.getElementById(id);

    // Allergy chip selection handling
    const allergyChips = document.querySelectorAll('.allergy-chip');
    allergyChips.forEach(chip => {
        chip.addEventListener('click', function() { this.classList.toggle('selected'); });
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

    // Food image recognition controls
    const foodUploadInput = getEl('food-upload');
    const uploadImageBtn = getEl('upload-image-btn');
    const recognizeFoodBtn = getEl('recognize-food-btn');
    const foodPreview = getEl('food-preview');
    const analysisResult = getEl('analysis-result');
    const analysisFoodName = getEl('analysis-food-name');
    const analysisCalories = getEl('analysis-calories');
    const analysisProtein = getEl('analysis-protein');
    const analysisFiber = getEl('analysis-fiber');
    const addFoodBtn = getEl('add-food-btn');

    function resetFoodAnalysis() {
        latestFoodAnalysis = null;
        if (analysisFoodName) analysisFoodName.innerText = '...';
        if (analysisCalories) analysisCalories.innerText = '-- kcal';
        if (analysisProtein) analysisProtein.innerText = '-- g';
        if (analysisFiber) analysisFiber.innerText = '-- g';
        if (addFoodBtn) addFoodBtn.disabled = true;
        if (recognizeFoodBtn) recognizeFoodBtn.disabled = foodUploadInput ? !foodUploadInput.files.length : true;
        if (analysisResult) analysisResult.style.display = 'none';
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
        });
    }

    function simulateFoodRecognition(imageFile) {
        const normalizedName = imageFile.name.toLowerCase();
        const baseResults = {
            'chicken': { name: 'Grilled Chicken Breast', calories: 220, protein: 34, fiber: 0 },
            'salad': { name: 'Green Salad', calories: 120, protein: 4, fiber: 3 },
            'oatmeal': { name: 'Oatmeal Bowl', calories: 280, protein: 10, fiber: 5 },
            'egg': { name: 'Boiled Egg', calories: 78, protein: 6, fiber: 0 },
            'banana': { name: 'Banana', calories: 105, protein: 1, fiber: 3 },
            'bread': { name: 'Whole Grain Bread', calories: 70, protein: 3, fiber: 2 }
        };

        for (const key in baseResults) {
            if (normalizedName.includes(key)) {
                return baseResults[key];
            }
        }

        const randomFoods = [
            { name: 'Mixed Meal', calories: 420, protein: 25, fiber: 4 },
            { name: 'Fruit Plate', calories: 180, protein: 2, fiber: 6 },
            { name: 'Pasta Dish', calories: 520, protein: 18, fiber: 5 }
        ];
        return randomFoods[Math.floor(Math.random() * randomFoods.length)];
    }

    function showFoodAnalysis(result) {
        latestFoodAnalysis = result;
        if (analysisFoodName) analysisFoodName.innerText = result.name;
        if (analysisCalories) analysisCalories.innerText = `${result.calories} kcal`;
        if (analysisProtein) analysisProtein.innerText = `${result.protein} g`;
        if (analysisFiber) analysisFiber.innerText = `${result.fiber} g`;
        if (addFoodBtn) addFoodBtn.disabled = false;
        if (analysisResult) analysisResult.style.display = 'flex';
    }

    if (foodUploadInput) {
        foodUploadInput.addEventListener('change', () => {
            const file = foodUploadInput.files[0];
            if (!file) {
                resetFoodAnalysis();
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (foodPreview) {
                    foodPreview.src = event.target.result;
                    foodPreview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
            if (recognizeFoodBtn) recognizeFoodBtn.disabled = false;
            if (addFoodBtn) addFoodBtn.disabled = true;
            if (analysisResult) analysisResult.style.display = 'none';
        });
    }

    if (recognizeFoodBtn) {
        recognizeFoodBtn.addEventListener('click', () => {
            if (!foodUploadInput) return;
            const file = foodUploadInput.files[0];
            if (!file) return;
            const analysis = simulateFoodRecognition(file);
            showFoodAnalysis(analysis);
        });
    }

    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', () => {
            if (!latestFoodAnalysis) return;
            saveFoodToFirebase({
                foodName: latestFoodAnalysis.name,
                calories: latestFoodAnalysis.calories,
                protein: latestFoodAnalysis.protein,
                fiber: latestFoodAnalysis.fiber
            });
            alert(`Logged ${latestFoodAnalysis.name} with ${latestFoodAnalysis.calories} kcal.`);
            if (foodUploadInput) foodUploadInput.value = '';
            if (recognizeFoodBtn) recognizeFoodBtn.disabled = true;
            addFoodBtn.disabled = true;
        });
    }

    resetFoodAnalysis();

    // Initialize weekly calendar
    const calendarContainer = document.getElementById('dynamic-calendar');
    if (calendarContainer) {
        const todayDate = new Date();
        const dayOfWeekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
    auth.onAuthStateChanged(user => {
        const authBox = document.getElementById('auth-container');
        const profileBox = document.getElementById('authenticated-profile-container');
        const settingsBtn = document.getElementById('settings-toggle-btn');
        const profilePage = document.getElementById('profile-page');
        const onboardingScreen = document.getElementById('onboarding-screen');
        const mainAppScreen = document.getElementById('main-app-screen');
        
        if (user) {
            if (authBox) authBox.style.display = 'none';
            if (profileBox) profileBox.style.display = 'flex';
            if (mainAppScreen) mainAppScreen.style.display = 'flex';
            if (onboardingScreen) onboardingScreen.style.display = 'none';
            if (settingsBtn) {
                settingsBtn.style.display = profilePage ? 'block' : 'none';
            }
            // Đọc dữ liệu từ bộ sưu tập "profiles" riêng biệt
            db.collection("profiles").doc(user.uid).get().then(doc => {
                if(doc.exists) {
                    globalProfileData = doc.data();
                    updateProfileUI(globalProfileData);
                } else {
                    updateProfileUI(globalProfileData);
                }
            });
            loadDiaryFromFirebase();
        } else {
            const onboardingDone = hasOnboardingCompleted();
            if (authBox) authBox.style.display = 'block';
            if (profileBox) profileBox.style.display = 'none';
            if (settingsBtn) settingsBtn.style.display = 'none';
            if (mainAppScreen) mainAppScreen.style.display = onboardingDone ? 'flex' : 'none';
            if (onboardingScreen) onboardingScreen.style.display = onboardingDone ? 'none' : 'block';
        }
    });

    function validateEmail(email) {
        return typeof email === 'string' && email.includes('@') && email.includes('.') && email.indexOf('@') > 0 && email.indexOf('@') < email.length - 1;
    }

    function validateAuthForm(email, password) {
        if (!email || !password) {
            alert('Vui lòng nhập đầy đủ email và mật khẩu.');
            return false;
        }
        if (!validateEmail(email)) {
            alert('Email không hợp lệ. Vui lòng nhập định dạng user@example.com.');
            return false;
        }
        if (password.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự.');
            return false;
        }
        return true;
    }

    // SIGN UP ACCOUNT
    const btnSignup = document.getElementById('btn-signup');
    if (btnSignup) {
        btnSignup.addEventListener('click', () => {
            const emailEl = document.getElementById('auth-email');
            const passEl = document.getElementById('auth-password');
            if (!emailEl || !passEl) return;
            const email = emailEl.value.trim();
            const pass = passEl.value.trim();
            if (!validateAuthForm(email, pass)) return;
            auth.createUserWithEmailAndPassword(email, pass)
            .then(() => {
                alert('Đăng ký thành công. Bạn đã được đăng nhập tự động.');
                clearAuthForm();
            }).catch(err => alert(err.message));
        });
    }

    // SIGN IN ACCOUNT
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            const emailEl = document.getElementById('auth-email');
            const passEl = document.getElementById('auth-password');
            if (!emailEl || !passEl) return;
            const email = emailEl.value.trim();
            const pass = passEl.value.trim();
            if (!validateAuthForm(email, pass)) return;
            auth.signInWithEmailAndPassword(email, pass)
            .then(() => {
                alert('Đăng nhập thành công!');
                clearAuthForm();
            })
            .catch(err => alert(err.message));
        });
    }

    // LOG OUT ACCOUNT
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut().then(() => {
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) settingsPanel.style.display = 'none';
                alert("Logged out.");
            });
        });
    }

    // INTERACTIVE AI MEAL ANALYSIS ASSISTANT
    const aiChatSendBtn = document.getElementById('ai-chat-send-btn');
    if (aiChatSendBtn) {
        aiChatSendBtn.addEventListener('click', () => {
            const inputField = document.getElementById('ai-chat-input');
            const chatHistory = document.getElementById('ai-chat-history');
            if (!inputField || !chatHistory) return;
            const queryText = inputField.value.trim();
            if(!queryText) return;

            const userDiv = document.createElement('div');
            userDiv.className = 'chat-msg user-msg';
            userDiv.innerHTML = `<strong>You:</strong> ${queryText}`;
            chatHistory.appendChild(userDiv);
            inputField.value = "";

            // Simulate AI extracting calories and macronutrients from the query
            setTimeout(() => {
                let parsedFoodName = "Mixed Meal";
                let parsedCal = 420;
                let p = 25, c = 45, f = 12;

                if(queryText.toLowerCase().includes('trứng') || queryText.toLowerCase().includes('egg')) {
                    parsedFoodName = "Boiled Egg Combo"; parsedCal = 155; p = 13; c = 1; f = 11;
                } else if (queryText.toLowerCase().includes('yến mạch') || queryText.toLowerCase().includes('oatmeal')) {
                    parsedFoodName = "Oatmeal Bowl"; parsedCal = 280; p = 10; c = 54; f = 5;
                } else if (queryText.toLowerCase().includes('ức gà') || queryText.toLowerCase().includes('chicken')) {
                    parsedFoodName = "Pan-Seared Chicken Breast"; parsedCal = 195; p = 31; c = 0; f = 4;
                }

                const aiDiv = document.createElement('div');
                aiDiv.className = 'chat-msg ai-msg';
                aiDiv.innerHTML = `<strong>AI Assistant:</strong> Found <b>${parsedFoodName}</b> in the meal database. <br>🔥 Energy: <b>${parsedCal} kcal</b> <br>🧬 Nutrition: Protein: ${p}g | Carbs: ${c}g | Fats: ${f}g. <br><button class="btn btn-primary" style="padding:5px 10px; font-size:11px; margin-top:8px;" onclick="saveFoodToFirebase({foodName:'${parsedFoodName}', calories:${parsedCal}, protein:${p}, fiber:0})">+ Log to diary</button>`;
                chatHistory.appendChild(aiDiv);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }, 800);
        });
    }

    // ĐIỀU HƯỚNG QUY TRÌNH KHẢO SÁT KHỞI ĐỘNG (ONBOARDING)
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

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                if (currentStep === 3) {
                    const weightGoalEl = document.getElementById('weight-goal');
                    const repGoalEl = document.getElementById('rep-goal');
                    const repCalEl = document.getElementById('rep-cal');
                    const goal = weightGoalEl ? weightGoalEl.value : 'maintain';
                    if (repGoalEl) repGoalEl.innerText = goal === 'lose' ? 'Lose Weight' : (goal === 'gain' ? 'Gain Weight' : 'Maintain Body');
                    if (repCalEl) repCalEl.innerText = (goal === 'lose' ? 1450 : (goal === 'gain' ? 2200 : 1800)) + ' kcal / day';
                    goalCalories = goal === 'lose' ? 1450 : (goal === 'gain' ? 2200 : 1800);
                }
                showQuizStep(currentStep + 1);
                prevBtn.style.display = 'block';
                nextBtn.innerText = currentStep + 1 === totalSteps ? 'Finish & Sync' : 'Next';
            } else {
                finishOnboarding();
            }
            setQuizProgress();
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 1) {
                showQuizStep(currentStep - 1);
                nextBtn.innerText = 'Next';
                if (currentStep === 1) prevBtn.style.display = 'none';
            }
            setQuizProgress();
        });
    }

    function finishOnboarding() {
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

        globalProfileData = {
            gender: selectedGender.value,
            dob: dobEl.value,
            height: Number(heightEl.value),
            weight: Number(weightEl.value),
            goal: goalEl.value,
            activity: activityEl.value,
            targetWeight: Number(targetWeightEl.value)
        };

        const dashCurrentW = document.getElementById('dash-current-w');
        const dashGoalCal = document.getElementById('dash-goal-cal');
        if (dashCurrentW) dashCurrentW.innerText = globalProfileData.weight + ' kg';
        if (dashGoalCal) dashGoalCal.innerText = goalCalories;

        saveProfileToFirebase(globalProfileData);
        updateProfileUI(globalProfileData);

        const onboardingScreen = document.getElementById('onboarding-screen');
        const mainAppScreen = document.getElementById('main-app-screen');
        if (onboardingScreen) onboardingScreen.style.display = 'none';
        if (mainAppScreen) mainAppScreen.style.display = 'flex';
        updateCalorieUI();
    }
});