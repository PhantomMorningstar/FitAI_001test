# Kiến trúc FitAI

## Tổng quan

FitAI là ứng dụng web Node.js sử dụng Express và EJS. Trình duyệt hiển thị giao
diện, Firebase quản lý tài khoản và dữ liệu người dùng, còn backend giữ API key
và thực hiện các phép tính sức khỏe.

```text
Trình duyệt / EJS
        |
        | HTTP / JSON
        v
Express routes
        |
        v
Controllers
        |
        +--> Validators
        |
        +--> Health services
        |
        +--> USDA / Gemini

Trình duyệt <--> Firebase Authentication / Firestore
```

## Trách nhiệm từng khu vực

| Khu vực | Trách nhiệm |
|---|---|
| `server.js` | Nạp biến môi trường và khởi động máy chủ |
| `src/app.js` | Cấu hình Express, middleware và routes |
| `src/routes` | Ánh xạ URL tới controller |
| `src/controllers` | Nhận request và chuẩn hóa response |
| `src/validators` | Kiểm tra hồ sơ trước khi tính toán |
| `src/services` | BMI, BMR, TDEE, macro, an toàn, USDA và Gemini |
| `src/middleware` | Xử lý lỗi, rate limit và bảo mật |
| `views/pages` | Các trang EJS |
| `views/partials` | Thành phần giao diện dùng chung |
| `public/assets/js` | Tương tác trình duyệt, Firebase và biểu đồ |
| `firestore.rules` | Giới hạn dữ liệu theo tài khoản |
| `tests` | Kiểm thử logic, giao diện, API, rules và PWA |

## Luồng Camera

```text
Người dùng tải ảnh
  -> Gemini gợi ý tên món
  -> người dùng xác nhận tên
  -> người dùng nhập khối lượng đã cân
  -> backend tìm USDA
  -> người dùng chọn bản ghi
  -> FitAI lưu món vào nhật ký
```

Gemini không cung cấp calo hoặc tự đo khẩu phần. API key Gemini và USDA chỉ được
đọc tại backend từ `.env`, không được gửi xuống trình duyệt.

## Luồng kế hoạch giảm cân

```text
Hồ sơ hợp lệ
  -> BMI và BMR
  -> TDEE theo mức vận động
  -> mục tiêu calo có giới hạn an toàn
  -> mục tiêu protein, fat, carb và chất xơ
  -> hiệu chỉnh bằng xu hướng cân nặng thực tế
```

Các kiểm tra an toàn có quyền chặn kế hoạch tự động trước khi kết quả được hiển
thị cho người dùng.
