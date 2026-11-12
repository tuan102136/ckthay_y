# Smart Home IoT

Ứng dụng Flutter điều khiển và theo dõi mô hình Smart Home dùng **ESP32 + DHT22**, **MQTT** và **Supabase**. Dự án phục vụ mô phỏng và thực hành linh kiện; không điều khiển máy lạnh thật.

## Liên kết dự án

- GitHub: [tuan102136/ckthay_y](https://github.com/tuan102136/ckthay_y)
- Mô phỏng Wokwi: [ESP32 Smart Home](https://wokwi.com/projects/480414337988797441)
- Supabase Dashboard: https://supabase.com/dashboard/project/nxecjrkjmtsguoftmgaq
- Supabase API URL: `https://nxecjrkjmtsguoftmgaq.supabase.co`

API URL là địa chỉ để ứng dụng gọi dịch vụ, không phải trang web để mở trực tiếp. Mở URL gốc trong trình duyệt có thể trả về `requested path is invalid`; đó không có nghĩa là API hỏng.

## Chức năng

- Đăng ký/đăng nhập bằng Supabase Auth.
- Quản lý thiết bị trong bảng `public.devices`; dữ liệu được giới hạn theo tài khoản bằng Row Level Security (RLS).
- Nhận nhiệt độ và độ ẩm từ ESP32 qua MQTT.
- Bật/tắt mô hình từ ứng dụng; ESP32 gửi xác nhận lệnh qua MQTT.
- Đèn cảnh báo GPIO2 bật khi mô hình đang bật và nhiệt độ đạt 35°C; tự tắt lại khi nhiệt độ giảm còn 33°C hoặc thấp hơn.

Luồng dữ liệu cảm biến dùng MQTT, không lưu vào bảng Supabase `devices`.

## Chạy nhanh trên máy Windows mới

### 1. Cài các công cụ cần thiết

Để chạy ứng dụng trên Chrome, cài:

1. **Git for Windows**: https://git-scm.com/download/win
2. **Flutter SDK stable**: https://docs.flutter.dev/get-started/install/windows

   Dự án cần Dart `3.8.1` trở lên; Dart được cài kèm Flutter, không cần cài riêng. Sau khi giải nén Flutter, thêm thư mục `flutter\bin` vào `PATH`, rồi mở lại PowerShell.
3. **Google Chrome**: https://www.google.com/chrome/
4. **VS Code** (tùy chọn): https://code.visualstudio.com/

   Nếu dùng VS Code, cài extension **Flutter** (extension này cũng cài Dart).

Kiểm tra cài đặt:

```powershell
flutter --version
flutter doctor
```

Có thể bỏ qua cảnh báo Android/iOS nếu chỉ chạy trên Chrome.

### 2. Tải mã nguồn và dependencies

Mở PowerShell tại thư mục muốn lưu dự án:

```powershell
git clone https://github.com/tuan102136/ckthay_y.git
cd ckthay_y\ck_nhom
flutter pub get
```

Nếu clone ở máy khác hoặc đổi máy, chạy `flutter pub get` để tải lại các package. Không cần sao chép thư mục `build` hay `.dart_tool`.

### 3. Lấy cấu hình Supabase

Dự án hiện dùng Supabase project đã cấu hình sẵn. Đăng nhập vào Dashboard ở phần liên kết phía trên, vào **Project Settings → API Keys**, rồi lấy **publishable key** (hoặc legacy `anon` public key).

> Chỉ dùng publishable/anon key trong ứng dụng. Tuyệt đối không dùng hoặc chia sẻ `service_role`/secret key. Không commit key vào GitHub.

### 4. Chạy ứng dụng trên Chrome

Trong PowerShell, tại thư mục `ckthay_y\ck_nhom`, thay `DAN_PUBLISHABLE_KEY_VAO_DAY` bằng key lấy ở bước trên:

```powershell
flutter run -d chrome --dart-define="SUPABASE_URL=https://nxecjrkjmtsguoftmgaq.supabase.co" --dart-define="SUPABASE_ANON_KEY=DAN_PUBLISHABLE_KEY_VAO_DAY"
```

Giữ cửa sổ PowerShell đang chạy. Flutter sẽ mở ứng dụng trên Chrome; nhấn `q` trong PowerShell để dừng.

Nếu Chrome không được tìm thấy, kiểm tra đã cài Chrome và chạy:

```powershell
flutter devices
```

Có thể dùng Edge thay thế bằng `flutter run -d edge` và giữ nguyên hai tham số `--dart-define`.

## Chạy trên Android

Để chạy trên điện thoại Android hoặc Android Emulator, cài **Android Studio**: https://developer.android.com/studio

1. Trong Android Studio, cài Android SDK và Android SDK Platform-Tools.
2. Chấp nhận giấy phép Android:

   ```powershell
   flutter doctor --android-licenses
   ```

3. Với điện thoại thật, bật **Developer options** và **USB debugging**, kết nối cáp USB, rồi kiểm tra:

   ```powershell
   flutter devices
   ```

4. Chạy, thay `<device-id>` bằng ID hiển thị và thay giá trị key:

   ```powershell
   flutter run -d <device-id> --dart-define="SUPABASE_URL=https://nxecjrkjmtsguoftmgaq.supabase.co" --dart-define="SUPABASE_ANON_KEY=DAN_PUBLISHABLE_KEY_VAO_DAY"
   ```

Lần đầu chạy Android có thể mất vài phút để Gradle tải các thành phần cần thiết. iOS cần máy macOS và Xcode.

## Cơ sở dữ liệu Supabase

Project hiện tại đã có bảng `public.devices`, RLS và Realtime. Không cần chạy lại schema khi chỉ đổi máy tính.

Nếu tạo một Supabase project mới:

1. Mở **SQL Editor** trong Supabase Dashboard.
2. Sao chép và chạy nội dung [`supabase/schema.sql`](supabase/schema.sql).
3. Dùng URL và publishable/anon key của project mới khi chạy app.
4. Nếu đăng ký tài khoản xong chưa đăng nhập được, kiểm tra email xác nhận trong **Authentication → Providers → Email** và xác nhận email theo cài đặt của project.

## Chạy kiểm tra

```powershell
flutter analyze --no-fatal-infos
flutter test
```

Flutter SDK mới có thể in các thông báo `info` về API Flutter đã deprecated; lệnh trên không xem các thông báo mức `info` là lỗi.

## ESP32 và DHT22 ngoài thực tế

### Cần tải

- **Arduino IDE 2**: https://www.arduino.cc/en/software
- ESP32 board package của Espressif trong Arduino IDE → **Boards Manager**.
- Các thư viện trong **Library Manager**:
  - `DHT sensor library` của Adafruit
  - `Adafruit Unified Sensor`
  - `ArduinoJson`
  - `PubSubClient`

### Đấu dây

| Linh kiện | ESP32 |
|---|---|
| DHT22 VCC | 3.3V |
| DHT22 GND | GND |
| DHT22 DATA | GPIO15 |
| LED cảnh báo (nếu không dùng LED tích hợp) | GPIO2 qua điện trở 220–330Ω |

Với DHT22 rời chưa có mạch module, gắn điện trở kéo lên 4.7–10kΩ giữa DATA và 3.3V. Một số module DHT22 đã tích hợp điện trở này.

### Nạp firmware

1. Mở [`firmware/esp32_dht22/esp32_dht22.ino`](firmware/esp32_dht22/esp32_dht22.ino) trong Arduino IDE.
2. Thay `YOUR_WIFI_SSID` và `YOUR_WIFI_PASSWORD` bằng Wi-Fi 2.4GHz của bạn. Không đẩy thông tin Wi-Fi thật lên GitHub.
3. Chọn board ESP32 và cổng USB phù hợp, nhấn **Upload**.
4. Mở Serial Monitor ở baud `115200` để kiểm tra Wi-Fi và MQTT.
5. Đảm bảo máy chạy app và ESP32 cùng có Internet. Bật mô hình trong app để bắt đầu nhận dữ liệu cảm biến.

Firmware dùng device ID `esp32-dht22-01`, gửi dữ liệu mỗi 5 giây tới topic `smarthome/esp32-dht22-01/temperature`; lệnh điều khiển và xác nhận lần lượt dùng các topic `/control` và `/ack`.

Broker HiveMQ công cộng hiện cấu hình trong firmware không yêu cầu xác thực và chỉ phù hợp cho demo. Không dùng broker công cộng này cho hệ thống thực tế; hãy chuyển sang broker riêng có xác thực và TLS.

## Khắc phục lỗi thường gặp

- **`Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY`**: chạy bằng lệnh ở mục Chrome/Android và truyền đủ hai `--dart-define`.
- **Không tải được package**: chạy `flutter pub get`, kiểm tra Internet rồi thử lại.
- **Không thấy Chrome/điện thoại**: chạy `flutter devices`; kiểm tra Chrome, cáp USB, USB debugging và Android SDK.
- **Đăng nhập/đăng ký thất bại**: kiểm tra email, mật khẩu, email xác nhận và đúng Supabase URL/key.
- **Không nhận nhiệt độ/độ ẩm hoặc lệnh không phản hồi**: kiểm tra ESP32 có nguồn, Wi-Fi, dây DHT22, baud Serial Monitor và trạng thái kết nối MQTT.
- **Mở API URL thấy `requested path is invalid`**: bình thường khi mở URL gốc bằng trình duyệt; dùng URL đó trong lệnh chạy app, không coi nó là trang giao diện.

## Cấu trúc chính

```text
lib/                         Ứng dụng Flutter
  auth/                      Đăng nhập và đăng ký Supabase
  Database/                  Model và thao tác bảng devices
  pages/                     Các màn hình
  services/                  MQTT và xử lý dữ liệu cảm biến
firmware/esp32_dht22/         Firmware Arduino cho ESP32 + DHT22
supabase/schema.sql          Schema, RLS policy và Realtime
test/                        Unit/widget tests
```

## Bảo mật

- Không commit Supabase `service_role`/secret key, mật khẩu tài khoản hoặc Wi-Fi thật.
- Chỉ dùng publishable/anon key ở client; quyền truy cập database được bảo vệ bằng RLS.
- Broker MQTT công cộng không đảm bảo riêng tư; dữ liệu demo trên broker có thể được người khác nhìn thấy.
