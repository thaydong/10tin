# Hệ Thống Quản Lý Lớp Học GVCN - Lớp 10 Chuyên Tin

Ứng dụng quản lý lớp học hiện đại, trực quan dành cho Giáo viên Chủ nhiệm (GVCN) với khả năng đồng bộ tự động thời gian thực lên **Google Sheet Database**.

---

## 🚀 Các Bước Đưa Dự Án Lên GitHub & Deploy Vercel

### Bước 1: Khởi Tạo Git & Đẩy Mã Nguồn Lên GitHub

Mở Terminal (PowerShell hoặc Git Bash) tại thư mục dự án và chạy các lệnh sau:

```bash
# 1. Khởi tạo Git repository
git init

# 2. Thêm toàn bộ các tập tin vào staging
git add .

# 3. Tạo commit đầu tiên
git commit -m "Initial commit - GVCN Classroom Management Web App"

# 4. Liên kết với kho lưu trữ trên GitHub (thay URL bằng kho của bạn)
git branch -M main
git remote add origin https://github.com/TÊN_USERNAME_CỦA_BẠN/TÊN_KHO_LƯU_TRỮ.git

# 5. Đẩy mã nguồn lên GitHub
git push -u origin main
```

---

### Bước 2: Triển Khai (Deploy) Lên Vercel

#### Cách 1: Liên kết trực tiếp GitHub với Vercel (Khuyên dùng)
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard) và đăng nhập bằng tài khoản GitHub.
2. Bấm nút **Add New...** > Chọn **Project**.
3. Chọn Repository **gvcn-classroom-management** vừa đẩy lên từ GitHub.
4. Giữ nguyên cấu hình mặc định (Framework Preset: *Other*) và bấm **Deploy**.
5. Vercel sẽ tự động tạo đường dẫn Web công khai (ví dụ: `https://gvcn-classroom.vercel.app`).

#### Cách 2: Deploy nhanh qua Vercel CLI
```bash
# 1. Cài đặt Vercel CLI (nếu chưa có)
npm install -g vercel

# 2. Đăng nhập Vercel
vercel login

# 3. Tiến hành Deploy
vercel --prod
```

---

## 🛠️ Tích Hợp Google Sheet Database

Mã nguồn Apps Script backend đã được chuẩn bị sẵn tại file [`google_script.gs`](google_script.gs). Sau khi tạo Google Sheet mới:
1. Mở **Tiện ích mở rộng (Extensions) > Apps Script**.
2. Dán mã trong `google_script.gs` và nhấn **Triển khai (Deploy) > Triển khai dưới dạng Ứng dụng web (Web App)**.
3. Cấp quyền **Bất kỳ ai (Anyone)** có thể truy cập.
