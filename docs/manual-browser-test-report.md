# Báo cáo kiểm thử trình duyệt thủ công

- Ngày kiểm thử: 2026-07-25
- Ứng dụng: FitAI
- URL: `http://localhost:3000`
- Trình duyệt: Microsoft Edge
- Người xác nhận kết quả: người dùng dự án
- Kết luận: PASS

## Kết quả

| Phần kiểm tra | Kết quả | Ghi chú |
|---|---|---|
| Desktop | Pass | Giao diện và điều hướng hoạt động |
| Mobile 400×800 | Pass | Giao diện responsive hoạt động |
| Đăng ký | Pass | Tạo tài khoản thành công |
| Đăng nhập | Pass | Phiên đăng nhập hoạt động |
| Đăng xuất | Pass | Giao diện cập nhật đúng sau đăng xuất |
| Nhật ký theo ngày | Pass | Tải và lọc món ăn đúng ngày |
| Cân nặng | Pass | Lưu và tải lại số đo thành công |
| Việc hôm nay | Pass | Tiến độ và ưu tiên cập nhật đúng |
| Thông báo thử | Pass | Notification API và Service Worker hoạt động |
| PWA Offline | Pass | App shell/offline fallback hoạt động |
| Console không lỗi | Pass | Không còn lỗi runtime sau khi sửa Diary |

## Lỗi được phát hiện trong quá trình kiểm thử

Diary từng phát sinh `ReferenceError: data is not defined` khi tạo phần tử món ăn.
Nguyên nhân là đoạn đồng bộ `healthContext` bị đặt nhầm trong
`createFoodDiaryItemElement`. Đoạn mã đã được chuyển về `updateProfileUI` và có
kiểm thử hồi quy để ngăn lỗi tái diễn.

## Xác minh tự động sau sửa lỗi

- `npm run check`: Pass
- `npm test`: 138/138 Pass

## Trạng thái mục tiêu

Mục 7 — Kiểm thử trên trình duyệt thật: **Done**.
