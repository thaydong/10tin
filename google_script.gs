/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT FOR CLASSROOM MANAGEMENT SYSTEM (GVCN - 10 CHUYÊN TIN)
 * ==============================================================================
 * 
 * HƯỚNG DẪN THIẾT LẬP DÀNH CHO GIÁO VIÊN:
 * 1. Mở một Google Sheet trống trên Google Drive.
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Dán toàn bộ đoạn mã này vào tập tin Code.gs (thay thế mã cũ).
 * 4. Chạy hàm "autoSetupDatabase" 1 lần duy nhất bằng cách chọn hàm ở menu trên cùng rồi bấm nút "► Run".
 *    (Cấp quyền truy cập nếu Google hỏi xác nhận bảo mật).
 * 5. Bấm nút "Triển khai" (Deploy) > "Mới triển khai" (New deployment).
 * 6. Loại triển khai: Chọn "Ứng dụng web" (Web App).
 *    - Mô tả: GVCN Database API
 *    - Thực thi dưới dạng (Execute as): Tôi (Me)
 *    - Ai có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 * 7. Bấm "Triển khai" và sao chép "URL ứng dụng web" (Web App URL).
 * 8. Dán Web App URL này vào phần "Cài đặt hệ thống" của ứng dụng web.
 * ==============================================================================
 */

