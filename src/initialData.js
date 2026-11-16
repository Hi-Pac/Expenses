export const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'طعام وسوبرماركت', budget: 3500, icon: 'Utensils', color: 'emerald' },
  { id: 'cat-2', name: 'فواتير وخدمات منزلية', budget: 1200, icon: 'Home', color: 'blue' },
  { id: 'cat-3', name: 'مواصلات وبنزين', budget: 1500, icon: 'Car', color: 'amber' },
  { id: 'cat-4', name: 'أولاد ومصاريف تعليم', budget: 2500, icon: 'GraduationCap', color: 'indigo' },
  { id: 'cat-5', name: 'صحة وعيادات وأدوية', budget: 800, icon: 'HeartPulse', color: 'rose' },
  { id: 'cat-6', name: 'ترفيه ومطاعم', budget: 1000, icon: 'Coffee', color: 'purple' },
  { id: 'cat-7', name: 'ملابس وعناية شخصية', budget: 1000, icon: 'ShoppingBag', color: 'pink' },
  { id: 'cat-8', name: 'طوارئ ونثريات', budget: 1000, icon: 'ShieldAlert', color: 'slate' },
];

export const PAYMENT_METHODS = [
  'نقداً (كاش)',
  'بطاقة بنكية (Debit)',
  'بطاقة ائتمان (Credit)',
  'محفظة إلكترونية (Smart Wallet)',
  'تحويل بنكي / إنستاباي',
];

export const INITIAL_INCOME = [
  { id: 'inc-1', source: 'الراتب الأساسي', amount: 18000, expected_amount: 18000, date: '2026-11-01', payment_method: 'تحويل بنكي / إنستاباي', notes: 'إيداع شهري' },
  { id: 'inc-2', source: 'عمل حر (Freelance)', amount: 4500, expected_amount: 4000, date: '2026-11-10', payment_method: 'محفظة إلكترونية (Smart Wallet)', notes: 'دفعة مشروع' },
  { id: 'inc-3', source: 'عائد استثمار / إيجار', amount: 2000, expected_amount: 2000, date: '2026-11-15', payment_method: 'تحويل بنكي / إنستاباي', notes: 'عوائد دورية' },
];

export const INITIAL_COMMITMENTS = [
  { id: 'com-1', title: 'تمويل قسط شقة', amount: 3200, due_day: 5, start_date: '2024-01-01', end_date: '2029-12-31', status: 'تم الدفع', notes: 'خصم مباشر' },
  { id: 'com-2', title: 'جمعية الأهل (قبض شهر 4)', amount: 2000, due_day: 10, start_date: '2026-01-01', end_date: '2026-10-31', status: 'تم الدفع', notes: 'إنستاباي' },
  { id: 'com-3', title: 'قسط سيارة', amount: 1800, due_day: 18, start_date: '2025-06-01', end_date: '2028-05-31', status: 'معلق', notes: 'شيك بنكي' },
  { id: 'com-4', title: 'قسط جهاز منزلي', amount: 450, due_day: 25, start_date: '2026-03-01', end_date: '2027-02-28', status: 'معلق', notes: 'فودافون كاش' },
];

export const INITIAL_EXPENSES = [
  { id: 'exp-1', title: 'مشتريات خضار ولحوم الأسبوع الأول', amount: 850, category: 'طعام وسوبرماركت', payment_method: 'نقداً (كاش)', date: '2026-11-02', notes: '' },
  { id: 'exp-2', title: 'فاتورة إنترنت فايبر منزلي', amount: 350, category: 'فواتير وخدمات منزلية', payment_method: 'محفظة إلكترونية (Smart Wallet)', date: '2026-11-03', notes: '' },
  { id: 'exp-3', title: 'تفويل بنزين 95', amount: 420, category: 'مواصلات وبنزين', payment_method: 'بطاقة بنكية (Debit)', date: '2026-11-04', notes: '' },
  { id: 'exp-4', title: 'كتب ومستلزمات مكتبية للمدرسة', amount: 320, category: 'أولاد ومصاريف تعليم', payment_method: 'نقداً (كاش)', date: '2026-11-05', notes: '' },
  { id: 'exp-5', title: 'أدوية وفيتامينات دورية', amount: 280, category: 'صحة وعيادات وأدوية', payment_method: 'بطاقة ائتمان (Credit)', date: '2026-11-07', notes: '' },
  { id: 'exp-6', title: 'عشاء مطعم مع العائلة', amount: 450, category: 'ترفيه ومطاعم', payment_method: 'بطاقة ائتمان (Credit)', date: '2026-11-08', notes: '' },
  { id: 'exp-7', title: 'تسوق جبن وتموين أسبوعي', amount: 310, category: 'طعام وسوبرماركت', payment_method: 'نقداً (كاش)', date: '2026-11-10', notes: '' },
  { id: 'exp-8', title: 'شحن كارت كهرباء', amount: 300, category: 'فواتير وخدمات منزلية', payment_method: 'تحويل بنكي / إنستاباي', date: '2026-11-12', notes: '' },
  { id: 'exp-9', title: 'حلاقة وعناية شخصية', amount: 150, category: 'ملابس وعناية شخصية', payment_method: 'نقداً (كاش)', date: '2026-11-14', notes: '' },
  { id: 'exp-10', title: 'صيانة سباكة طارئة بالمنزل', amount: 220, category: 'طوارئ ونثريات', payment_method: 'نقداً (كاش)', date: '2026-11-15', notes: '' },
];
