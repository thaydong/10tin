-- ==============================================================================
-- SUPABASE DATABASE SCHEMA FOR CLASSROOM 9/1 (GVCN)
-- Coi như tập tin SQL hướng dẫn thiết lập bảng lưu trữ dữ liệu lớp học trực tuyến
-- ==============================================================================

-- 1. Tạo bảng classroom_state lưu trữ JSON State toàn bộ ứng dụng
CREATE TABLE IF NOT EXISTS public.classroom_state (
    id TEXT PRIMARY KEY DEFAULT 'default_state',
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Đặt comment cho bảng
COMMENT ON TABLE public.classroom_state IS 'Bảng lưu trữ toàn bộ dữ liệu ứng dụng Quản lý Lớp học GVCN';

-- 3. Bật Row Level Security (RLS) để bảo vệ dữ liệu
ALTER TABLE public.classroom_state ENABLE ROW LEVEL SECURITY;

-- 4. Tạo Policy cho phép truy cập đọc/ghi công khai (hoặc qua Anon Key)
CREATE POLICY "Public Read Access"
ON public.classroom_state
FOR SELECT
USING (true);

CREATE POLICY "Public Write Access"
ON public.classroom_state
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Cho phép cấp quyền trực tiếp cho vai trò anon và authenticated
GRANT ALL ON public.classroom_state TO anon;
GRANT ALL ON public.classroom_state TO authenticated;