// Hàm tự động khởi tạo toàn bộ 10 Sheet (bảng dữ liệu) với tiêu đề cột được định dạng chuẩn
function autoSetupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const tables = [
    {
      name: "AppState",
      headers: ["ID", "JSON_State", "Updated_At"]
    },
    {
      name: "Classes",
      headers: ["ID", "Name", "Grade", "Year", "Color"]
    },
    {
      name: "Teachers",
      headers: ["ID", "Name", "Subject", "Phone", "Role", "School", "Avatar"]
    },
    {
      name: "Students",
      headers: ["ID", "Class_ID", "Name", "Gender", "Coins", "Avatar", "Favorite", "Note"]
    },
    {
      name: "Attendance",
      headers: ["Date", "Class_ID", "Student_ID", "Student_Name", "Status", "Status_Label"]
    },
    {
      name: "Violations",
      headers: ["Date", "Class_ID", "Student_ID", "Student_Name", "Violation_Type", "Violation_Name"]
    },
    {
      name: "Commendations",
      headers: ["Date", "Class_ID", "Student_ID", "Student_Name", "Commendation_Type", "Commendation_Name", "Bonus_Coins"]
    },
    {
      name: "Timetable",
      headers: ["ID", "Class_ID", "Day", "Slot", "Subject", "Time"]
    },
    {
      name: "Rewards",
      headers: ["ID", "Name", "Cost", "Emoji", "Stock"]
    },
    {
      name: "Transactions",
      headers: ["ID", "Class_ID", "Student_ID", "Student_Name", "Amount", "Reason", "Subject", "Time"]
    },
    {
      name: "Links",
      headers: ["ID", "Name", "URL", "Category", "Description", "Pinned"]
    }
  ];

  tables.forEach(table => {
    let sheet = ss.getSheetByName(table.name);
    if (!sheet) {
      sheet = ss.insertSheet(table.name);
    } else {
      sheet.clear();
    }
    
    // Tạo hàng tiêu đề
    sheet.appendRow(table.headers);
    
    // Định dạng tiêu đề cột
    const headerRange = sheet.getRange(1, 1, 1, table.headers.length);
    headerRange.setBackground("#0d9488");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Roboto");
    sheet.setFrozenRows(1);
  });

  // Xóa Sheet1 mặc định nếu có
  const defaultSheet = ss.getSheetByName("Sheet1") || ss.getSheetByName("Trang tính1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Điền dữ liệu mặc định Thời khóa biểu Lớp 10 Chuyên Tin (Trường THPT Chuyên Lê Thánh Tông)
  const ttSheet = ss.getSheetByName("Timetable");
  if (ttSheet) {
    const cls = "class_10ctin";
    const defaultLessons = [
      // Thứ Hai (Day 0) - Sáng
      ["tt_s1_t2", cls, 0, "S1", "Chào cờ", "07:15 - 08:00"],
      ["tt_s2_t2", cls, 0, "S2", "HĐTN", "08:00 - 08:45"],
      ["tt_s3_t2", cls, 0, "S3", "HĐTN", "08:45 - 09:30"],
      ["tt_s4_t2", cls, 0, "S4", "Văn", "09:30 - 10:15"],
      ["tt_s5_t2", cls, 0, "S5", "Văn", "10:15 - 11:00"],
      // Thứ Hai (Day 0) - Chiều
      ["tt_c2_t2", cls, 0, "C2", "T.Dục", "14:45 - 15:30"],
      ["tt_c3_t2", cls, 0, "C3", "T.Dục", "15:30 - 16:15"],

      // Thứ Ba (Day 1) - Sáng
      ["tt_s1_t3", cls, 1, "S1", "Anh", "07:15 - 08:00"],
      ["tt_s2_t3", cls, 1, "S2", "Anh", "08:00 - 08:45"],
      ["tt_s3_t3", cls, 1, "S3", "Sử", "08:45 - 09:30"],
      ["tt_s4_t3", cls, 1, "S4", "Toán", "09:30 - 10:15"],
      ["tt_s5_t3", cls, 1, "S5", "Toán", "10:15 - 11:00"],
      // Thứ Ba (Day 1) - Chiều
      ["tt_c2_t3", cls, 1, "C2", "Ti.TA", "14:45 - 15:30"],
      ["tt_c3_t3", cls, 1, "C3", "Tin.NC", "15:30 - 16:15"],

      // Thứ Tư (Day 2) - Sáng
      ["tt_s1_t4", cls, 2, "S1", "Tin", "07:15 - 08:00"],
      ["tt_s2_t4", cls, 2, "S2", "Tin", "08:00 - 08:45"],
      ["tt_s3_t4", cls, 2, "S3", "Anh", "08:45 - 09:30"],
      ["tt_s4_t4", cls, 2, "S4", "Toán", "09:30 - 10:15"],
      ["tt_s5_t4", cls, 2, "S5", "Toán", "10:15 - 11:00"],

      // Thứ Năm (Day 3) - Sáng
      ["tt_s1_t5", cls, 3, "S1", "Học tự chọn", "07:15 - 08:00"],
      ["tt_s2_t5", cls, 3, "S2", "Học tự chọn", "08:00 - 08:45"],
      ["tt_s3_t5", cls, 3, "S3", "Học tự chọn", "08:45 - 09:30"],
      ["tt_s4_t5", cls, 3, "S4", "Học tự chọn", "09:30 - 10:15"],
      ["tt_s5_t5", cls, 3, "S5", "Học tự chọn", "10:15 - 11:00"],

      // Thứ Sáu (Day 4) - Sáng
      ["tt_s1_t6", cls, 4, "S1", "Văn", "07:15 - 08:00"],
      ["tt_s2_t6", cls, 4, "S2", "Văn", "08:00 - 08:45"],
      ["tt_s3_t6", cls, 4, "S3", "Tin", "08:45 - 09:30"],
      ["tt_s4_t6", cls, 4, "S4", "Tin", "09:30 - 10:15"],
      ["tt_s5_t6", cls, 4, "S5", "Sinh hoạt", "10:15 - 11:00"],
      // Thứ Sáu (Day 4) - Chiều
      ["tt_c2_t6", cls, 4, "C2", "GDĐP", "14:45 - 15:30"],
      ["tt_c3_t6", cls, 4, "C3", "GDĐP", "15:30 - 16:15"],
      ["tt_c4_t6", cls, 4, "C4", "Q.Phòng", "16:15 - 17:00"],
      ["tt_c5_t6", cls, 4, "C5", "Q.Phòng", "17:00 - 17:45"]
    ];
    defaultLessons.forEach(row => ttSheet.appendRow(row));
  }

  Logger.log("✅ Đã khởi tạo hoàn tất cấu trúc Cơ sở dữ liệu 10 Bảng cho GVCN!");
  // SpreadsheetApp.getUi().alert("✅ Đã tự động tạo và định dạng xong 10 Bảng dữ liệu Google Sheet!");
}

// Endpoint GET: Tải dữ liệu JSON State từ Google Sheet
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("AppState");
    
    if (!sheet) {
      return responseJSON({ status: "error", message: "Sheet AppState chưa được khởi tạo. Vui lòng chạy autoSetupDatabase." });
    }

    const data = sheet.getDataRange().getValues();
    let jsonState = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === "default_state") {
        jsonState = data[i][1];
        break;
      }
    }

    if (jsonState) {
      const parsed = typeof jsonState === "string" ? JSON.parse(jsonState) : jsonState;
      return responseJSON({ status: "success", state: parsed });
    } else {
      return responseJSON({ status: "empty", state: null });
    }
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

