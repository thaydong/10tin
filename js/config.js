'use strict';

export const STORAGE_KEY = 'lopHocVuiVeTeal_lop91_v2';
export const GOOGLESHEET_CONFIG_KEY = 'gvcn_googlesheet_config';

export const SUBJECTS = [
  'Ghi chung / Nề nếp', 'Toán', 'Tiếng Việt', 'Tiếng Anh', 'Tự nhiên & Xã hội',
  'Khoa học', 'Lịch sử & Địa lý', 'Tin học', 'Công nghệ', 'Mĩ thuật',
  'Âm nhạc', 'Giáo dục thể chất', 'Đạo đức', 'Hoạt động trải nghiệm',
  'Sinh hoạt lớp', 'Chào cờ'
];

export const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];

export const NAV = [
  ['home', 'fa-house', 'Trang chủ', ''],
  ['classes', 'fa-school', 'Lớp học', ''],
  ['teachers', 'fa-chalkboard-user', 'Giáo viên', ''],
  ['students', 'fa-graduation-cap', 'Học sinh', 'count'],
  ['attendance', 'fa-clipboard-check', 'Điểm danh', ''],
  ['violations', 'fa-triangle-exclamation', 'Vi phạm', ''],
  ['commendations', 'fa-award', 'Tuyên dương', ''],
  ['seating', 'fa-border-all', 'Sơ đồ lớp', ''],
  ['timetable', 'fa-calendar-days', 'Thời khóa biểu', ''],
  ['rewards', 'fa-gift', 'Đổi quà', 'HOT'],
  ['wheel', 'fa-wand-magic-sparkles', 'Vòng quay', 'HOT'],
  ['countdown', 'fa-stopwatch', 'Đếm ngược', ''],
  ['links', 'fa-link', 'Liên kết', ''],
  ['stats', 'fa-chart-column', 'Thống kê', ''],
  ['data', 'fa-database', 'Dữ liệu', ''],
  ['settings', 'fa-gear', 'Cài đặt', '']
];

export const PAGE_META = {
  home: ['Trang chủ', 'Tổng quan nhanh tình hình lớp học hôm nay'],
  classes: ['Quản lý Lớp học', 'Danh sách các lớp, khối lớp và thông tin chung'],
  teachers: ['Danh sách giáo viên', 'Quản lý thông tin và tài khoản giáo viên'],
  students: ['Danh sách học sinh', 'Quản lý thành viên, nề nếp và thưởng xu thi đua'],
  attendance: ['Điểm danh', 'Theo dõi sĩ số, chuyên cần và tình hình đi học hằng ngày'],
  violations: ['Vi phạm', 'Ghi nhận và theo dõi các lỗi vi phạm của học sinh'],
  commendations: ['Tuyên dương & Khen thưởng', 'Ghi nhận thành tích, phát biểu bài và hoạt động tích cực của học sinh'],
  seating: ['Sơ đồ Lớp học', 'Bố trí vị trí chỗ ngồi trực quan và linh hoạt'],
  timetable: ['Thời khóa biểu', 'Thiết lập lịch dạy Sáng/Chiều và các môn học trong tuần'],
  rewards: ['Đổi quà', 'Tạo phần thưởng và đổi quà bằng xu thi đua'],
  wheel: ['Vòng quay may mắn', 'Quay ngẫu nhiên gọi tên học sinh hoặc nhận thưởng'],
  film: ['Cuộn Phim May Mắn', 'Chọn ngẫu nhiên học sinh bằng hiệu ứng cuộn phim'],
  noise: ['Công Cụ Chống Ồn', 'Cảnh báo lớp học, đếm ngược im lặng và đo microphone'],
  countdown: ['Đồng Hồ Đếm Ngược', 'Thiết lập thời gian, mẫu nhanh và chuông báo'],
  links: ['Liên kết hữu ích', 'Lưu học liệu, trang web và đường dẫn dùng chung'],
  stats: ['Báo cáo & Thống kê', 'Biểu đồ phân tích thi đua, nề nếp và xu thưởng'],
  data: ['Quản lý dữ liệu', 'Sao lưu, khôi phục và làm sạch dữ liệu ứng dụng'],
  settings: ['Cài đặt hệ thống', 'Thiết lập hồ sơ giáo viên, cấu hình lớp học & tích hợp Google Sheet']
};

