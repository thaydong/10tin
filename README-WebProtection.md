# Web Protection

File JavaScript độc lập để hạn chế thao tác người dùng phổ thông trên frontend.

## Mục tiêu

- Có thể nhúng trực tiếp vào website HTML hiện có.
- Không cần React, Vue, Angular hay framework.
- Không yêu cầu sửa cấu trúc HTML hiện tại.
- Phù hợp cho nhiều website khác nhau.

> Frontend JavaScript không thể bảo vệ tuyệt đối mã nguồn đã gửi tới trình duyệt. Đây chỉ là lớp hạn chế thao tác người dùng phổ thông.

## Cách 1 — Website HTML

Thêm vào phần head hoặc trước thẻ đóng body:

```html
<script src="/js/web-protection.js"></script>
```

Hoặc nếu file nằm ở root website:

```html
<script src="/web-protection.js"></script>
```

## Cách 2 — React / Vite

Đặt file vào thư mục public:

```text
public/js/web-protection.js
```

Sau đó thêm vào file HTML gốc hoặc entry HTML của ứng dụng:

```html
<script src="/js/web-protection.js"></script>
```

Nếu bạn muốn dùng trong React với Vite, có thể đặt file trong `public` rồi nhúng như trên. Nếu project đang dùng `index.html`, chỉ cần thêm một thẻ script như ví dụ trên.

## Cách 3 — Website nhiều trang

Chỉ cần nhúng cùng một file JS vào tất cả các trang. Không cần sửa toàn bộ ứng dụng.

## Cấu hình

Bạn có thể cấu hình sau trước khi khởi chạy hoặc bằng API:

```js
const WebProtectionConfig = {
  disableRightClick: true,
  disableDevToolsShortcuts: true,
  disableViewSource: true,
  disableSavePage: true,
  disableDrag: true,
  disableCopy: false,
  detectDevTools: true,
  showWarning: true,
  warningDuration: 1800
};

window.WebProtection.init(WebProtectionConfig);
```

## API công khai

```js
window.WebProtection.init();
window.WebProtection.destroy();
window.WebProtection.enable();
window.WebProtection.disable();
window.WebProtection.getStatus();
```

Ví dụ:

```js
WebProtection.disable();
WebProtection.enable();
console.log(WebProtection.getStatus());
```

Kết quả có dạng:

```js
{
  enabled: true,
  devToolsDetected: false
}
```

## Tính năng chính

- Chặn chuột phải
- Chặn shortcut phát triển DevTools như F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, ...
- Không chặn các tổ hợp quen thuộc trong input như Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+Z, Ctrl+F
- Tùy chọn chặn copy/cut bằng `disableCopy`
- Chặn drag image và kéo/thả không cần thiết
- Phát hiện DevTools với overlay cảnh báo
- Hỗ trợ trên desktop và mobile nhưng không áp dụng phát hiện DevTools trên thiết bị di động

## Lưu ý quan trọng

- Đây chỉ là lớp hạn chế phía frontend, không phải giải pháp bảo mật tuyệt đối.
- Không nên lưu secret trong frontend: API key, token, password admin, database credential, private key, service role key.
- Dữ liệu nhạy cảm phải nằm ở backend/server/Edge Function.

## Ví dụ nhúng nhanh

```html
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Demo</title>
  </head>
  <body>
    <h1>Trang demo</h1>
    <script src="/web-protection.js"></script>
  </body>
</html>
```

## Ghi chú

- Không cố gắng vô hiệu hóa console hoàn toàn.
- Không dùng alert hoặc các kỹ thuật phá hủy trải nghiệm người dùng.
- Mục tiêu là giới hạn thao tác người dùng phổ thông, không làm website mất ổn định.
