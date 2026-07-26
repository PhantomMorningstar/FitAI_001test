(function exposeRoadmapUtils(root) {
    function uniqueDiaryDays(entries) {
        return new Set((entries || []).map((entry) => entry.dateKey).filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))).size;
    }

    function buildPersonalizedRoadmap(profile, weightEntries, diaryEntries, weightUtils) {
        const hasProfile = Boolean(profile?.plan?.targetCalories && profile?.macros && profile?.targetWeight);
        const weights = weightUtils.normalizeEntries(weightEntries);
        const trend = weightUtils.calculateWeightTrend(weights);
        const progress = weightUtils.calculateGoalProgress(weights, profile?.targetWeight, profile?.goal);
        const diaryDays = uniqueDiaryDays(diaryEntries);
        const baselineReady = trend.count >= 3 && trend.days >= 7 && diaryDays >= 3;
        const goalReached = baselineReady && ['reached', 'maintaining'].includes(progress.status);
        const goalLabel = profile?.goal === 'gain' ? 'Tăng cân'
            : profile?.goal === 'maintain' ? 'Duy trì cân nặng'
                : 'Giảm cân';

        const observedRate = trend.weeklyRateKg;
        const movingCorrectly = profile?.goal === 'lose' ? observedRate < 0
            : profile?.goal === 'gain' ? observedRate > 0
                : observedRate !== null && Math.abs(observedRate) <= 0.25;
        const usableWeeklyRate = movingCorrectly ? Math.abs(observedRate) : Number(profile?.plan?.estimatedWeeklyChangeKg);
        const estimatedWeeksRemaining = progress.remainingKg !== null && usableWeeklyRate > 0 && profile?.goal !== 'maintain'
            ? Math.ceil(progress.remainingKg / usableWeeklyRate)
            : null;

        const phases = [
            {
                id: 'setup',
                title: 'Thiết lập mục tiêu dựa trên dữ liệu',
                status: hasProfile ? 'completed' : 'active',
                duration: 'Hôm nay',
                description: hasProfile
                    ? `${profile.plan.targetCalories} kcal/ngày • Đạm ${profile.macros.protein} g • Tinh bột ${profile.macros.carbs} g • Béo ${profile.macros.fat} g • Xơ ${profile.macros.fiber} g`
                    : 'Hoàn thiện hồ sơ để tính năng lượng, các chất đa lượng và mục tiêu an toàn.',
                action: hasProfile ? 'Mục tiêu đã được tính. Hãy cập nhật hồ sơ khi hoàn cảnh thay đổi.' : 'Hoàn thành các câu hỏi thiết lập ban đầu.'
            },
            {
                id: 'baseline',
                title: 'Xây dựng dữ liệu nền đáng tin cậy',
                status: !hasProfile ? 'upcoming' : baselineReady ? 'completed' : 'active',
                duration: '7–14 ngày đầu',
                description: `${trend.count}/3+ số đo cân nặng trong ${trend.days}/7+ ngày • ${diaryDays}/3+ ngày ghi món ăn`,
                action: baselineReady
                    ? 'Dữ liệu nền đã sẵn sàng; hãy dùng trung bình 7 ngày thay vì phản ứng với một số đo.'
                    : 'Ghi món ăn ít nhất 3 ngày và ghi ít nhất 3 số đo cân nặng trong 7 ngày.'
            },
            {
                id: 'active',
                title: profile?.goal === 'gain' ? 'Giai đoạn tăng cân có kiểm soát'
                    : profile?.goal === 'maintain' ? 'Giai đoạn duy trì ổn định'
                        : 'Giai đoạn giảm cân bền vững',
                status: !baselineReady ? 'upcoming' : goalReached ? 'completed' : 'active',
                duration: estimatedWeeksRemaining === null ? 'Đánh giá lại mỗi 2 tuần' : `Còn khoảng ${estimatedWeeksRemaining} tuần`,
                description: progress.latestWeightKg === null
                    ? 'Xu hướng cân nặng sẽ xuất hiện sau khi có số đo.'
                    : `Mới nhất ${progress.latestWeightKg.toFixed(1)} kg • Mục tiêu ${progress.targetWeightKg.toFixed(1)} kg • Hoàn thành ${progress.progressPercent}%`,
                action: !baselineReady
                    ? 'Hãy hoàn thành giai đoạn dữ liệu nền trước.'
                    : progress.status === 'away-from-goal'
                        ? 'Kiểm tra độ chính xác của khẩu phần và mức tuân thủ; không đổi mục tiêu năng lượng chỉ vì một lần cân.'
                        : 'Tiếp tục ghi đều đặn và xem trung bình 7 ngày mỗi tuần.'
            },
            {
                id: 'maintenance',
                title: 'Duy trì và củng cố kết quả',
                status: goalReached ? 'active' : 'upcoming',
                duration: 'Ít nhất 4 tuần',
                description: goalReached
                    ? 'Ổn định quanh cân nặng mục tiêu và tiếp tục theo dõi trung bình tuần.'
                    : 'Giai đoạn này bắt đầu khi xu hướng ghi nhận đạt mục tiêu đã chọn.',
                action: goalReached
                    ? 'Giữ cân nặng gần mục tiêu và dần ổn định quanh mức năng lượng duy trì.'
                    : 'Tiếp tục giai đoạn hiện tại; không bắt đầu duy trì quá sớm.'
            }
        ];

        return {
            ready: hasProfile,
            goalLabel,
            currentWeightKg: progress.latestWeightKg,
            targetWeightKg: progress.targetWeightKg,
            progressPercent: progress.progressPercent,
            estimatedWeeksRemaining,
            diaryDays,
            weightMeasurements: trend.count,
            phases
        };
    }

    const api = { buildPersonalizedRoadmap, uniqueDiaryDays };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAIRoadmapUtils = api;
}(typeof window !== 'undefined' ? window : globalThis));
