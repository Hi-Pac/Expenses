import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, TrendingUp, AlertTriangle, CreditCard, Calendar, Plus, CheckCircle2, 
  Trash2, Settings, ArrowDownRight, ArrowUpRight, ShieldAlert, Sparkles, 
  RefreshCw, Smartphone, DollarSign, PieChart, Clock, ExternalLink, HelpCircle,
  Utensils, Home, Car, GraduationCap, HeartPulse, Coffee, ShoppingBag, Check, X
} from 'lucide-react';
import { getSupabaseClient, resetSupabaseClient, sanitizeSupabaseUrl } from './supabaseClient';
import { 
  INITIAL_CATEGORIES, INITIAL_EXPENSES, INITIAL_INCOME, 
  INITIAL_COMMITMENTS, PAYMENT_METHODS 
} from './initialData';

// Helper to generate Supabase-compatible UUIDs
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 compliant UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'expenses' | 'commitments' | 'income' | 'settings'
  
  // Data State
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('masroufy_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('masroufy_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [income, setIncome] = useState(() => {
    const saved = localStorage.getItem('masroufy_income');
    return saved ? JSON.parse(saved) : INITIAL_INCOME;
  });

  const [commitments, setCommitments] = useState(() => {
    const saved = localStorage.getItem('masroufy_commitments');
    return saved ? JSON.parse(saved) : INITIAL_COMMITMENTS;
  });

  // Supabase Configuration State
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    const raw = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    return sanitizeSupabaseUrl(raw);
  });
  const [supabaseKey, setSupabaseKey] = useState(() => {
    return localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  });
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState(''); // 'idle' | 'syncing' | 'success' | 'error'
  const [connectionMessage, setConnectionMessage] = useState('');

  // Modals & Forms
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [smartInputText, setSmartInputText] = useState('');

  // Form States
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: categories[0]?.name || 'طعام وسوبرماركت',
    payment_method: PAYMENT_METHODS[0],
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    expected_amount: '',
    payment_method: PAYMENT_METHODS[4],
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [newCommitment, setNewCommitment] = useState({
    title: '',
    amount: '',
    due_day: 15,
    status: 'معلق',
    notes: '',
  });

  // Save to LocalStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('masroufy_categories', JSON.stringify(categories));
    localStorage.setItem('masroufy_expenses', JSON.stringify(expenses));
    localStorage.setItem('masroufy_income', JSON.stringify(income));
    localStorage.setItem('masroufy_commitments', JSON.stringify(commitments));
  }, [categories, expenses, income, commitments]);

  // Check Supabase connection on load
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsCloudConnected(false);
      return;
    }
    setSyncStatus('syncing');
    try {
      // Use a simple GET query
      const { data, error } = await client.from('categories').select('*').limit(1);
      if (error) {
        throw error;
      }
      setIsCloudConnected(true);
      setSyncStatus('success');
      setConnectionMessage('✅ متصل بالسحابة (Supabase) وجاهز للمزامنة');
      setTimeout(() => setSyncStatus(''), 3000);

      // Auto-sync data if cloud has entries
      loadDataFromCloud(client);
    } catch (err) {
      console.warn('Supabase test connection failed:', err);
      setIsCloudConnected(false);
      setSyncStatus('error');
      setConnectionMessage(`⚠️ فشل الاتصال: ${err.message || 'تأكد من صحة الرابط والمفتاح'}`);
    }
  };

  const loadDataFromCloud = async (clientInstance) => {
    const client = clientInstance || getSupabaseClient();
    if (!client) return;

    try {
      const [catRes, expRes, incRes, comRes] = await Promise.all([
        client.from('categories').select('*').order('created_at', { ascending: true }),
        client.from('expenses').select('*').order('date', { ascending: false }),
        client.from('income').select('*').order('date', { ascending: false }),
        client.from('commitments').select('*').order('due_day', { ascending: true }),
      ]);

      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (expRes.data && expRes.data.length > 0) setExpenses(expRes.data);
      if (incRes.data && incRes.data.length > 0) setIncome(incRes.data);
      if (comRes.data && comRes.data.length > 0) setCommitments(comRes.data);
    } catch (e) {
      console.warn('Error loading data from cloud:', e);
    }
  };

  const syncWithSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert('يرجى حفظ رابط Supabase ومفتاح Anon Key أولاً في صفحة الإعدادات!');
      return;
    }
    setSyncStatus('syncing');
    try {
      await loadDataFromCloud(client);
      setIsCloudConnected(true);
      setSyncStatus('success');
      alert('✅ تمت المزامنة بنجاح مع جداول Supabase!');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      alert(`⚠️ تعذرت المزامنة: ${err.message || 'تأكد من المفاتيح'}`);
    }
  };

  // Financial Calculations
  const totalIncome = useMemo(() => {
    return income.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [income]);

  const totalCommitments = useMemo(() => {
    return commitments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [commitments]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const netLiquidity = totalIncome - (totalCommitments + totalExpenses);
  const savingsRate = totalIncome > 0 ? ((netLiquidity / totalIncome) * 100).toFixed(1) : 0;

  // Safe Daily Spend Calculation
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const safeDailySpend = netLiquidity > 0 ? (netLiquidity / remainingDays).toFixed(0) : 0;

  // Spending per category
  const categorySpending = useMemo(() => {
    const map = {};
    categories.forEach(c => { map[c.name] = 0; });
    expenses.forEach(e => {
      if (map[e.category] !== undefined) {
        map[e.category] += Number(e.amount) || 0;
      } else {
        map[e.category] = Number(e.amount) || 0;
      }
    });
    return map;
  }, [categories, expenses]);

  // Natural Language Smart Input Parser
  const parseSmartInput = (text) => {
    if (!text.trim()) return;
    const parts = text.trim().split(/\s+/);
    let detectedAmount = '';
    let detectedCategory = '';
    let detectedMethod = PAYMENT_METHODS[0];

    for (const part of parts) {
      const num = parseFloat(part);
      if (!isNaN(num) && num > 0) {
        detectedAmount = num.toString();
        break;
      }
    }

    const lower = text.toLowerCase();
    if (lower.includes('طعام') || lower.includes('اكل') || lower.includes('سوبرماركت') || lower.includes('خضار') || lower.includes('لحم') || lower.includes('تموين')) {
      detectedCategory = 'طعام وسوبرماركت';
    } else if (lower.includes('بنزين') || lower.includes('تاكسي') || lower.includes('اوبر') || lower.includes('مواصلات') || lower.includes('زيت')) {
      detectedCategory = 'مواصلات وبنزين';
    } else if (lower.includes('كهرباء') || lower.includes('نت') || lower.includes('فايبر') || lower.includes('غاز') || lower.includes('فاتورة')) {
      detectedCategory = 'فواتير وخدمات منزلية';
    } else if (lower.includes('دواء') || lower.includes('صيدلية') || lower.includes('كشف') || lower.includes('دكتور')) {
      detectedCategory = 'صحة وعيادات وأدوية';
    } else if (lower.includes('مطعم') || lower.includes('قهوة') || lower.includes('خروج') || lower.includes('سينما') || lower.includes('كافيه')) {
      detectedCategory = 'ترفيه ومطاعم';
    } else if (lower.includes('مدرسة') || lower.includes('درس') || lower.includes('كتب') || lower.includes('ولد')) {
      detectedCategory = 'أولاد ومصاريف تعليم';
    } else if (lower.includes('لبس') || lower.includes('حلاقة') || lower.includes('شوبينج')) {
      detectedCategory = 'ملابس وعناية شخصية';
    } else {
      detectedCategory = categories[0]?.name || 'طعام وسوبرماركت';
    }

    if (lower.includes('فيزا') || lower.includes('ديبت') || lower.includes('كارت')) {
      detectedMethod = 'بطاقة بنكية (Debit)';
    } else if (lower.includes('كريديت') || lower.includes('ائتمان')) {
      detectedMethod = 'بطاقة ائتمان (Credit)';
    } else if (lower.includes('محفظة') || lower.includes('فودافون') || lower.includes('كاش')) {
      if (lower.includes('فودافون') || lower.includes('محفظة')) {
        detectedMethod = 'محفظة إلكترونية (Smart Wallet)';
      } else {
        detectedMethod = 'نقداً (كاش)';
      }
    } else if (lower.includes('تحويل') || lower.includes('انستاباي') || lower.includes('إنستاباي')) {
      detectedMethod = 'تحويل بنكي / إنستاباي';
    }

    setNewExpense({
      ...newExpense,
      title: text,
      amount: detectedAmount || newExpense.amount,
      category: detectedCategory,
      payment_method: detectedMethod,
    });
  };

  // Add Expense Handler
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    
    const item = {
      id: generateUUID(),
      title: newExpense.title,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      payment_method: newExpense.payment_method,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      notes: newExpense.notes || '',
    };
    
    setExpenses([item, ...expenses]);

    // Push to Supabase
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('expenses').insert([item]);
        if (error) {
          console.error('Supabase expense insert error:', error);
          alert(`⚠️ تم الحفظ محلياً لكن حدث خطأ في المزامنة السحابية: ${error.message}`);
        } else {
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.error('Cloud insert error:', err);
      }
    }

    setNewExpense({
      title: '',
      amount: '',
      category: categories[0]?.name || 'طعام وسوبرماركت',
      payment_method: PAYMENT_METHODS[0],
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSmartInputText('');
    setShowAddExpense(false);
  };

  // Add Income Handler
  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!newIncome.source || !newIncome.amount) return;
    
    const item = {
      id: generateUUID(),
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      expected_amount: parseFloat(newIncome.expected_amount || newIncome.amount),
      payment_method: newIncome.payment_method,
      date: newIncome.date || new Date().toISOString().split('T')[0],
      notes: newIncome.notes || '',
    };

    setIncome([item, ...income]);

    // Push to Supabase
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('income').insert([item]);
        if (error) {
          console.error('Supabase income insert error:', error);
          alert(`⚠️ تم الحفظ محلياً لكن حدث خطأ في المزامنة السحابية: ${error.message}`);
        } else {
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.error('Cloud insert error:', err);
      }
    }

    setNewIncome({
      source: '',
      amount: '',
      expected_amount: '',
      payment_method: PAYMENT_METHODS[4],
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddIncome(false);
  };

  // Add Commitment Handler
  const handleAddCommitment = async (e) => {
    e.preventDefault();
    if (!newCommitment.title || !newCommitment.amount) return;
    
    const item = {
      id: generateUUID(),
      title: newCommitment.title,
      amount: parseFloat(newCommitment.amount),
      due_day: parseInt(newCommitment.due_day) || 15,
      status: newCommitment.status,
      notes: newCommitment.notes || '',
    };

    setCommitments([...commitments, item]);

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('commitments').insert([item]);
        if (error) {
          console.error('Supabase commitment insert error:', error);
          alert(`⚠️ تم الحفظ محلياً لكن حدث خطأ في المزامنة: ${error.message}`);
        } else {
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.error('Cloud insert error:', err);
      }
    }

    setNewCommitment({
      title: '',
      amount: '',
      due_day: 15,
      status: 'معلق',
      notes: '',
    });
    setShowAddCommitment(false);
  };

  // Toggle Commitment Status
  const toggleCommitmentStatus = async (id) => {
    const updated = commitments.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'تم الدفع' ? 'معلق' : 'تم الدفع';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    setCommitments(updated);

    const client = getSupabaseClient();
    if (client) {
      const target = updated.find(c => c.id === id);
      if (target) {
        client.from('commitments').update({ status: target.status }).eq('id', id).then();
      }
    }
  };

  // Delete Handlers
  const deleteExpense = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    setExpenses(expenses.filter(e => e.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('expenses').delete().eq('id', id).then();
    }
  };

  const deleteIncome = async (id) => {
    if (!confirm('هل تريد حذف مصدر الدخل هذا؟')) return;
    setIncome(income.filter(i => i.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('income').delete().eq('id', id).then();
    }
  };

  const deleteCommitment = async (id) => {
    if (!confirm('هل تريد حذف هذا الالتزام؟')) return;
    setCommitments(commitments.filter(c => c.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('commitments').delete().eq('id', id).then();
    }
  };

  // Save Supabase credentials
  const saveSupabaseConfig = async (e) => {
    e.preventDefault();
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrl);
    const cleanKey = supabaseKey.trim();

    localStorage.setItem('supabase_url', cleanUrl);
    localStorage.setItem('supabase_anon_key', cleanKey);
    setSupabaseUrl(cleanUrl);

    resetSupabaseClient();
    setSyncStatus('syncing');
    setConnectionMessage('جاري اختبار الاتصال بقاعدة بيانات Supabase...');

    const client = getSupabaseClient();
    if (!client) {
      setIsCloudConnected(false);
      setSyncStatus('error');
      setConnectionMessage('⚠️ يرجى التأكد من ملء كل من الرابط والمفتاح بشكل صحيح.');
      return;
    }

    try {
      const { data, error } = await client.from('categories').select('*').limit(1);
      if (error) throw error;

      setIsCloudConnected(true);
      setSyncStatus('success');
      setConnectionMessage('✅ تم الاتصال بنجاح! جاري مزامنة البيانات...');
      await loadDataFromCloud(client);
      alert('🎉 تم الاتصال بنجاح بقاعدة بيانات Supabase ومزامنة البيانات!');
    } catch (err) {
      console.error(err);
      setIsCloudConnected(false);
      setSyncStatus('error');
      setConnectionMessage(`❌ خطأ في الاتصال: ${err.message || 'تأكد من صحة الرابط ومفتاح Anon'}`);
      alert(`❌ فشل الاتصال: ${err.message || 'تأكد من المفتاح العام Anon وليس مفتاح Service Role'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 md:pb-10">
      
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">مصروفي</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className={isCloudConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                  {isCloudConnected ? 'سحابي متصل (Supabase)' : 'تخزين محلي (Offline)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Button (Desktop) */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مصروف سريع</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={syncWithSupabase}
              title="مزامنة فورية"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'لوحة التحكم', icon: PieChart },
            { id: 'expenses', label: 'سجل المصاريف', icon: ShoppingBag },
            { id: 'commitments', label: 'الأقساط والجمعيات', icon: Calendar },
            { id: 'income', label: 'مصادر الدخل', icon: DollarSign },
            { id: 'settings', label: 'الإعدادات والسحابة', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  active 
                    ? 'border-emerald-500 text-emerald-400 bg-slate-800/40' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">

        {/* ----------------- TAB: DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* Top Financial KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              
              {/* Income Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>إجمالي الدخل</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900">
                  {totalIncome.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  من {income.length} مصادر مسجلة
                </div>
              </div>

              {/* Commitments Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>الأقساط والجمعيات</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-black text-rose-600">
                  {totalCommitments.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  التزامات الشهر الثابتة
                </div>
              </div>

              {/* Daily Expenses Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>المصاريف اليومية</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-black text-amber-600">
                  {totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  إجمالي {expenses.length} حركة مسجلة
                </div>
              </div>

              {/* Net Liquidity Card */}
              <div className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between ${
                netLiquidity >= 0 
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500' 
                  : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-500'
              }`}>
                <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold mb-2">
                  <span>صافي السيولة المتبقية</span>
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="text-xl md:text-2xl font-black">
                  {netLiquidity.toLocaleString()} <span className="text-xs font-normal opacity-80">ج.م</span>
                </div>
                <div className="text-[11px] opacity-90 font-medium mt-1">
                  معدل التوفير: {savingsRate}%
                </div>
              </div>
            </div>

            {/* Safe Daily Spend Highlight Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 md:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-indigo-100">حد الصرف اليومي الآمن (Safe Daily Spend)</h3>
                  <p className="text-xs text-slate-300">
                    متبقي {remainingDays} يوماً على نهاية الشهر. لتجنب العجز المالي، الحد الأقصى لصرفك اليومي:
                  </p>
                </div>
              </div>
              <div className="bg-indigo-600/30 border border-indigo-500/40 px-5 py-2.5 rounded-xl text-center">
                <span className="text-2xl font-black text-emerald-400">{Number(safeDailySpend).toLocaleString()}</span>
                <span className="text-xs text-indigo-200 mr-1.5">ج.م / يومياً</span>
              </div>
            </div>

            {/* Upcoming Commitments Alert Banner */}
            {commitments.filter(c => c.status !== 'تم الدفع').length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>تنبيه الالتزامات والأقساط المستحقة هذا الشهر:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {commitments.filter(c => c.status !== 'تم الدفع').map(c => {
                    const isLate = currentDay > c.due_day;
                    const isSoon = c.due_day - currentDay <= 3 && c.due_day >= currentDay;
                    return (
                      <div key={c.id} className="bg-white p-3 rounded-xl border border-amber-200/70 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{c.title}</div>
                          <div className="text-[11px] text-slate-500">يوم {c.due_day} من الشهر • {Number(c.amount).toLocaleString()} ج.م</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isLate ? 'bg-rose-100 text-rose-700' : isSoon ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isLate ? '🚨 متأخر' : isSoon ? '🔔 يستحق قريباً' : 'مجدول'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Budget vs Actual Category Progress Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">مراقبة الميزانية مقابل المصروف الفعلي</h3>
                  <p className="text-xs text-slate-500">متابعة دقيقة لكل فئة من فئات الصرف المحددة</p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                  {categories.length} فئات نشطة
                </span>
              </div>

              <div className="space-y-4">
                {categories.map(cat => {
                  const spent = categorySpending[cat.name] || 0;
                  const budget = Number(cat.budget) || 1;
                  const ratio = (spent / budget) * 100;
                  const isOver = spent > budget;
                  const isClose = ratio >= 85 && !isOver;

                  return (
                    <div key={cat.id} className="space-y-1.5 p-3 rounded-xl hover:bg-slate-50/80 transition">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{cat.name}</span>
                          {isOver && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> تجاوز الميزانية ({Math.round(ratio)}%)
                            </span>
                          )}
                          {isClose && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              اقترب من الحد ({Math.round(ratio)}%)
                            </span>
                          )}
                        </div>
                        <div className="font-bold">
                          <span className={isOver ? 'text-rose-600' : 'text-slate-900'}>{spent.toLocaleString()}</span>
                          <span className="text-slate-400 font-normal"> / {budget.toLocaleString()} ج.م</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : isClose ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>المتبقي: {(budget - spent).toLocaleString()} ج.م</span>
                        <span>{Math.round(ratio)}% تم استهلاكه</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Expenses Preview on Dashboard */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-900">آخر المصاريف المسجلة</h3>
                <button 
                  onClick={() => setActiveTab('expenses')}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  عرض كافة المصاريف ({expenses.length}) ←
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">لا توجد مصاريف مسجلة حتى الآن</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {expenses.slice(0, 5).map(item => (
                    <div key={item.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                          {item.category.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{item.title}</div>
                          <div className="text-xs text-slate-400">{item.category} • {item.payment_method} • {item.date}</div>
                        </div>
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {Number(item.amount).toLocaleString()} ج.م
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------- TAB: EXPENSES ----------------- */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">سجل المصاريف اليومية</h2>
                <p className="text-xs text-slate-500">إدارة وتسجيل كافة العمليات والمشتريات</p>
              </div>
              <button
                onClick={() => setShowAddExpense(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>مصروف جديد</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              {expenses.length === 0 ? (
                <div className="text-center py-12 text-slate-400">لا توجد مصاريف مسجلة حتى الآن</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {expenses.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                          {item.category.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">{item.title}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600">{item.category}</span>
                            <span>{item.payment_method}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-base font-black text-slate-900">
                          {Number(item.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
                        </div>
                        <button
                          onClick={() => deleteExpense(item.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB: COMMITMENTS ----------------- */}
        {activeTab === 'commitments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">الأقساط والجمعيات الشهرية</h2>
                <p className="text-xs text-slate-500">تتبع مواعيد الاستحقاق وسداد الالتزامات الدورية</p>
              </div>
              <button
                onClick={() => setShowAddCommitment(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>قسط / جمعية جديدة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commitments.map(item => {
                const isPaid = item.status === 'تم الدفع';
                const isLate = !isPaid && currentDay > item.due_day;
                const isSoon = !isPaid && item.due_day - currentDay <= 3 && item.due_day >= currentDay;

                return (
                  <div key={item.id} className={`p-5 rounded-2xl border transition-all shadow-xs ${
                    isPaid ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200/80'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{item.title}</h4>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">يوم {item.due_day} شهرياً</span>
                          {item.notes && <span>• {item.notes}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900">
                          {Number(item.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isPaid 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isLate 
                              ? 'bg-rose-100 text-rose-800' 
                              : isSoon 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isPaid ? '✅ تم السداد' : isLate ? '🚨 متأخر السداد' : isSoon ? '🔔 يستحق قريباً' : '⏳ قيد الانتظار'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCommitmentStatus(item.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                            isPaid 
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isPaid ? 'إلغاء السداد' : 'تحديد كـ مدفوع'}</span>
                        </button>

                        <button
                          onClick={() => deleteCommitment(item.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- TAB: INCOME ----------------- */}
        {activeTab === 'income' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">مصادر الدخل الشهري</h2>
                <p className="text-xs text-slate-500">تسجيل الراتب، العمل الحر، والأرباح وعوائد الاستثمار</p>
              </div>
              <button
                onClick={() => setShowAddIncome(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مصدر دخل</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {income.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900">{item.source}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {item.payment_method} • تاريخ: {item.date} {item.notes && `• ${item.notes}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-700">
                          {Number(item.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">ج.م</span>
                        </div>
                        {item.expected_amount && (
                          <div className="text-[11px] text-slate-400">المتوقع: {Number(item.expected_amount).toLocaleString()} ج.م</div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteIncome(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB: SETTINGS & CLOUD ----------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">إعدادات التطبيق والمزامنة السحابية</h2>
              <p className="text-xs text-slate-500">ربط التطبيق بـ Supabase لمزامنة الهاتف والكمبيوتر</p>
            </div>

            {/* Supabase Connection Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">بيانات الربط السحابي (Supabase Cloud Config)</h3>
                    <p className="text-xs text-slate-400">يمكنك الحصول عليها من إعدادات مشروعك في Supabase</p>
                  </div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isCloudConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isCloudConnected ? '🟢 متصل بالسحابة' : '🟡 غير متصل'}
                </span>
              </div>

              {connectionMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  isCloudConnected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {connectionMessage}
                </div>
              )}

              <form onSubmit={saveSupabaseConfig} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project URL (رابط المشروع الأساسي):</label>
                  <input
                    type="text"
                    dir="ltr"
                    required
                    placeholder="https://smkuwngdtqxjbnwfueln.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * تأكد أن الرابط ينتهي بـ <code className="text-emerald-700">.supabase.co</code> فقط وبدون <code className="line-through text-rose-500">/rest/v1</code> في نهايته.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Anon Public Key (المفتاح العام):</label>
                  <input
                    type="password"
                    dir="ltr"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * تجده في Supabase تحت: <span className="font-semibold">Project Settings ⬅ API ⬅ anon public</span>
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ واختبار الاتصال فوراً</span>
                  </button>

                  <button
                    type="button"
                    onClick={syncWithSupabase}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-emerald-600' : ''}`} />
                    <span>مزامنة البيانات الآن</span>
                  </button>
                </div>
              </form>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-600 space-y-1.5 border border-slate-200/60">
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> ملحوظة مهمة للتأكد من المزامنة:
                </div>
                <p>1. تأكد من نسخ مفتاح <strong className="text-slate-900">anon public</strong> (يبدأ بـ <code className="text-indigo-600">eyJhbG...</code>).</p>
                <p>2. تأكد أن الرابط لا يحتوي على كلمة <code className="line-through text-rose-500">rest/v1</code> في نهايته.</p>
                <p>3. بمجرد الحفظ والاتصال بنجاح، ستتحول النقطة بالأعلى إلى <span className="text-emerald-600 font-bold">🟢 سحابي متصل</span> وأي عملية تضيفها ستظهر فوراً في جداول Supabase!</p>
              </div>
            </div>

            {/* Mobile PWA Installation Guide */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">تشغيل التطبيق على الهاتف كأنه تطبيق أصلي (PWA)</h3>
                  <p className="text-xs text-slate-400">بدون الحاجة لمتجر Google Play أو App Store</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>📱 **على أندرويد (Chrome):** افتح رابط التطبيق على هاتفك، اضغط على النقاط الثلاث بالأعلى ⬅ اختر **"تثبيت التطبيق"** أو **"إضافة إلى الشاشة الرئيسية"**.</p>
                <p>🍏 **على آيفون (Safari):** افتح رابط التطبيق، اضغط زر المشاركة (Share) بالأسفل ⬅ اختر **"Add to Home Screen"**.</p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Floating Action Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-20 left-4 z-40">
        <button
          onClick={() => setShowAddExpense(true)}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-2 py-2 flex items-center justify-around z-30 shadow-lg">
        {[
          { id: 'dashboard', label: 'الرئيسية', icon: PieChart },
          { id: 'expenses', label: 'المصاريف', icon: ShoppingBag },
          { id: 'commitments', label: 'الأقساط', icon: Calendar },
          { id: 'income', label: 'الدخل', icon: DollarSign },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                active ? 'text-emerald-600 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ----------------- MODAL: ADD EXPENSE ----------------- */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>تسجيل مصروف جديد</span>
              </h3>
              <button onClick={() => setShowAddExpense(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart NLP Input Box */}
            <div className="bg-indigo-50/70 border border-indigo-200/60 p-3 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>ميزة الإدخال الذكي السريع:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder='اكتب مثلاً: "250 بنزين كاش" أو "450 سوبرماركت فيزا"'
                  value={smartInputText}
                  onChange={(e) => setSmartInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      parseSmartInput(smartInputText);
                    }
                  }}
                  className="flex-1 bg-white text-xs px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => parseSmartInput(smartInputText)}
                  className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-indigo-500 transition"
                >
                  تعبئة تلقائية
                </button>
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المصروف:</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full text-lg font-black text-slate-900 px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان / تفاصيل المشتريات:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تسوق سوبرماركت، تفويل بنزين..."
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">فئة المصروف:</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الدفع:</label>
                  <select
                    value={newExpense.payment_method}
                    onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                    className="w-full text-xs font-semibold px-2.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full text-xs font-semibold px-2.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-emerald-600/20 text-sm"
                >
                  حفظ المصروف فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ADD INCOME ----------------- */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">إضافة مصدر دخل</h3>
              <button onClick={() => setShowAddIncome(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIncome} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مصدر الدخل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الراتب الأساسي، أرباح مشروع..."
                  value={newIncome.source}
                  onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الفعلي المستلم:</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المتوقع:</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newIncome.expected_amount}
                    onChange={(e) => setNewIncome({ ...newIncome, expected_amount: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  حفظ مصدر الدخل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ADD COMMITMENT ----------------- */}
      {showAddCommitment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">إضافة قسط شهري أو جمعية</h3>
              <button onClick={() => setShowAddCommitment(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCommitment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البند / اسم الالتزام:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قسط تمويل، جمعية الأهل..."
                  value={newCommitment.title}
                  onChange={(e) => setNewCommitment({ ...newCommitment, title: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القيمة الشهرية:</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={newCommitment.amount}
                    onChange={(e) => setNewCommitment({ ...newCommitment, amount: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">يوم الاستحقاق شهرياً:</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={newCommitment.due_day}
                    onChange={(e) => setNewCommitment({ ...newCommitment, due_day: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  حفظ الالتزام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