// Endpoint POST: Lưu đồng bộ JSON State và giải nén dữ liệu vào từng Sheet
function doPost(e) {
  try {
    let rawStr = "";
    if (e && e.postData && e.postData.contents) {
      rawStr = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      rawStr = e.parameter.data;
    }

    if (!rawStr) {
      return responseJSON({ status: "error", message: "Không tìm thấy dữ liệu POST" });
    }

    let payload;
    if (typeof rawStr === "string") {
      payload = JSON.parse(rawStr);
    } else {
      payload = rawStr;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return responseJSON({ status: "error", message: "Không tìm thấy Google Sheet liên kết. Hãy đảm bảo bạn tạo Apps Script từ menu 'Tiện ích mở rộng > Apps Script' trực tiếp bên trong Google Sheet." });
    }
    
    // 1. Lưu JSON State đầy đủ vào sheet AppState
    let appStateSheet = getOrCreateSheet(ss, "AppState", ["ID", "JSON_State", "Updated_At"]);

    const now = new Date().toISOString();
    const jsonStr = JSON.stringify(payload);
    
    const rows = appStateSheet.getDataRange().getValues();
    let foundIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === "default_state") {
        foundIndex = i + 1;
        break;
      }
    }

    if (foundIndex > 0) {
      appStateSheet.getRange(foundIndex, 2).setValue(jsonStr);
      appStateSheet.getRange(foundIndex, 3).setValue(now);
    } else {
      appStateSheet.appendRow(["default_state", jsonStr, now]);
    }

    // 2. Giải nén dữ liệu vào các Sheet tương ứng để Giáo viên dễ dàng xem trực tiếp
    syncRelationalTables(ss, payload);

    return responseJSON({ status: "success", updated_at: now });
  } catch (err) {
    Logger.log("Lỗi doPost: " + err.toString());
    return responseJSON({ status: "error", message: err.toString() });
  }
}

