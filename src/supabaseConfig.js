// =========================================================================
// إعدادات الربط السحابي المباشر مع Supabase (Supabase Configuration)
// =========================================================================
// بمجرد وضع مفتاح anon هنا، سيتصل التطبيق تلقائياً بقاعدة البيانات السحابية 
// من أي جهاز كمبيوتر أو هاتف محمول يفتح الرابط دون الحاجة لأي إعدادات إضافية!
// =========================================================================

export const SUPABASE_CONFIG = {
  // 1. رابط مشروع Supabase الخاص بك:
  url: "https://smkuwngdtqxjbnwfueln.supabase.co",

  // 2. الصق مفتاح anon public بالكامل بين علامتي التنصيص بالأسفل (يبدأ بـ eyJhbG...):
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNta3V3bmdkdHF4amJud2Z1ZWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4NDU4MDksImV4cCI6MjExMDQyMTgwOX0.e6pzOneEIRf0Z_lEf4tbCUyXcKlkpab81KLvmdv61Rs",
};