export const WHEEL_EFFECTS = [
  'Xoáy tròn', 'Tung nảy', 'Hút vào tâm', 'Bay theo quỹ đạo', 'Mưa bóng', 'Sân khấu ánh sáng', 'Sóng bồng bềnh'
];

export function today() {
  const d = new Date(), z = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
}

export function uid(p = 'id') {
  return p + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

export function defaultState() {
  const cls = 'class_10ctin';

  return {
    version: 1,
    activeClassId: cls,
    currentPage: 'home',
    teacher: { name: 'Lê Văn Đông', role: 'GVCN', subject: 'Tin học', school: 'Trường THPT Chuyên Lê Thánh Tông', avatar: '', phone: '0905202551' },
    classes: [{ id: cls, name: '10 Chuyên Tin', grade: 'Khối 10', year: '2026 - 2027', color: '#0d9488' }],
    teachers: [],
    students: [
      { id: 'st_1', classId: cls, name: 'Trương Thanh Hải Đăng', gender: 'Nam', coins: 53, avatar: '' },
      { id: 'st_2', classId: cls, name: 'Nguyễn Quang Hiền', gender: 'Nam', coins: 49, avatar: '' },
      { id: 'st_3', classId: cls, name: 'Đặng Ngọc Hưng', gender: 'Nam', coins: 49, avatar: '' },
      { id: 'st_4', classId: cls, name: 'Nguyễn Đình Anh Khoa', gender: 'Nam', coins: 49, avatar: '' },
      { id: 'st_5', classId: cls, name: 'Phạm Hoàng Anh', gender: 'Nam', coins: 45, avatar: '' },
      { id: 'st_6', classId: cls, name: 'Trần Bảo Bảo', gender: 'Nam', coins: 42, avatar: '' },
      { id: 'st_7', classId: cls, name: 'Vũ Quốc Cường', gender: 'Nam', coins: 40, avatar: '' },
      { id: 'st_8', classId: cls, name: 'Bùi Tiến Đạt', gender: 'Nam', coins: 38, avatar: '' },
      { id: 'st_9', classId: cls, name: 'Đỗ Minh Đức', gender: 'Nam', coins: 36, avatar: '' },
      { id: 'st_10', classId: cls, name: 'Lê Hoàng Giang', gender: 'Nữ', coins: 35, avatar: '' },
      { id: 'st_11', classId: cls, name: 'Ngô Thanh Hà', gender: 'Nữ', coins: 32, avatar: '' },
      { id: 'st_12', classId: cls, name: 'Lý Gia Khánh', gender: 'Nam', coins: 30, avatar: '' },
      { id: 'st_13', classId: cls, name: 'Dương Nhật Minh', gender: 'Nam', coins: 28, avatar: '' },
      { id: 'st_14', classId: cls, name: 'Phan Hồng Nam', gender: 'Nam', coins: 25, avatar: '' },
      { id: 'st_15', classId: cls, name: 'Hoàng Văn Phong', gender: 'Nam', coins: 20, avatar: '' }
    ],
    attendance: {},
    attendanceDate: today(),
    violations: {},
    violationsDate: today(),
    seating: { [cls]: { lanes: 4, seats: 16, mode: '2d', assignments: {} } },
    timetable: {
      morning: true, afternoon: true, morningCount: 5, afternoonCount: 5,
      entries: [
        // Thứ Hai (Day 0) - Sáng
        { id: uid('tt'), classId: cls, day: 0, slot: 'S1', subject: 'Chào cờ', time: '07:15 - 08:00' },
        { id: uid('tt'), classId: cls, day: 0, slot: 'S2', subject: 'HĐTN', time: '08:00 - 08:45' },
        { id: uid('tt'), classId: cls, day: 0, slot: 'S3', subject: 'HĐTN', time: '08:45 - 09:30' },
        { id: uid('tt'), classId: cls, day: 0, slot: 'S4', subject: 'Văn', time: '09:30 - 10:15' },
        { id: uid('tt'), classId: cls, day: 0, slot: 'S5', subject: 'Văn', time: '10:15 - 11:00' },
        // Thứ Hai (Day 0) - Chiều
        { id: uid('tt'), classId: cls, day: 0, slot: 'C2', subject: 'T.Dục', time: '14:45 - 15:30' },
        { id: uid('tt'), classId: cls, day: 0, slot: 'C3', subject: 'T.Dục', time: '15:30 - 16:15' },

        // Thứ Ba (Day 1) - Sáng
        { id: uid('tt'), classId: cls, day: 1, slot: 'S1', subject: 'Anh', time: '07:15 - 08:00' },
        { id: uid('tt'), classId: cls, day: 1, slot: 'S2', subject: 'Anh', time: '08:00 - 08:45' },
        { id: uid('tt'), classId: cls, day: 1, slot: 'S3', subject: 'Sử', time: '08:45 - 09:30' },
        { id: uid('tt'), classId: cls, day: 1, slot: 'S4', subject: 'Toán', time: '09:30 - 10:15' },
        { id: uid('tt'), classId: cls, day: 1, slot: 'S5', subject: 'Toán', time: '10:15 - 11:00' },
        // Thứ Ba (Day 1) - Chiều
        { id: uid('tt'), classId: cls, day: 1, slot: 'C2', subject: 'Ti.TA', time: '14:45 - 15:30' },
        { id: uid('tt'), classId: cls, day: 1, slot: 'C3', subject: 'Tin.NC', time: '15:30 - 16:15' },

        // Thứ Tư (Day 2) - Sáng
        { id: uid('tt'), classId: cls, day: 2, slot: 'S1', subject: 'Tin', time: '07:15 - 08:00' },
        { id: uid('tt'), classId: cls, day: 2, slot: 'S2', subject: 'Tin', time: '08:00 - 08:45' },
        { id: uid('tt'), classId: cls, day: 2, slot: 'S3', subject: 'Anh', time: '08:45 - 09:30' },
        { id: uid('tt'), classId: cls, day: 2, slot: 'S4', subject: 'Toán', time: '09:30 - 10:15' },
        { id: uid('tt'), classId: cls, day: 2, slot: 'S5', subject: 'Toán', time: '10:15 - 11:00' },

        // Thứ Năm (Day 3) - Sáng
        { id: uid('tt'), classId: cls, day: 3, slot: 'S1', subject: 'Học tự chọn', time: '07:15 - 08:00' },
        { id: uid('tt'), classId: cls, day: 3, slot: 'S2', subject: 'Học tự chọn', time: '08:00 - 08:45' },
        { id: uid('tt'), classId: cls, day: 3, slot: 'S3', subject: 'Học tự chọn', time: '08:45 - 09:30' },
        { id: uid('tt'), classId: cls, day: 3, slot: 'S4', subject: 'Học tự chọn', time: '09:30 - 10:15' },
        { id: uid('tt'), classId: cls, day: 3, slot: 'S5', subject: 'Học tự chọn', time: '10:15 - 11:00' },

        // Thứ Sáu (Day 4) - Sáng
        { id: uid('tt'), classId: cls, day: 4, slot: 'S1', subject: 'Văn', time: '07:15 - 08:00' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'S2', subject: 'Văn', time: '08:00 - 08:45' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'S3', subject: 'Tin', time: '08:45 - 09:30' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'S4', subject: 'Tin', time: '09:30 - 10:15' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'S5', subject: 'Sinh hoạt', time: '10:15 - 11:00' },
        // Thứ Sáu (Day 4) - Chiều
        { id: uid('tt'), classId: cls, day: 4, slot: 'C2', subject: 'GDĐP', time: '14:45 - 15:30' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'C3', subject: 'GDĐP', time: '15:30 - 16:15' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'C4', subject: 'Q.Phòng', time: '16:15 - 17:00' },
        { id: uid('tt'), classId: cls, day: 4, slot: 'C5', subject: 'Q.Phòng', time: '17:00 - 17:45' }
      ]
    },
    rewards: [],
    redemptions: [],
    transactions: [],
    wheelHistory: [],
    filmHistory: [],
    links: [],
    subjects: SUBJECTS.slice(),
    theme: 'teal',
    settings: { wheelExclude: true, filmExclude: true, tickLast10: false, timerColor: '#0d9488', theme: 'teal' },
    wheelExcluded: [],
    filmExcluded: []
  };
}