// Hàm đồng bộ chi tiết ra các Bảng phụ
function syncRelationalTables(ss, state) {
  try {
    // 1. Classes
    const classesSheet = getOrCreateSheet(ss, "Classes", ["ID", "Name", "Grade", "Year", "Color"]);
    if (classesSheet && Array.isArray(state.classes)) {
      clearRowsKeepHeader(classesSheet);
      state.classes.forEach(c => {
        classesSheet.appendRow([c.id || "", c.name || "", c.grade || "", c.year || "", c.color || ""]);
      });
    }

    // 2. Teachers
    const teachersSheet = getOrCreateSheet(ss, "Teachers", ["ID", "Name", "Subject", "Phone", "Role", "School", "Avatar"]);
    if (teachersSheet && Array.isArray(state.teachers)) {
      clearRowsKeepHeader(teachersSheet);
      state.teachers.forEach(t => {
        teachersSheet.appendRow([t.id || "", t.name || "", t.subject || "", t.phone || "", t.role || "", t.school || "", t.avatar ? "[Base64 Image]" : ""]);
      });
    }

    // 3. Students
    const studentsSheet = getOrCreateSheet(ss, "Students", ["ID", "Class_ID", "Name", "Gender", "Coins", "Avatar", "Favorite", "Note"]);
    if (studentsSheet && Array.isArray(state.students)) {
      clearRowsKeepHeader(studentsSheet);
      state.students.forEach(s => {
        studentsSheet.appendRow([s.id || "", s.classId || "", s.name || "", s.gender || "", s.coins || 0, s.avatar ? "[Base64 Image]" : "", s.favorite ? "Có" : "Không", s.note || ""]);
      });
    }

    // 4. Timetable
    const timetableSheet = getOrCreateSheet(ss, "Timetable", ["ID", "Class_ID", "Day", "Slot", "Subject", "Time"]);
    if (timetableSheet && state.timetable && Array.isArray(state.timetable.entries)) {
      clearRowsKeepHeader(timetableSheet);
      state.timetable.entries.forEach(tt => {
        timetableSheet.appendRow([tt.id || "", tt.classId || "", tt.day ?? "", tt.slot || "", tt.subject || "", tt.time || ""]);
      });
    }

    // 5. Rewards
    const rewardsSheet = getOrCreateSheet(ss, "Rewards", ["ID", "Name", "Cost", "Emoji", "Stock"]);
    if (rewardsSheet && Array.isArray(state.rewards)) {
      clearRowsKeepHeader(rewardsSheet);
      state.rewards.forEach(r => {
        rewardsSheet.appendRow([r.id || "", r.name || "", r.cost || 0, r.emoji || "", r.stock || 0]);
      });
    }

    // 6. Transactions
    const txSheet = getOrCreateSheet(ss, "Transactions", ["ID", "Class_ID", "Student_ID", "Student_Name", "Amount", "Reason", "Subject", "Time"]);
    if (txSheet && Array.isArray(state.transactions)) {
      clearRowsKeepHeader(txSheet);
      state.transactions.slice(0, 500).forEach(tx => {
        txSheet.appendRow([tx.id || "", tx.classId || "", tx.studentId || "", tx.studentName || "", tx.amount || 0, tx.reason || "", tx.subject || "", tx.time || ""]);
      });
    }

    // 7. Links
    const linksSheet = getOrCreateSheet(ss, "Links", ["ID", "Name", "URL", "Category", "Description", "Pinned"]);
    if (linksSheet && Array.isArray(state.links)) {
      clearRowsKeepHeader(linksSheet);
      state.links.forEach(l => {
        linksSheet.appendRow([l.id || "", l.name || "", l.url || "", l.category || "", l.desc || l.description || "", l.pinned ? "Có" : "Không"]);
      });
    }

    // Map student ID to student name
    const studentMap = {};
    if (Array.isArray(state.students)) {
      state.students.forEach(s => { if (s.id) studentMap[s.id] = s.name; });
    }

    // 8. Attendance
    const attendanceSheet = getOrCreateSheet(ss, "Attendance", ["Date", "Class_ID", "Student_ID", "Student_Name", "Status", "Status_Label"]);
    if (attendanceSheet && state.attendance && typeof state.attendance === "object") {
      clearRowsKeepHeader(attendanceSheet);
      const statusLabels = { present: 'Có mặt', late: 'Đi muộn', excused: 'Nghỉ có phép', unexcused: 'Nghỉ không phép' };
      Object.entries(state.attendance).forEach(([key, attMap]) => {
        const lastIdx = key.lastIndexOf("_");
        if (lastIdx > 0) {
          const classId = key.substring(0, lastIdx);
          const dateStr = key.substring(lastIdx + 1);
          if (attMap && typeof attMap === "object") {
            Object.entries(attMap).forEach(([sid, status]) => {
              const sName = studentMap[sid] || sid;
              const sLabel = statusLabels[status] || status;
              attendanceSheet.appendRow([dateStr, classId, sid, sName, status, sLabel]);
            });
          }
        }
      });
    }

    // 9. Violations
    const violationsSheet = getOrCreateSheet(ss, "Violations", ["Date", "Class_ID", "Student_ID", "Student_Name", "Violation_Type", "Violation_Name"]);
    if (violationsSheet && state.violations && typeof state.violations === "object") {
      clearRowsKeepHeader(violationsSheet);
      const violationLabels = {
        late: 'Đi học trễ',
        no_lesson: 'Không thuộc bài',
        no_hw: 'Không làm bài',
        no_supplies: 'Không mang dụng cụ học tập',
        no_uniform: 'Không đồng phục',
        no_duty: 'Không trực nhật'
      };
      Object.entries(state.violations).forEach(([key, viosMap]) => {
        const lastIdx = key.lastIndexOf("_");
        if (lastIdx > 0) {
          const classId = key.substring(0, lastIdx);
          const dateStr = key.substring(lastIdx + 1);
          if (viosMap && typeof viosMap === "object") {
            Object.entries(viosMap).forEach(([sid, viosObj]) => {
              if (viosObj && typeof viosObj === "object") {
                Object.entries(viosObj).forEach(([vioId, isVio]) => {
                  if (isVio) {
                    const sName = studentMap[sid] || sid;
                    const vName = violationLabels[vioId] || vioId;
                    violationsSheet.appendRow([dateStr, classId, sid, sName, vioId, vName]);
                  }
                });
              }
            });
          }
        }
      });
    }

    // 10. Commendations
    const commendationsSheet = getOrCreateSheet(ss, "Commendations", ["Date", "Class_ID", "Student_ID", "Student_Name", "Commendation_Type", "Commendation_Name", "Bonus_Coins"]);
    if (commendationsSheet && state.commendations && typeof state.commendations === "object") {
      clearRowsKeepHeader(commendationsSheet);
      const commendationLabels = {
        speech: 'Phát biểu xây dựng bài',
        lesson: 'Học thuộc bài',
        homework: 'Có chuẩn bị bài tập nhà',
        activities: 'Tham gia tốt các hoạt động'
      };
      Object.entries(state.commendations).forEach(([key, comsMap]) => {
        const lastIdx = key.lastIndexOf("_");
        if (lastIdx > 0) {
          const classId = key.substring(0, lastIdx);
          const dateStr = key.substring(lastIdx + 1);
          if (comsMap && typeof comsMap === "object") {
            Object.entries(comsMap).forEach(([sid, comsObj]) => {
              if (comsObj && typeof comsObj === "object") {
                Object.entries(comsObj).forEach(([cId, isCom]) => {
                  if (isCom) {
                    const sName = studentMap[sid] || sid;
                    const cName = commendationLabels[cId] || cId;
                    commendationsSheet.appendRow([dateStr, classId, sid, sName, cId, cName, 3]);
                  }
                });
              }
            });
          }
        }
      });
    }
  } catch (e) {
    Logger.log("Lỗi đồng bộ bảng phụ: " + e.toString());
  }
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0d9488");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setFontFamily("Roboto");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clearRowsKeepHeader(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
