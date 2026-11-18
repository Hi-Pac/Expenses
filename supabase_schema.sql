-- ==========================================================
-- مخطط وتحديثات قاعدة بيانات تطبيق مصروفي (Masroufy Supabase Schema)
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

-- 4. جدول الأقساط والجمعيات الشهرية والمستقبلية
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_day INTEGER DEFAULT 15,
  due_date DATE,
  type TEXT DEFAULT 'specific_date',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'معلق',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول طرق الدفع المخصصة (لمزامنتها بين الهاتف والكمبيوتر)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- أوامر تحديث الجداول الحالية في حال كانت موجودة مسبقاً
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'specific_date';

-- تفعيل الأمان وسياسات القراءة والكتابة للـ Anon Key
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read-write on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read-write on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read-write on income" ON income FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read-write on commitments" ON commitments FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read-write on payment_methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
