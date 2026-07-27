# Giới hạn và phạm vi an toàn của FitAI

## Giới hạn sức khỏe

- FitAI là công cụ theo dõi và giáo dục, không thay thế bác sĩ hoặc chuyên gia
  dinh dưỡng.
- Không tạo kế hoạch giảm hoặc tăng cân tự động cho người dưới 18 tuổi, thai kỳ,
  cho con bú, tiền sử rối loạn ăn uống hoặc tình trạng cần bác sĩ theo dõi.
- BMI, BMR và TDEE là ước tính quần thể; chúng không đo trực tiếp tỷ lệ mỡ hoặc
  chuyển hóa của một cá nhân.
- Một lần cân có thể thay đổi do nước, muối, glycogen và thời điểm đo. FitAI ưu
  tiên xu hướng và trung bình bảy ngày.
- Không tự động giảm calo chỉ từ một lần cân hoặc một giai đoạn ngắn.

## Giới hạn dữ liệu thực phẩm

- Gemini chỉ hỗ trợ nhận diện tên món nhìn thấy trong ảnh.
- Ảnh không thể xác định chính xác khối lượng, dầu, nước sốt hoặc nguyên liệu bị
  che khuất.
- Người dùng phải xác nhận món và nhập khối lượng đã cân.
- USDA có thể không chứa chính xác mọi món Việt Nam hoặc công thức tự nấu.
- Dữ liệu dinh dưỡng phụ thuộc vào bản ghi USDA được chọn và khẩu phần thực tế.

## Giới hạn kỹ thuật

- Firebase, Gemini và USDA là dịch vụ bên ngoài; kết nối, quota hoặc cấu hình có
  thể tạm thời làm một chức năng không khả dụng.
- PWA lưu app shell để mở giao diện offline nhưng không lưu cache dữ liệu sức
  khỏe, phản hồi AI hoặc kết quả API dinh dưỡng.
- Thông báo cục bộ đáng tin cậy nhất khi trình duyệt hoặc PWA còn được hệ điều
  hành cho phép chạy.
- `localhost` chỉ truy cập trực tiếp trên máy đang chạy server, trừ khi cấu hình
  mạng LAN hoặc triển khai hosting.

## Cách trình bày kết quả đúng

- Dùng từ “ước tính”, “mục tiêu tham khảo” và “xu hướng”.
- Không hứa hẹn số kilogram giảm được trong một thời gian cố định.
- Không kết luận một thực phẩm hay hành vi có khả năng chẩn đoán hoặc chữa bệnh.
- Khuyến nghị gặp chuyên gia khi người dùng thuộc nhóm chống chỉ định hoặc xuất
  hiện dấu hiệu sức khỏe đáng lo ngại.
