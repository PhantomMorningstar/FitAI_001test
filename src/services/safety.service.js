const MINIMUM_CALORIES = 1000;
const LOW_INTAKE_WARNING_CALORIES = 1200;
const MAX_WEEKLY_LOSS_KG = 0.91;

const issue = (code, message) => ({ code, message });

const evaluatePlanSafety = (profile, metrics, plan) => {
  const blockers = [];
  const warnings = [];
  const weightLossPercent = profile.goal === 'lose'
    ? ((profile.weight - profile.targetWeight) / profile.weight) * 100
    : 0;

  if (profile.healthContext?.pregnant) {
    blockers.push(issue('HEALTH_CONTEXT_PREGNANT', 'FitAI không tạo kế hoạch thay đổi cân nặng tự động trong thai kỳ. Hãy làm việc với bác sĩ sản khoa.'));
  }
  if (profile.healthContext?.breastfeeding) {
    blockers.push(issue('HEALTH_CONTEXT_BREASTFEEDING', 'FitAI không tạo mục tiêu calorie tự động khi đang cho con bú. Nhu cầu dinh dưỡng và năng lượng cần được chuyên gia y tế xem xét.'));
  }
  if (profile.healthContext?.eatingDisorderHistory) {
    blockers.push(issue('HEALTH_CONTEXT_EATING_DISORDER', 'Mục tiêu calorie và cân nặng tự động có thể không phù hợp nếu đang hoặc từng có rối loạn ăn uống. Hãy tìm hỗ trợ lâm sàng đủ chuyên môn.'));
  }
  if (profile.healthContext?.clinicianSupervised) {
    blockers.push(issue('HEALTH_CONTEXT_CLINICAL_SUPERVISION', 'FitAI không thay thế kế hoạch điều trị bệnh, thuốc hoặc chăm sóc lâm sàng. Hãy làm theo chuyên gia y tế của bạn.'));
  }

  if (profile.goal === 'lose' && metrics.bmi < 18.5) {
    blockers.push(issue('CURRENT_BMI_UNDERWEIGHT', 'Không hỗ trợ giảm cân khi BMI hiện tại dưới 18,5.'));
  }
  if (metrics.targetBmi < 18.5) {
    blockers.push(issue('TARGET_BMI_UNDERWEIGHT', 'Cân nặng mục tiêu sẽ tạo BMI dưới 18,5. Hãy chọn mục tiêu cao hơn.'));
  }
  if (plan.targetCalories < MINIMUM_CALORIES) {
    blockers.push(issue('CALORIES_DANGEROUSLY_LOW', `Mục tiêu tính được dưới ${MINIMUM_CALORIES} kcal/ngày và không thể sử dụng.`));
  }
  if (profile.goal === 'lose' && plan.estimatedWeeklyChangeKg > MAX_WEEKLY_LOSS_KG) {
    blockers.push(issue('LOSS_RATE_TOO_FAST', 'Tốc độ giảm ước tính vượt 0,9 kg/tuần. Hãy chọn kế hoạch chậm hơn.'));
  }

  if (plan.targetCalories >= MINIMUM_CALORIES && plan.targetCalories < LOW_INTAKE_WARNING_CALORIES) {
    warnings.push(issue('LOW_CALORIE_INTAKE', 'Kế hoạch này dưới 1.200 kcal/ngày. Hãy cân nhắc tư vấn dinh dưỡng chuyên môn trước khi tiếp tục.'));
  }
  if (profile.goal === 'lose' && weightLossPercent > 10) {
    warnings.push(issue('LARGE_INITIAL_GOAL', 'Mục tiêu vượt 10% cân nặng ban đầu. Hãy cân nhắc dùng 5–10% làm cột mốc đầu tiên.'));
  }
  if (metrics.bmi >= 30 && profile.goal === 'lose') {
    warnings.push(issue('CLINICAL_SUPPORT_RECOMMENDED', 'Hỗ trợ chuyên môn có thể giúp quản lý rủi ro sức khỏe và xây dựng kế hoạch cá nhân hóa hơn.'));
  }
  if (metrics.targetBmi >= 30) {
    warnings.push(issue('TARGET_BMI_HIGH', 'Cân nặng mục tiêu vẫn thuộc vùng BMI béo phì. BMI chỉ là công cụ sàng lọc; hãy trao đổi mục tiêu với chuyên gia y tế.'));
  }

  return {
    allowed: blockers.length === 0,
    status: blockers.length ? 'blocked' : (warnings.length ? 'warning' : 'ok'),
    blockers,
    warnings,
    thresholds: {
      minimumCalories: MINIMUM_CALORIES,
      lowIntakeWarningCalories: LOW_INTAKE_WARNING_CALORIES,
      maximumWeeklyLossKg: MAX_WEEKLY_LOSS_KG
    }
  };
};

module.exports = {
  evaluatePlanSafety,
  LOW_INTAKE_WARNING_CALORIES,
  MAX_WEEKLY_LOSS_KG,
  MINIMUM_CALORIES
};
