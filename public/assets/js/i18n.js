(function exposeI18n(root) {
    const STORAGE_KEY = 'fitai_language';
    const VI_TO_EN = Object.freeze({
        'Cài ứng dụng': 'Install app',
        'Bạn đang ngoại tuyến. Một số chức năng cần Internet.': 'You are offline. Some features require an Internet connection.',
        'Tổng quan': 'Overview',
        'Bỏ qua đến nội dung chính': 'Skip to main content',
        'Điều hướng chính': 'Main navigation',
        'Mở cài đặt': 'Open settings',
        'Ngày trước': 'Previous day',
        'Ngày sau': 'Next day',
        'Lộ trình': 'Roadmap',
        'Máy ảnh': 'Camera',
        'Nhật ký': 'Diary',
        'Hồ sơ': 'Profile',
        'Theo dõi và lộ trình | FitAI': 'Tracking and roadmap | FitAI',
        'Lộ trình | FitAI': 'Roadmap | FitAI',
        'Nhận diện món ăn | FitAI': 'Food recognition | FitAI',
        'Nhật ký thực phẩm | FitAI': 'Food diary | FitAI',
        'Hồ sơ | FitAI': 'Profile | FitAI',
        'Nhật ký thực phẩm': 'Food diary',
        'Xem các món đã ghi theo ngày và theo dõi lượng dinh dưỡng đã nạp.': 'Review foods logged by date and track your nutrient intake.',
        'Ngày ghi nhật ký': 'Diary date',
        'Hôm nay': 'Today',
        'Chất đạm': 'Protein',
        'Tinh bột': 'Carbs',
        'Chất béo': 'Fat',
        'Chất xơ': 'Fiber',
        'Các giai đoạn cá nhân hóa giúp bạn tiến tới mục tiêu cân nặng an toàn.': 'Personalized phases help you progress toward a safe weight goal.',
        'Lộ trình cá nhân hóa của bạn': 'Your personalized roadmap',
        'Đang tải hồ sơ và dữ liệu tiến độ...': 'Loading your profile and progress data...',
        'Mục tiêu': 'Goal',
        'Hiện tại': 'Current',
        'Cân nặng đích': 'Target weight',
        'Tiến độ': 'Progress',
        'Thời gian ước tính': 'Estimated time',
        'Nhận diện món ăn': 'Food recognition',
        'Tra cứu khẩu phần đã cân bằng dữ liệu thành phần thực phẩm USDA.': 'Look up measured portions using USDA food composition data.',
        'Chụp hoặc tải ảnh món ăn lên': 'Take or upload a meal photo',
        'Tải ảnh lên': 'Upload image',
        'Phân tích ảnh bằng AI': 'Analyze photo with AI',
        'Gợi ý từ AI — hãy xác nhận món gần đúng nhất': 'AI suggestions — confirm the closest food',
        'Tên món ăn': 'Food name',
        'Khẩu phần đã cân (gram)': 'Measured portion (grams)',
        'Tra cứu dữ liệu USDA': 'Search USDA data',
        'Kết quả dinh dưỡng': 'Nutrition result',
        'Năng lượng:': 'Calories:',
        'Chọn kết quả gần đúng nhất': 'Choose the closest match',
        'Chọn khẩu phần USDA': 'Choose a USDA portion',
        'Xác nhận gợi ý này': 'Confirm this suggestion',
        '+ Thêm vào nhật ký': '+ Add to diary',
        'Trải nghiệm FitAI': 'FitAI experience',
        'Cá nhân hóa lộ trình sức khỏe của bạn': 'Customize your health roadmap',
        'Thông tin cơ bản (1/2)': 'Basic information (1/2)',
        'Giới tính': 'Gender',
        'Nam': 'Male',
        'Nữ': 'Female',
        'Ngày sinh': 'Date of birth',
        'Chiều cao (cm)': 'Height (cm)',
        'Cân nặng hiện tại (kg)': 'Current weight (kg)',
        'Vận động và dị ứng (2/2)': 'Activity and allergies (2/2)',
        'Mức độ vận động': 'Activity level',
        'Dị ứng thực phẩm (có thể chọn nhiều)': 'Food allergies (select all that apply)',
        'Hải sản': 'Seafood',
        'Đậu phộng': 'Peanuts',
        'Sữa / Lactose': 'Milk / lactose',
        'Trứng': 'Eggs',
        'Gluten / Lúa mì': 'Gluten / wheat',
        'Đậu nành': 'Soy',
        'Thiết lập mục tiêu': 'Set your goal',
        'Mục tiêu cân nặng': 'Weight goal',
        'Giảm cân': 'Lose weight',
        'Duy trì cân nặng': 'Maintain weight',
        'Tăng cân': 'Gain weight',
        'Cân nặng mục tiêu (kg)': 'Target weight (kg)',
        'Tóm tắt mục tiêu': 'Goal summary',
        'Quay lại': 'Back',
        'Tiếp theo': 'Next',
        'Theo dõi năng lượng và các chất dinh dưỡng đa lượng mỗi ngày.': 'Track your daily energy and macro progress.',
        'Tài khoản': 'Account',
        'Đăng nhập': 'Sign in',
        'Đăng xuất': 'Sign out',
        'Đăng ký': 'Sign up',
        'Sửa thông tin': 'Edit information',
        'Mật khẩu': 'Password',
        'Quên mật khẩu?': 'Forgot password?',
        'kcal còn lại': 'kcal remaining',
        'Đã nạp': 'Consumed',
        'Mục tiêu dinh dưỡng hằng ngày': 'Daily macro targets',
        'Cân nặng': 'Weight',
        'Nước uống': 'Hydration',
        'Hồ sơ cá nhân': 'Personal profile',
        'Quản lý tài khoản và thông tin sức khỏe cá nhân.': 'Manage your account and personal health information.',
        'Đăng nhập hoặc tạo tài khoản': 'Sign in or create an account',
        'Địa chỉ email': 'Email address',
        'Nhập mật khẩu': 'Enter your password',
        'Tùy chọn': 'Preferences',
        'Thông báo và nhắc nhở': 'Notifications and reminders',
        'Bật thông báo trình duyệt': 'Enable browser notifications',
        'Chưa yêu cầu quyền': 'Permission not requested',
        'Bật nhắc nhở': 'Enable reminders',
        'Vận động': 'Activity',
        'Giấc ngủ và stress': 'Sleep and stress',
        'Lưu nhắc nhở': 'Save reminders',
        'Lịch sử cân nặng': 'Weight history',
        'Ghi một số đo mỗi ngày. Lưu lại cùng ngày sẽ cập nhật số đo cũ.': 'Log one measurement per day. Saving the same date updates the existing measurement.',
        'Ngày đo': 'Measurement date',
        'Cân nặng (kg)': 'Weight (kg)',
        'Lưu số đo': 'Save measurement',
        'Mới nhất': 'Latest',
        'Trung bình 7 ngày': '7-day average',
        'Tổng thay đổi': 'Total change',
        'Trung bình/tuần': 'Average/week',
        'Số lần đo': 'Measurements',
        'Còn lại': 'Remaining',
        'Tiến độ mục tiêu': 'Goal progress',
        'Ngày': 'Date',
        'Thay đổi': 'Change',
        'Vận động hằng ngày': 'Daily activity',
        'Số bước chân': 'Steps',
        'Phút vận động': 'Active minutes',
        'Lưu vận động': 'Save activity',
        'Bước chân 7 ngày': '7-day steps',
        'Mức quan sát': 'Observed level',
        'TDEE quan sát': 'Observed TDEE',
        'Độ tin cậy dữ liệu': 'Data confidence',
        'Giấc ngủ (giờ)': 'Sleep (hours)',
        'Mức stress': 'Stress level',
        'Rất thấp': 'Very low',
        'Thấp': 'Low',
        'Vừa': 'Moderate',
        'Cao': 'High',
        'Rất cao': 'Very high',
        'Lưu dữ liệu phục hồi': 'Save recovery data',
        'Ngủ trung bình': 'Average sleep',
        'Stress trung bình': 'Average stress',
        'Ngày stress cao': 'High-stress days',
        'Số ngày đã ghi': 'Recorded days',
        'Trợ lý thực phẩm': 'Food assistant',
        'Trợ lý dinh dưỡng AI': 'AI nutrition assistant',
        'Hỏi về cách áp dụng mục tiêu năng lượng và macro của bạn. AI không thay thế bác sĩ và không tự thay đổi kế hoạch.': 'Ask how to apply your calorie and macro targets. AI does not replace a doctor or change your plan.',
        'Lịch sử trò chuyện': 'Chat history',
        'Bạn muốn được hỗ trợ gì về kế hoạch dinh dưỡng hôm nay?': 'How can I help with your nutrition plan today?',
        'Câu hỏi dinh dưỡng': 'Nutrition question',
        'Gửi': 'Send',
        'Mô tả món ăn': 'Describe your meal',
        'Khẩu phần đã cân theo gram': 'Measured portion in grams',
        'Tra cứu USDA': 'Search USDA',
        'Quay về tổng quan': 'Back to overview',
        'Món ăn': 'Food item',
        'Sửa': 'Edit',
        'Xóa': 'Delete',
        'Lưu thay đổi': 'Save changes',
        'Hủy': 'Cancel',
        'Khẩu phần (gram)': 'Portion (grams)',
        'Tên món phải có ít nhất 2 ký tự.': 'Food name must contain at least 2 characters.',
        'Mục nhật ký này không tồn tại hoặc không thuộc tài khoản của bạn.': 'This diary entry is unavailable or does not belong to your account.',
        'Không có món ăn nào được ghi cho ngày này.': 'No food items were logged for this date.',
        'Không thể tải nhật ký của ngày này. Vui lòng thử lại.': 'Unable to load this diary date. Please try again.',
        'Thêm số đo để tính tiến độ mục tiêu.': 'Add measurements to calculate goal progress.',
        'Cân nặng đã ghi không thay đổi so với số đo ban đầu.': 'Your recorded weight has not changed from the starting measurement.',
        'Cân nặng đã ghi đã đạt mục tiêu đã chọn.': 'The recorded weight has reached the selected target.',
        'Cân nặng mới nhất đang nằm trong vùng duy trì.': 'Your latest weight is within the maintenance range.',
        'Cân nặng mới nhất nằm ngoài vùng duy trì ±2 kg.': 'Your latest weight is outside the ±2 kg maintenance range.',
        'Ít vận động': 'Sedentary',
        'Vận động nhẹ': 'Lightly active',
        'Vận động vừa': 'Moderately active',
        'Chưa đủ': 'Insufficient',
        'Tin cậy vừa': 'Medium',
        'Tin cậy cao': 'High',
        'Hãy ghi ít nhất 4 trong 7 ngày trước khi so sánh vận động với hồ sơ.': 'Record at least 4 of 7 days before comparing activity with your profile.',
        'Hãy ghi ít nhất 4 ngày trước khi sử dụng xu hướng ngủ hoặc stress.': 'Record at least 4 days before using sleep or stress patterns in your behavior review.',
        'Dữ liệu ngủ và stress hiện chưa cho thấy cảnh báo phục hồi.': 'Recorded sleep and stress do not currently show a recovery warning.',
        'Thời gian ngủ trung bình dưới 7 giờ. Hãy ưu tiên lịch ngủ ổn định trước khi siết kế hoạch dinh dưỡng.': 'Average sleep is below 7 hours. Prioritize a consistent sleep opportunity before making the nutrition plan more restrictive.',
        'Stress trung bình đang cao. Hãy xem lại trở ngại và thói quen phục hồi trước khi diễn giải thay đổi cân nặng ngắn hạn.': 'Average stress is high. Review barriers and recovery habits before interpreting short-term weight changes.',
        'Thiếu ngủ và stress cao đang xuất hiện cùng nhau. Hãy tập trung phục hồi và tìm hỗ trợ chuyên môn nếu tình trạng kéo dài.': 'Short sleep and high stress are occurring together. Focus on recovery and seek professional support if this pattern persists or feels difficult to manage.',
        'Đánh giá lại mỗi 2 tuần': 'Review every 2 weeks',
        'Hoàn thiện hồ sơ trước khi FitAI xây dựng lộ trình cá nhân.': 'Complete your profile before FitAI can build a personal roadmap.',
        'Giai đoạn': 'Phase',
        'Hoàn thành': 'Completed',
        'Đang thực hiện': 'Active',
        'Sắp tới': 'Upcoming',
        'Hành động tiếp theo': 'Next action',
        'Đang tải khẩu phần và dữ liệu dinh dưỡng USDA...': 'Loading USDA portions and nutrient details...',
        'Không thể tải chi tiết thực phẩm USDA.': 'Unable to load USDA food details.',
        'Khẩu phần tự nhập': 'Custom measured portion',
        'Không thể tính khẩu phần USDA này.': 'Unable to calculate this USDA portion.',
        'Máy chủ trả về dữ liệu không hợp lệ. Hãy khởi động lại npm run dev và thử lại.': 'The server returned an unexpected response. Restart npm run dev and try again.',
        'AI đang kiểm tra món ăn trong ảnh...': 'AI is checking the visible food...',
        'Không thể phân tích ảnh này.': 'Unable to analyze this photo.',
        'Không nhận diện được món ăn. Hãy thử ảnh rõ hơn.': 'No food could be identified. Try a clearer photo.',
        'độ tin cậy': 'confidence',
        'Hãy nhập tên món có ít nhất 2 ký tự.': 'Enter a food name with at least 2 characters.',
        'Đang tìm trên USDA FoodData Central...': 'Searching USDA FoodData Central...',
        'Không thể tìm kiếm thực phẩm.': 'Unable to search foods.',
        'Không tìm thấy món phù hợp. Hãy thử tên tổng quát hơn.': 'No matching food was found. Try a more general name.',
        'Kế hoạch này chưa thể được sử dụng an toàn.': 'This plan cannot be used safely yet.',
        'Hãy xem lại các lưu ý an toàn sau.': 'Please review these safety notes.',
        'Không thể tính ước lượng năng lượng. Vui lòng thử lại.': 'Unable to calculate your energy estimates. Please try again.',
        'Hoàn tất và đồng bộ': 'Finish & Sync',
        'Kế hoạch duy trì': 'Maintenance plan',
        'Không thể xác thực hồ sơ. Vui lòng thử lại.': 'Unable to validate your profile. Please try again.',
        'Hãy chọn giới tính hợp lệ.': 'Please select a valid gender.',
        'Hãy nhập ngày sinh hợp lệ.': 'Please enter a valid date of birth.',
        'FitAI hiện chỉ hỗ trợ người từ 18 tuổi trở lên.': 'FitAI currently supports adults aged 18 or older.',
        'Hãy kiểm tra lại ngày sinh.': 'Please verify your date of birth.',
        'Chiều cao phải nằm trong khoảng 120–230 cm.': 'Height must be between 120 and 230 cm.',
        'Cân nặng hiện tại phải nằm trong khoảng 35–300 kg.': 'Current weight must be between 35 and 300 kg.',
        'Hãy chọn mức vận động hợp lệ.': 'Please select a valid activity level.',
        'Hãy chọn mục tiêu cân nặng hợp lệ.': 'Please select a valid weight goal.',
        'Cân nặng mục tiêu phải nằm trong khoảng 35–300 kg.': 'Target weight must be between 35 and 300 kg.',
        'Mục tiêu giảm cân phải thấp hơn cân nặng hiện tại.': 'A weight-loss target must be lower than your current weight.',
        'Mục tiêu tăng cân phải cao hơn cân nặng hiện tại.': 'A weight-gain target must be higher than your current weight.',
        'Mục tiêu duy trì phải nằm trong khoảng ±2 kg so với cân nặng hiện tại.': 'A maintenance target must stay within 2 kg of your current weight.',
        'Một hoặc nhiều lựa chọn dị ứng không hợp lệ.': 'One or more allergy selections are invalid.',
        'FitAI không tạo kế hoạch thay đổi cân nặng tự động trong thai kỳ. Hãy làm việc với bác sĩ sản khoa.': 'FitAI does not create automated weight-change plans during pregnancy. Please work with an obstetric healthcare professional.',
        'FitAI không tạo mục tiêu calorie tự động khi đang cho con bú. Nhu cầu dinh dưỡng và năng lượng cần được chuyên gia y tế xem xét.': 'FitAI does not create automated calorie targets while breastfeeding. Nutrient and energy needs should be reviewed with a healthcare professional.',
        'Mục tiêu calorie và cân nặng tự động có thể không phù hợp nếu đang hoặc từng có rối loạn ăn uống. Hãy tìm hỗ trợ lâm sàng đủ chuyên môn.': 'Automated calorie and weight targets may be inappropriate with a current or previous eating disorder. Please seek qualified clinical support.',
        'FitAI không thay thế kế hoạch điều trị bệnh, thuốc hoặc chăm sóc lâm sàng. Hãy làm theo chuyên gia y tế của bạn.': 'FitAI must not replace a plan provided for a medical condition, medication, or clinical treatment. Please follow your healthcare professional.',
        'Không hỗ trợ giảm cân khi BMI hiện tại dưới 18,5.': 'Weight loss is not supported when current BMI is below 18.5.',
        'Cân nặng mục tiêu sẽ tạo BMI dưới 18,5. Hãy chọn mục tiêu cao hơn.': 'The target weight would result in a BMI below 18.5. Choose a higher target weight.',
        'Tốc độ giảm ước tính vượt 0,9 kg/tuần. Hãy chọn kế hoạch chậm hơn.': 'The estimated loss rate is above 0.9 kg per week. Choose a slower plan.',
        'Kế hoạch này dưới 1.200 kcal/ngày. Hãy cân nhắc tư vấn dinh dưỡng chuyên môn trước khi tiếp tục.': 'This plan is below 1,200 kcal/day. Consider professional nutrition guidance before proceeding.',
        'Mục tiêu vượt 10% cân nặng ban đầu. Hãy cân nhắc dùng 5–10% làm cột mốc đầu tiên.': 'Your target exceeds 10% of your starting weight. Consider using 5–10% as the first milestone.',
        'Hỗ trợ chuyên môn có thể giúp quản lý rủi ro sức khỏe và xây dựng kế hoạch cá nhân hóa hơn.': 'Professional support may help manage health risks and create a more individualized plan.',
        'Cân nặng mục tiêu vẫn thuộc vùng BMI béo phì. BMI chỉ là công cụ sàng lọc; hãy trao đổi mục tiêu với chuyên gia y tế.': 'The target weight remains in the obesity BMI range. BMI is only a screening measure, so discuss your goal with a healthcare professional.'
        ,
        'Chưa có tài khoản? Chọn “Tạo tài khoản”. Đã đăng ký? Chọn “Đăng nhập”.': 'No account yet? Choose “Create account”. Already registered? Choose “Sign in”.',
        'Ví dụ: Hôm nay tôi còn thiếu bao nhiêu protein?': 'Example: How much protein do I still need today?',
        'ĐÁNH GIÁ BẰNG DỮ LIỆU THẬT': 'REVIEW WITH REAL DATA',
        'Hiệu chỉnh kế hoạch': 'Plan calibration',
        'Chưa đủ dữ liệu': 'Not enough data',
        'FitAI cần tối thiểu 14 ngày dữ liệu trước khi đề xuất thay đổi.': 'FitAI needs at least 14 days of data before suggesting a change.',
        'Tốc độ kế hoạch': 'Planned rate',
        'Tốc độ thực tế': 'Observed rate',
        'Năng lượng đã ghi': 'Logged energy',
        'Tiếp tục ghi cân nặng và món ăn để mở đánh giá.': 'Keep logging weight and food to unlock a review.',
        'Đề xuất không tự động thay đổi mục tiêu. Chỉ đánh giá sau ít nhất 14 ngày để giảm ảnh hưởng của nước và dao động ngắn hạn.': 'Suggestions do not change your target automatically. Reviews wait at least 14 days to reduce the effect of water and short-term fluctuations.',
        'Gửi thông báo thử': 'Send test notification',
        'Trạng thái thông báo': 'Notification status',
        'Đang kiểm tra kết nối an toàn…': 'Checking secure connection…',
        'Đang kiểm tra PWA…': 'Checking PWA…',
        'FitAI kiểm tra thói quen hôm nay trước khi nhắc. Đây là thông báo cục bộ miễn phí của PWA, không cần dịch vụ gửi tin trả phí.': 'FitAI checks today’s habits before reminding you. These are free local PWA notifications with no paid messaging service.',
        'Lịch nhắc được kiểm tra khi FitAI/PWA đang chạy hoặc được mở lại. Nếu trình duyệt bị đóng hoàn toàn, hệ điều hành có thể trì hoãn nhắc; nhận push bảo đảm khi app đã đóng cần FCM hoặc máy chủ gửi push.': 'Reminder schedules are checked while FitAI/PWA is running or reopened. If the browser is fully closed, the operating system may delay reminders; guaranteed push while closed requires FCM or a push server.',
        'Thiết lập mục tiêu dựa trên dữ liệu': 'Set a data-based goal',
        'Mục tiêu đã được tính. Hãy cập nhật hồ sơ khi hoàn cảnh thay đổi.': 'Your target has been calculated. Update your profile when circumstances change.',
        'Hoàn thành các câu hỏi thiết lập ban đầu.': 'Complete the initial setup questions.',
        'Xây dựng dữ liệu nền đáng tin cậy': 'Build a reliable baseline',
        'Dữ liệu nền đã sẵn sàng; hãy dùng trung bình 7 ngày thay vì phản ứng với một số đo.': 'Your baseline is ready; use the 7-day average instead of reacting to one measurement.',
        'Ghi món ăn ít nhất 3 ngày và ghi ít nhất 3 số đo cân nặng trong 7 ngày.': 'Log food on at least 3 days and record at least 3 weight measurements across 7 days.',
        'Giai đoạn tăng cân có kiểm soát': 'Controlled weight-gain phase',
        'Giai đoạn duy trì ổn định': 'Stable maintenance phase',
        'Giai đoạn giảm cân bền vững': 'Sustainable weight-loss phase',
        'Xu hướng cân nặng sẽ xuất hiện sau khi có số đo.': 'Your weight trend will appear after measurements are recorded.',
        'Hãy hoàn thành giai đoạn dữ liệu nền trước.': 'Complete the baseline phase first.',
        'Kiểm tra độ chính xác của khẩu phần và mức tuân thủ; không đổi mục tiêu năng lượng chỉ vì một lần cân.': 'Check portion accuracy and adherence; do not change your calorie target because of one weigh-in.',
        'Tiếp tục ghi đều đặn và xem trung bình 7 ngày mỗi tuần.': 'Keep logging consistently and review the 7-day average each week.',
        'Duy trì và củng cố kết quả': 'Maintain and consolidate results',
        'Ổn định quanh cân nặng mục tiêu và tiếp tục theo dõi trung bình tuần.': 'Stay near your target weight and keep monitoring weekly averages.',
        'Giai đoạn này bắt đầu khi xu hướng ghi nhận đạt mục tiêu đã chọn.': 'This phase begins when the recorded trend reaches your selected target.',
        'Giữ cân nặng gần mục tiêu và dần ổn định quanh mức năng lượng duy trì.': 'Keep your weight near target and gradually stabilize around maintenance calories.',
        'Tiếp tục giai đoạn hiện tại; không bắt đầu duy trì quá sớm.': 'Continue the current phase; do not start maintenance too early.',
        'Nhắc nhật ký thực phẩm': 'Food diary reminder',
        'Hãy ghi các món và khẩu phần đã cân trong hôm nay.': 'Log today’s foods and measured portions.',
        'Nhắc cân nặng': 'Weight reminder',
        'Hãy ghi cân nặng hôm nay nếu đây là ngày bạn thường cân.': 'Record today’s weight if this is one of your usual weigh-in days.',
        'Nhắc vận động': 'Activity reminder',
        'Hãy thêm số bước chân và số phút vận động hôm nay.': 'Add today’s steps and active minutes.',
        'Nhắc phục hồi': 'Recovery reminder',
        'Hãy ghi số giờ ngủ đêm qua và mức stress hôm nay.': 'Record last night’s sleep and today’s stress level.',
        'Đã cấp quyền. Bạn có thể bấm “Gửi thông báo thử”.': 'Permission granted. You can now select “Send test notification”.',
        'Quyền thông báo chưa được cấp. Hãy kiểm tra cài đặt trang trong trình duyệt.': 'Notification permission was not granted. Check this site’s browser settings.',
        'Không thể yêu cầu quyền thông báo trên trình duyệt này.': 'Unable to request notification permission in this browser.',
        'Đang gửi thông báo thử…': 'Sending test notification…',
        'FitAI đã bật thông báo': 'FitAI notifications are enabled',
        'Thông báo cục bộ đang hoạt động trên thiết bị này.': 'Local notifications are working on this device.',
        'Đã gửi. Hãy kiểm tra khu vực thông báo của thiết bị.': 'Sent. Check your device notification area.',
        'Thông báo cần HTTPS hoặc localhost.': 'Notifications require HTTPS or localhost.',
        'Trình duyệt này không hỗ trợ thông báo.': 'This browser does not support notifications.',
        'Hãy bật quyền thông báo trước.': 'Enable notification permission first.',
        'Không thể gửi thông báo thử. Hãy kiểm tra quyền và PWA.': 'Unable to send the test notification. Check permission and PWA status.',
        'Đang lưu cài đặt nhắc nhở...': 'Saving reminder settings...',
        'Đã lưu nhắc nhở. FitAI sẽ bỏ qua thói quen đã hoàn thành hôm nay.': 'Reminders saved. FitAI will skip habits completed today.',
        'Đã tắt nhắc nhở.': 'Reminders disabled.',
        'Không thể lưu cài đặt nhắc nhở. Vui lòng thử lại.': 'Unable to save reminder settings. Please try again.',
        'Kết nối an toàn: đạt': 'Secure connection: ready',
        'Cần HTTPS hoặc localhost': 'HTTPS or localhost required',
        'PWA: đang kiểm tra': 'PWA: checking',
        'PWA không được hỗ trợ': 'PWA is not supported',
        'PWA: sẵn sàng': 'PWA: ready',
        'PWA chưa sẵn sàng': 'PWA is not ready',
        'Trình duyệt không hỗ trợ thông báo hệ thống. Nhắc nhở trong FitAI vẫn hoạt động khi ứng dụng đang mở.': 'This browser does not support system notifications. FitAI reminders still work while the app is open.',
        'Chưa yêu cầu quyền': 'Permission not requested',
        'Đã bật thông báo trình duyệt': 'Browser notifications enabled',
        'Thông báo đang bị chặn trong cài đặt trình duyệt': 'Notifications are blocked in browser settings',
        'Bật thông báo trình duyệt': 'Enable browser notifications',
        'Nhắc nhở FitAI': 'FitAI reminder',
        'Chế độ khách': 'Guest mode',
        'Đăng nhập để FitAI theo dõi những việc bạn đã hoàn thành hôm nay.': 'Sign in so FitAI can track what you complete today.',
        'Đăng nhập để bắt đầu': 'Sign in to get started',
        'Dữ liệu hằng ngày sẽ được lưu riêng cho tài khoản của bạn.': 'Your daily data will be saved privately to your account.',
        'Đăng nhập': 'Sign in',
        'Bạn đã ghi đủ hôm nay. Hãy tiếp tục ổn định, không cần làm thêm.': 'You have completed today’s logs. Stay consistent; nothing else is required.',
        'Chỉ tập trung vào tối đa ba việc dưới đây.': 'Focus on no more than the three tasks below.',
        'Đã hoàn thành hôm nay.': 'Completed today.',
        'Đã xong': 'Done',
        'Chưa thể tải': 'Unable to load',
        'Kế hoạch duy trì': 'Maintenance plan',
        'Món ăn': 'Food',
        'Sửa': 'Edit',
        'Xóa': 'Delete',
        'Khẩu phần (gram)': 'Serving (grams)',
        'Lưu thay đổi': 'Save changes',
        'Hủy': 'Cancel',
        'Tên món phải có ít nhất 2 ký tự.': 'Food name must contain at least 2 characters.',
        'Thêm số đo để tính tiến độ mục tiêu.': 'Add measurements to calculate goal progress.',
        'Cân nặng đã ghi không thay đổi so với số đo ban đầu.': 'Your logged weight is unchanged from the first measurement.',
        'Cân nặng đã ghi đã đạt mục tiêu đã chọn.': 'Your logged weight has reached the selected target.',
        'Cân nặng mới nhất đang nằm trong vùng duy trì.': 'Your latest weight is within the maintenance range.',
        'Cân nặng mới nhất nằm ngoài vùng duy trì ±2 kg.': 'Your latest weight is outside the ±2 kg maintenance range.',
        'Ít vận động': 'Sedentary',
        'Vận động nhẹ': 'Lightly active',
        'Vận động vừa': 'Moderately active',
        'Chưa đủ': 'Insufficient',
        'Tin cậy vừa': 'Medium confidence',
        'Tin cậy cao': 'High confidence',
        'Hãy ghi ít nhất 4 trong 7 ngày trước khi so sánh vận động với hồ sơ.': 'Log at least 4 of 7 days before comparing activity with your profile.',
        'Hãy ghi ít nhất 4 ngày trước khi sử dụng xu hướng ngủ hoặc stress.': 'Log at least 4 days before using sleep or stress trends.',
        'Dữ liệu ngủ và stress hiện chưa cho thấy cảnh báo phục hồi.': 'Your sleep and stress data currently shows no recovery warning.',
        'Thời gian ngủ trung bình dưới 7 giờ. Hãy ưu tiên lịch ngủ ổn định trước khi siết kế hoạch dinh dưỡng.': 'Average sleep is below 7 hours. Prioritize a consistent sleep schedule before tightening your nutrition plan.',
        'Stress trung bình đang cao. Hãy xem lại trở ngại và thói quen phục hồi trước khi diễn giải thay đổi cân nặng ngắn hạn.': 'Average stress is high. Review obstacles and recovery habits before interpreting short-term weight changes.',
        'Thiếu ngủ và stress cao đang xuất hiện cùng nhau. Hãy tập trung phục hồi và tìm hỗ trợ chuyên môn nếu tình trạng kéo dài.': 'Short sleep and high stress are occurring together. Focus on recovery and seek professional support if this persists.',
        'Rất thấp': 'Very low',
        'Thấp': 'Low',
        'Vừa': 'Moderate',
        'Cao': 'High',
        'Rất cao': 'Very high',
        'Cần chuyên gia': 'Professional review needed',
        'Chưa đủ tin cậy': 'Not enough confidence',
        'FitAI không tự hiệu chỉnh kế hoạch khi hồ sơ có giới hạn sức khỏe cần chuyên gia theo dõi.': 'FitAI does not automatically calibrate plans when the profile has health limitations requiring professional supervision.',
        'Dữ liệu hiện tạo ra TDEE quan sát không hợp lý. Hãy kiểm tra lại khẩu phần và số đo trước khi điều chỉnh.': 'The current data produces an implausible observed TDEE. Check portions and measurements before adjusting.',
        'Giữ nguyên mục tiêu hiện tại và tiếp tục thu thập dữ liệu.': 'Keep the current target and continue collecting data.',
        'Xu hướng thực tế đang phù hợp với kế hoạch.': 'The observed trend is on track with the plan.',
        'Cân nặng đang thay đổi nhanh hơn kế hoạch.': 'Weight is changing faster than planned.',
        'Cân nặng đang thay đổi chậm hơn kế hoạch.': 'Weight is changing slower than planned.',
        'Xu hướng cân nặng đang đi ngược mục tiêu.': 'The weight trend is moving opposite to the goal.',
        'Cân nặng đang lệch khỏi vùng duy trì.': 'Weight is drifting outside the maintenance range.',
        'Đã hoàn thành đánh giá dữ liệu thực tế.': 'Real-world data assessment completed.',
        'Hoàn thiện hồ sơ trước khi FitAI xây dựng lộ trình cá nhân.': 'Complete your profile before FitAI builds a personalized roadmap.',
        'Đang đăng nhập': 'Signing in',
        'Đăng nhập thành công.': 'Signed in successfully.',
        'Đăng ký thành công. Hãy kiểm tra email xác minh.': 'Account created. Check your verification email.',
        'Đăng ký thành công, nhưng chưa gửi được email xác minh. Bạn có thể gửi lại trong Hồ sơ.': 'Account created, but the verification email could not be sent. You can resend it from Profile.',
        'Đã đăng xuất.': 'Signed out.',
        'Vui lòng nhập đầy đủ email và mật khẩu.': 'Enter both email and password.',
        'Email không hợp lệ. Ví dụ: user@example.com.': 'Invalid email. Example: user@example.com.',
        'Mật khẩu phải có ít nhất 6 ký tự.': 'Password must contain at least 6 characters.',
        'Đã gửi lại email xác minh. Hãy kiểm tra cả thư rác.': 'Verification email resent. Check your spam folder too.',
        'Đang tối ưu ảnh để phân tích...': 'Optimizing the image for analysis...',
        'Ảnh đã sẵn sàng. Nhấn “Phân tích ảnh bằng AI” để nhận gợi ý.': 'Image ready. Select “Analyze photo with AI” to get suggestions.',
        'Đang tải khẩu phần và dữ liệu dinh dưỡng USDA...': 'Loading USDA portions and nutrition data...',
        'Không thể tải chi tiết thực phẩm USDA.': 'Unable to load USDA food details.',
        'Máy chủ trả về dữ liệu không hợp lệ. Hãy khởi động lại npm run dev và thử lại.': 'The server returned invalid data. Restart npm run dev and try again.',
        'Đã xác nhận tên món. Hãy nhập khối lượng đã cân rồi tra cứu USDA.': 'Food name confirmed. Enter the measured weight, then search USDA.',
        'AI đang kiểm tra món ăn trong ảnh...': 'AI is analyzing the food in the image...',
        'Không thể phân tích ảnh này.': 'Unable to analyze this image.',
        'Không nhận diện được món ăn. Hãy thử ảnh rõ hơn.': 'The food could not be identified. Try a clearer image.',
        'Độ tin cậy thấp; hãy kiểm tra kỹ hoặc dùng ảnh rõ hơn.': 'Low confidence; verify carefully or use a clearer image.',
        'Độ tin cậy vừa; cần xác nhận trước khi tiếp tục.': 'Medium confidence; confirm before continuing.',
        'Độ tin cậy cao nhưng vẫn cần bạn xác nhận.': 'High confidence, but your confirmation is still required.',
        'Hãy nhập tên món có ít nhất 2 ký tự.': 'Enter a food name with at least 2 characters.',
        'Đang tìm trên USDA FoodData Central...': 'Searching USDA FoodData Central...',
        'Không thể tìm kiếm thực phẩm.': 'Unable to search for food.',
        'Không tìm thấy món phù hợp. Hãy thử tên tổng quát hơn.': 'No matching food found. Try a more general name.',
        'Hãy chọn hôm nay hoặc một ngày trước đó.': 'Choose today or an earlier date.',
        'Cân nặng phải nằm trong khoảng 30–350 kg.': 'Weight must be between 30 and 350 kg.',
        'Đang lưu số đo...': 'Saving measurement...',
        'Không thể lưu cân nặng. Vui lòng thử lại.': 'Unable to save weight. Please try again.',
        'Số bước phải là số nguyên trong khoảng 0–100.000.': 'Steps must be an integer between 0 and 100,000.',
        'Số phút vận động phải nằm trong khoảng 0–1.440.': 'Active minutes must be between 0 and 1,440.',
        'Đang lưu vận động...': 'Saving activity...',
        'Không thể lưu vận động. Vui lòng thử lại.': 'Unable to save activity. Please try again.',
        'Thời gian ngủ phải nằm trong khoảng 0–24 giờ.': 'Sleep duration must be between 0 and 24 hours.',
        'Hãy chọn mức stress từ 1 đến 5.': 'Select a stress level from 1 to 5.',
        'Đang lưu dữ liệu phục hồi...': 'Saving recovery data...',
        'Không thể lưu giấc ngủ và stress. Vui lòng thử lại.': 'Unable to save sleep and stress data. Please try again.',
        'Nhật ký thực phẩm hôm nay': 'Today’s food diary',
        'Đang gửi email đặt lại mật khẩu...': 'Sending password reset email...',
        'Vui lòng nhập địa chỉ email hợp lệ.': 'Enter a valid email address.',
        'Nếu email này có tài khoản, liên kết đặt lại mật khẩu đã được gửi. Hãy kiểm tra hộp thư đến và thư rác.': 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder.',
        'Bạn đã thử quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.': 'Too many attempts. Wait a few minutes and try again.',
        'Hiện chưa thể gửi email đặt lại mật khẩu. Vui lòng thử lại.': 'Unable to send a password reset email right now. Please try again.',
        'FitAI đang chuẩn bị câu trả lời...': 'FitAI is preparing a response...',
        'Không thể nhận câu trả lời từ trợ lý AI.': 'Unable to get a response from the AI assistant.',
        'Kế hoạch này chưa thể được sử dụng an toàn.': 'This plan cannot be used safely yet.',
        'Hãy xem lại các lưu ý an toàn sau.': 'Review the following safety notes.',
        'Không thể tính ước lượng năng lượng. Vui lòng thử lại.': 'Unable to calculate the energy estimate. Please try again.',
        'Hoàn tất và đồng bộ': 'Finish and sync',
        'Không thể xác thực hồ sơ. Vui lòng thử lại.': 'Unable to validate the profile. Please try again.',
        'Không thể đồng bộ hồ sơ. Vui lòng kiểm tra kết nối và thử lại.': 'Unable to sync the profile. Check your connection and try again.',
        'CN': 'SUN',
        'T2': 'MON',
        'T3': 'TUE',
        'T4': 'WED',
        'T5': 'THU',
        'T6': 'FRI',
        'T7': 'SAT',
        'Cân nặng hằng ngày': 'Daily weight',
        'Thêm ít nhất một số đo để bắt đầu biểu đồ.': 'Add at least one measurement to start your chart.',
        'kcal/ngày': 'kcal/day',
        'kg/tuần': 'kg/week'
    });

    const EN_TO_VI = Object.freeze(Object.fromEntries(
        Object.entries(VI_TO_EN).map(([vi, en]) => [en, vi])
    ));
    const DYNAMIC_VI_TO_EN = Object.freeze([
        [/^(\d+)\/4 đã hoàn thành$/, '$1/4 completed'],
        [/^Bạn đã tiến ([\d.]+) kg về phía mục tiêu\.$/, 'You have moved $1 kg toward your target.'],
        [/^Xu hướng mới nhất đang đi lệch mục tiêu ([\d.]+) kg\.$/, 'The latest trend is $1 kg away from the target direction.'],
        [/^Khoảng (\d+) tuần$/, 'About $1 weeks'],
        [/^Dựa trên (\d+) số đo cân nặng và (\d+) ngày ghi món ăn\.$/, 'Based on $1 weight measurements and $2 food-log days.'],
        [/^Giai đoạn (\d+): (.+)$/, (_, number, title) => `Phase ${number}: ${translateText(title, 'en')}`],
        [/^(.+) • (Hoàn thành|Đang thực hiện|Sắp tới)$/, (_, duration, status) => `${translateText(duration, 'en')} • ${translateText(status, 'en')}`],
        [/^Hành động tiếp theo: (.+)$/, (_, action) => `Next action: ${translateText(action, 'en')}`],
        [/^(\d+) kcal\/ngày • Đạm (\d+) g • Tinh bột (\d+) g • Béo (\d+) g • Xơ (\d+) g$/, '$1 kcal/day • Protein $2 g • Carbs $3 g • Fat $4 g • Fiber $5 g'],
        [/^(\d+)\/3\+ số đo cân nặng trong (\d+)\/7\+ ngày • (\d+)\/3\+ ngày ghi món ăn$/, '$1/3+ weight measurements across $2/7+ days • $3/3+ food-log days'],
        [/^Còn khoảng (\d+) tuần$/, 'About $1 weeks remaining'],
        [/^Mới nhất ([\d.]+) kg • Mục tiêu ([\d.]+) kg • Hoàn thành (\d+)%$/, 'Latest $1 kg • Target $2 kg • $3% complete'],
        [/^Đã có (\d+)\/(\d+) số đo, (\d+)\/(\d+) ngày ghi món ăn và (\d+)\/(\d+) ngày theo dõi\.$/, 'Collected $1/$2 measurements, $3/$4 food-log days, and $5/$6 tracking days.'],
        [/^Giữ mục tiêu (\d+) kcal\/ngày và đánh giá lại sau 7 ngày\.$/, 'Keep the $1 kcal/day target and review again after 7 days.'],
        [/^Có thể thử (\d+) kcal\/ngày \(([+-]?\d+) kcal\) trong 7–14 ngày, sau đó đánh giá lại\. Đề xuất này chưa được tự động áp dụng\.$/, 'You may try $1 kcal/day ($2 kcal) for 7–14 days, then review again. This suggestion has not been applied automatically.'],
        [/^Đã lưu ([\d.]+) kg cho ngày (.+)\.$/, 'Saved $1 kg for $2.'],
        [/^Đã lưu ([\d.,]+) bước và (\d+) phút vận động cho ngày (.+)\.$/, 'Saved $1 steps and $2 active minutes for $3.'],
        [/^Đã lưu ([\d.]+) giờ ngủ và mức stress (\d+)\/5 cho ngày (.+)\.$/, 'Saved $1 hours of sleep and stress level $2/5 for $3.']
        ,[/^([+-]?[\d.]+) kg\/tuần$/, '$1 kg/week']
        ,[/^([\d.,]+) kcal\/ngày$/, '$1 kcal/day']
        ,[/^Đã đăng nhập: (.+) — email chưa xác minh$/, 'Signed in: $1 — email not verified']
        ,[/^Đã đăng nhập: (.+)$/, 'Signed in: $1']
        ,[/^Email đã xác minh: (.+)$/, 'Verified email: $1']
        ,[/^Email chưa xác minh: (.+)$/, 'Unverified email: $1']
        ,[/^Không thể kiểm tra dữ liệu hôm nay(?: \((.+)\))?\.$/, 'Unable to check today’s data$1.']
        ,[/^Không thể tải (.+?)(?: \((.+)\))?\.$/, 'Unable to load $1$2.']
        ,[/^Xóa “(.+)” khỏi nhật ký của ngày này\?$/, 'Delete “$1” from this date’s diary?']
        ,[/^Mức vận động quan sát là (.+), còn hồ sơ là (.+)\. Hãy xem lại trước khi đổi mục tiêu năng lượng\.$/, 'Observed activity is $1, while the profile says $2. Review this before changing the calorie target.']
        ,[/^Mức vận động quan sát phù hợp với hồ sơ\. Tiến độ vận động tuần: (\d+)\/150 phút\.$/, 'Observed activity matches the profile. Weekly activity progress: $1/150 minutes.']
        ,[/^Đã tải bản ghi (.+) được xác minh từ USDA\.$/, 'Loaded a verified USDA $1 record.']
        ,[/^Khẩu phần tự nhập — ([\d.]+) g$/, 'Custom serving — $1 g']
        ,[/^Độ tin cậy của gợi ý: (\d+)%\.$/, 'Suggestion confidence: $1%.']
        ,[/^(.+) — độ tin cậy (\d+)%$/, '$1 — $2% confidence']
        ,[/^Tìm thấy (\d+) kết quả USDA đã xác minh\. Hãy chọn bản ghi và khẩu phần gần đúng nhất\.$/, 'Found $1 verified USDA results. Choose the closest record and portion.']
        ,[/^Đã thêm (.+) vào nhật ký\.$/, 'Added $1 to the diary.']
        ,[/^Bạn: (.+)$/, 'You: $1']
    ]);
    const DYNAMIC_EN_TO_VI = Object.freeze([
        [/^You have moved ([\d.]+) kg toward your target\.$/, 'Bạn đã tiến $1 kg về phía mục tiêu.'],
        [/^The latest trend is ([\d.]+) kg away from the target direction\.$/, 'Xu hướng mới nhất đang đi lệch mục tiêu $1 kg.'],
        [/^About (\d+) weeks$/, 'Khoảng $1 tuần'],
        [/^Based on (\d+) weight measurements and (\d+) food-log days\.$/, 'Dựa trên $1 số đo cân nặng và $2 ngày ghi món ăn.'],
        [/^Phase (\d+): (.+)$/, 'Giai đoạn $1: $2'],
        [/^Next action: (.+)$/, 'Hành động tiếp theo: $1']
    ]);

    function normalizeLanguage(value) {
        return value === 'en' ? 'en' : 'vi';
    }

    function translateText(value, language) {
        const match = String(value).match(/^(\s*)(.*?)(\s*)$/s);
        const targetLanguage = normalizeLanguage(language);
        const dictionary = targetLanguage === 'en' ? VI_TO_EN : EN_TO_VI;
        const patterns = targetLanguage === 'en' ? DYNAMIC_VI_TO_EN : DYNAMIC_EN_TO_VI;
        let translated = dictionary[match[2]] || match[2];
        for (const [pattern, replacement] of patterns) {
            if (pattern.test(translated)) {
                translated = translated.replace(pattern, replacement);
                break;
            }
        }
        return `${match[1]}${translated}${match[3]}`;
    }

    function createBrowserController(documentObject, storage) {
        const originalText = new WeakMap();
        const originalAttributes = new WeakMap();
        let language = normalizeLanguage(storage.getItem(STORAGE_KEY));

        function translateNode(node) {
            if (node.nodeType === 3) {
                if (!originalText.has(node)) originalText.set(node, node.nodeValue);
                const translated = translateText(originalText.get(node), language);
                if (node.nodeValue !== translated) node.nodeValue = translated;
                return;
            }
            if (node.nodeType !== 1) return;
            const stored = originalAttributes.get(node) || {};
            ['placeholder', 'aria-label', 'title', 'alt'].forEach((attribute) => {
                if (!node.hasAttribute(attribute)) return;
                if (!(attribute in stored)) stored[attribute] = node.getAttribute(attribute);
                node.setAttribute(attribute, translateText(stored[attribute], language));
            });
            originalAttributes.set(node, stored);
            node.childNodes.forEach(translateNode);
        }

        function updateToggle() {
            const button = documentObject.getElementById('language-toggle');
            if (!button) return;
            button.textContent = language === 'vi' ? 'EN' : 'VI';
            button.setAttribute('aria-label', language === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt');
            button.setAttribute('title', language === 'vi' ? 'English' : 'Tiếng Việt');
        }

        function apply(nextLanguage) {
            language = normalizeLanguage(nextLanguage);
            storage.setItem(STORAGE_KEY, language);
            documentObject.documentElement.lang = language;
            translateNode(documentObject.head);
            translateNode(documentObject.body);
            updateToggle();
            const EventConstructor = documentObject.defaultView?.CustomEvent
                || (typeof CustomEvent !== 'undefined' ? CustomEvent : null);
            if (EventConstructor) {
                documentObject.dispatchEvent(new EventConstructor('fitai:languagechange', {
                    detail: { language }
                }));
            }
            return language;
        }

        function start() {
            apply(language);
            documentObject.getElementById('language-toggle')?.addEventListener('click', () => {
                apply(language === 'vi' ? 'en' : 'vi');
            });
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach(translateNode);
                    if (mutation.type === 'characterData') {
                        const current = mutation.target.nodeValue;
                        const known = originalText.get(mutation.target);
                        if (current !== translateText(known || '', language)) originalText.set(mutation.target, current);
                        translateNode(mutation.target);
                    }
                });
            });
            observer.observe(documentObject.body, { characterData: true, childList: true, subtree: true });
        }

        return { apply, getLanguage: () => language, start };
    }

    const api = { createBrowserController, normalizeLanguage, STORAGE_KEY, translateText, VI_TO_EN };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.FitAII18n = api;
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => createBrowserController(document, localStorage).start());
    }
}(typeof window !== 'undefined' ? window : globalThis));
