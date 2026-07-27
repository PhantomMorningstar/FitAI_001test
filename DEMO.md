# FitAI — checklist demo

## 1. Trước khi trình bày

Mở PowerShell tại thư mục dự án:

```powershell
cd D:\Test03_Fit
npm install
npm run check
npm test
npm run dev
```

Mở `http://localhost:3000` và nhấn `Ctrl + Shift + R`.

Không trình chiếu hoặc gửi file `.env`. File này chứa khóa Firebase, Gemini và
USDA của máy demo.

## 2. Luồng trình bày đề xuất

1. Đăng nhập bằng tài khoản demo đã xác minh email.
2. Mở **Hồ sơ** và giới thiệu mục tiêu, TDEE, macro và giới hạn sức khỏe.
3. Ghi một số cân nặng mới và chỉ ra xu hướng trung bình 7 ngày.
4. Mở **Máy ảnh**, tải ảnh, xác nhận tên món và nhập khối lượng đã cân.
5. Tra cứu USDA, chọn đúng bản ghi rồi thêm món vào nhật ký.
6. Mở **Nhật ký**, kiểm tra món đúng ngày, sau đó thử sửa khẩu phần.
7. Mở **Lộ trình** để giải thích kế hoạch sử dụng dữ liệu cân nặng thực tế.
8. Trình bày chuyển đổi Việt/Anh và giao diện mobile nếu còn thời gian.

## 3. Dữ liệu nên chuẩn bị

- Một tài khoản demo đã xác minh email.
- Hồ sơ người trưởng thành, không thuộc nhóm chống chỉ định.
- Ít nhất 7–14 ngày cân nặng mẫu để biểu đồ có ý nghĩa.
- Một vài ngày nhật ký thực phẩm.
- Một ảnh món ăn rõ, chỉ có một món chính.
- Một tên USDA dễ tìm: `chicken breast cooked`, `banana raw` hoặc
  `white rice cooked`.

## 4. Nếu dịch vụ ngoài gặp lỗi

- **Gemini lỗi:** nhập tên món bằng tay và tiếp tục tra cứu USDA.
- **USDA lỗi hoặc hết quota:** giải thích đây là dịch vụ ngoài; chuyển sang
  trình bày nhật ký đã chuẩn bị sẵn.
- **Firebase mất mạng:** dùng video hoặc ảnh chụp luồng demo dự phòng.
- **Giao diện còn bản cũ:** nhấn `Ctrl + Shift + R`; nếu cần, xóa Service
  Worker trong DevTools → Application.

## 5. Kiểm tra cuối

- [ ] Không có lỗi đỏ trong Console do FitAI.
- [ ] Đăng nhập và đăng xuất hoạt động.
- [ ] Hồ sơ tải và lưu được.
- [ ] Cân nặng lưu đúng ngày.
- [ ] USDA trả kết quả và món được thêm vào nhật ký.
- [ ] Nhật ký lọc đúng ngày và sửa khẩu phần được.
- [ ] Không mở `.env` trong lúc trình bày.
- [ ] Có video hoặc ảnh demo dự phòng.
