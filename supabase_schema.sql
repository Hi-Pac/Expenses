-- ==========================================================
-- مخطط قاعدة بيانات تطبيق مصروفي (Masroufy Supabase Schema)
-- انسخ هذا الكود بالكامل وضعه في SQL Editor داخل مشروعك على Supabase ثم اضغط RUN
-- ==========================================================

-- 1. جدول الفئات والميزانيات
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  budget NUMERIC NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'ShoppingBag',
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول المصاريف
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول مصادر الدخل
CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الأقساط والجمعيات الشهرية
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'معلق',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل الأمان وسياسات القراءة والكتابة للـ Anon Key
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on income" ON income FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on commitments" ON commitments FOR ALL USING (true) WITH CHECK (true);

-- إدخال بيانات الفئات الأولية
INSERT INTO categories (name, budget, icon, color) VALUES
  ('طعام وسوبرماركت', 3500, 'Utensils', 'emerald'),
  ('فواتير وخدمات منزلية', 1200, 'Home', 'blue'),
  ('مواصلات وبنزين', 1500, 'Car', 'amber'),
  ('أولاد ومصاريف تعليم', 2500, 'GraduationCap', 'indigo'),
  ('صحة وعيادات وأدوية', 800, 'HeartPulse', 'rose'),
  ('ترفيه ومطاعم', 1000, 'Coffee', 'purple'),
  ('ملابس وعناية شخصية', 1000, 'ShoppingBag', 'pink'),
  ('طوارئ ونثريات', 1000, 'ShieldAlert', 'slate')
ON CONFLICT (name) DO NOTHING;
