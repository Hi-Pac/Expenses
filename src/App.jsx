import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, AlertTriangle, CreditCard, Calendar, Plus, 
  CheckCircle2, Trash2, Edit2, Settings, ArrowDownRight, ArrowUpRight, ShieldAlert, 
  Sparkles, RefreshCw, Smartphone, DollarSign, PieChart, Clock, ExternalLink, 
  HelpCircle, Utensils, Home, Car, GraduationCap, HeartPulse, Coffee, ShoppingBag, 
  Check, X, Eye, EyeOff, KeyRound, Cloud, Globe, BarChart3, Target, Award, 
  Download, Printer, ChevronRight, Tag
} from 'lucide-react';
import { getSupabaseClient, resetSupabaseClient, sanitizeSupabaseUrl, getSavedConfig } from './supabaseClient';
import { 
  INITIAL_CATEGORIES, INITIAL_EXPENSES, INITIAL_INCOME, 
  INITIAL_COMMITMENTS, PAYMENT_METHODS 
} from './initialData';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'expenses' | 'commitments' | 'income' | 'reports' | 'settings'

  // Preferences State
  const [currency, setCurrency] = useState(() => localStorage.getItem('masroufy_currency') || 'ج.م');
  const [alertThreshold, setAlertThreshold] = useState(() => Number(localStorage.getItem('masroufy_alert_threshold')) || 85);

  // Dynamic Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem('masroufy_payment_methods');
    return saved ? JSON.parse(saved) : PAYMENT_METHODS;
  });

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
  const initialConfig = getSavedConfig();
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');

  // Modals: Add
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [smartInputText, setSmartInputText] = useState('');

  // Modals: Edit
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingCommitment, setEditingCommitment] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryModal, setNewCategoryModal] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({ name: '', budget: 1000 });

  const [newPaymentMethodText, setNewPaymentMethodText] = useState('');
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);

  // Form States (Add)
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: categories[0]?.name || 'طعام وسوبرماركت',
    payment_method: paymentMethods[0] || 'نقداً (كاش)',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [newIncome, setNewIncome] = useState({
    source: '',
    amount: '',
    expected_amount: '',
    payment_method: paymentMethods[4] || paymentMethods[0],
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [newCommitment, setNewCommitment] = useState({
    title: '',
    amount: '',
    type: 'specific_date', // 'specific_date' | 'monthly_day'
    due_date: new Date().toISOString().split('T')[0],
    due_day: 15,
    status: 'معلق',
    notes: '',
  });

  // Commitments Filter
  const [commitmentFilter, setCommitmentFilter] = useState('all'); // 'all' | 'pending' | 'paid' | 'urgent'

  // Persist Preferences & Data locally as offline cache
  useEffect(() => {
    localStorage.setItem('masroufy_currency', currency);
    localStorage.setItem('masroufy_alert_threshold', alertThreshold.toString());
    localStorage.setItem('masroufy_payment_methods', JSON.stringify(paymentMethods));
    localStorage.setItem('masroufy_categories', JSON.stringify(categories));
    localStorage.setItem('masroufy_expenses', JSON.stringify(expenses));
    localStorage.setItem('masroufy_income', JSON.stringify(income));
    localStorage.setItem('masroufy_commitments', JSON.stringify(commitments));
  }, [currency, alertThreshold, paymentMethods, categories, expenses, income, commitments]);

  // Connect to Supabase on mount
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
      const { data, error } = await client.from('categories').select('*').limit(1);
      if (error) throw error;
      
      setIsCloudConnected(true);
      setSyncStatus('success');
      setConnectionMessage('✅ متصل بالسحابة (Supabase) وجاهز للمزامنة اللحظية');
      setTimeout(() => setSyncStatus(''), 3000);
      
      await loadDataFromCloud(client);
    } catch (err) {
      console.warn('Supabase test connection failed:', err);
      setIsCloudConnected(false);
      setSyncStatus('error');
      setConnectionMessage(`⚠️ خطأ في الاتصال: ${err.message || 'المفتاح غير صالح'}`);
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
        client.from('commitments').select('*').order('created_at', { ascending: false }),
      ]);

      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (expRes.data) setExpenses(expRes.data);
      if (incRes.data) setIncome(incRes.data);
      if (comRes.data) {
        const normalized = comRes.data.map(c => {
          const dateVal = c.due_date || c.end_date || null;
          const isSpecific = c.type === 'specific_date' || Boolean(dateVal);
          return {
            ...c,
            due_date: dateVal,
            end_date: dateVal,
            type: isSpecific ? 'specific_date' : 'monthly_day',
            due_day: c.due_day || (dateVal ? parseInt(dateVal.split('-')[2]) : 30),
          };
        });
        setCommitments(normalized);
      }
    } catch (e) {
      console.warn('Error loading data from cloud:', e);
    }
  };

  const syncWithSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      alert('يرجى التحقق من اتصال Supabase في ملف supabaseConfig.js!');
      return;
    }
    setSyncStatus('syncing');
    try {
      await loadDataFromCloud(client);
      setIsCloudConnected(true);
      setSyncStatus('success');
      alert('✅ تمت المزامنة بنجاح مع السحابة!');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      alert(`⚠️ تعذرت المزامنة: ${err.message || 'خطأ غير معروف'}`);
    }
  };

  // ----------------- FINANCIAL CALCULATIONS -----------------
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

  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const safeDailySpend = netLiquidity > 0 ? (netLiquidity / remainingDays).toFixed(0) : 0;

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

  // Payment Method Spending Breakdown
  const paymentMethodSpending = useMemo(() => {
    const map = {};
    paymentMethods.forEach(m => { map[m] = 0; });
    expenses.forEach(e => {
      const m = e.payment_method || 'نقداً (كاش)';
      map[m] = (map[m] || 0) + (Number(e.amount) || 0);
    });
    return map;
  }, [paymentMethods, expenses]);

  // Top Expense Categories sorted
  const sortedCategoriesBySpend = useMemo(() => {
    return [...categories].map(c => ({
      ...c,
      spent: categorySpending[c.name] || 0,
      percentOfTotal: totalExpenses > 0 ? Math.round(((categorySpending[c.name] || 0) / totalExpenses) * 100) : 0,
    })).sort((a, b) => b.spent - a.spent);
  }, [categories, categorySpending, totalExpenses]);

  // Financial Health Score Calculation (Out of 100)
  const healthScore = useMemo(() => {
    if (totalIncome === 0) return 50;
    let score = 50;

    // Savings rate factor (+- 25)
    const sRate = (netLiquidity / totalIncome) * 100;
    if (sRate >= 20) score += 25;
    else if (sRate >= 10) score += 15;
    else if (sRate >= 0) score += 5;
    else score -= 25;

    // Debt to income ratio (+- 15)
    const debtRatio = (totalCommitments / totalIncome) * 100;
    if (debtRatio <= 25) score += 15;
    else if (debtRatio <= 40) score += 5;
    else score -= 15;

    // Budget overruns factor (+- 10)
    const overCategories = categories.filter(c => (categorySpending[c.name] || 0) > Number(c.budget)).length;
    if (overCategories === 0) score += 10;
    else score -= (overCategories * 5);

    return Math.min(100, Math.max(10, score));
  }, [totalIncome, netLiquidity, totalCommitments, categories, categorySpending]);

  // ----------------- SMART COMMITMENT DATE PARSER -----------------
  const getCommitmentStatus = (c) => {
    if (c.status === 'تم الدفع') {
      return { label: '✅ تم السداد', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', isDueSoon: false, isLate: false };
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let targetDate = null;
    const dateStr = c.due_date || c.end_date;

    if (dateStr) {
      targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
    } else if (c.due_day) {
      targetDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), c.due_day);
      targetDate.setHours(0, 0, 0, 0);
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
      return { label: '⏳ مجدول', color: 'bg-slate-100 text-slate-700 border-slate-200', isDueSoon: false, isLate: false, daysDiff: 999 };
    }

    const diffTime = targetDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `🚨 متأخر (${Math.abs(diffDays)} يوم)`, color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', isDueSoon: false, isLate: true, daysDiff: diffDays };
    } else if (diffDays === 0) {
      return { label: '🔔 يستحق اليوم!', color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse', isDueSoon: true, isLate: false, daysDiff: 0 };
    } else if (diffDays === 1) {
      return { label: '🔔 يستحق غداً!', color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold', isDueSoon: true, isLate: false, daysDiff: 1 };
    } else if (diffDays <= 7) {
      return { label: `⚠️ يستحق بعد ${diffDays} أيام`, color: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold', isDueSoon: true, isLate: false, daysDiff: diffDays };
    } else if (diffDays <= 30) {
      return { label: `⏳ بعد ${diffDays} يوماً`, color: 'bg-blue-50 text-blue-800 border-blue-200', isDueSoon: false, isLate: false, daysDiff: diffDays };
    } else {
      const months = Math.round(diffDays / 30);
      return { label: `📅 بعد ${months} شهر (${targetDate.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' })})`, color: 'bg-slate-100 text-slate-700 border-slate-200', isDueSoon: false, isLate: false, daysDiff: diffDays };
    }
  };

  // ----------------- CRUD: EXPENSES -----------------
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

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('expenses').insert([item]);
        if (error) console.error('Supabase expense insert error:', error);
      } catch (err) {
        console.error('Cloud insert error:', err);
      }
    }

    setNewExpense({
      title: '',
      amount: '',
      category: categories[0]?.name || 'طعام وسوبرماركت',
      payment_method: paymentMethods[0] || 'نقداً (كاش)',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSmartInputText('');
    setShowAddExpense(false);
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    const updated = expenses.map(item => item.id === editingExpense.id ? editingExpense : item);
    setExpenses(updated);

    const client = getSupabaseClient();
    if (client) {
      client.from('expenses').update({
        title: editingExpense.title,
        amount: parseFloat(editingExpense.amount),
        category: editingExpense.category,
        payment_method: editingExpense.payment_method,
        date: editingExpense.date,
        notes: editingExpense.notes || '',
      }).eq('id', editingExpense.id).then();
    }

    setEditingExpense(null);
  };

  const deleteExpense = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    setExpenses(expenses.filter(e => e.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('expenses').delete().eq('id', id).then();
    }
  };

  // ----------------- CRUD: INCOME -----------------
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

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('income').insert([item]);
      } catch (err) {
        console.error('Cloud insert error:', err);
      }
    }

    setNewIncome({
      source: '',
      amount: '',
      expected_amount: '',
      payment_method: paymentMethods[0] || 'تحويل بنكي / إنستاباي',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowAddIncome(false);
  };

  const handleUpdateIncome = async (e) => {
    e.preventDefault();
    if (!editingIncome) return;

    const updated = income.map(item => item.id === editingIncome.id ? editingIncome : item);
    setIncome(updated);

    const client = getSupabaseClient();
    if (client) {
      client.from('income').update({
        source: editingIncome.source,
        amount: parseFloat(editingIncome.amount),
        expected_amount: parseFloat(editingIncome.expected_amount || editingIncome.amount),
        payment_method: editingIncome.payment_method,
        date: editingIncome.date,
        notes: editingIncome.notes || '',
      }).eq('id', editingIncome.id).then();
    }

    setEditingIncome(null);
  };

  const deleteIncome = async (id) => {
    if (!confirm('هل تريد حذف مصدر الدخل هذا؟')) return;
    setIncome(income.filter(i => i.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('income').delete().eq('id', id).then();
    }
  };

  // ----------------- CRUD: COMMITMENTS -----------------
  const handleAddCommitment = async (e) => {
    e.preventDefault();
    if (!newCommitment.title || !newCommitment.amount) return;
    
    const isSpecific = newCommitment.type === 'specific_date';
    const targetDate = isSpecific ? newCommitment.due_date : null;
    const dayValue = !isSpecific && newCommitment.due_day 
      ? parseInt(newCommitment.due_day) 
      : (targetDate ? parseInt(targetDate.split('-')[2]) : 15);

    const item = {
      id: generateUUID(),
      title: newCommitment.title,
      amount: parseFloat(newCommitment.amount),
      type: isSpecific ? 'specific_date' : 'monthly_day',
      due_date: targetDate,
      due_day: dayValue,
      end_date: targetDate, // critical fallback for Supabase
      status: newCommitment.status,
      notes: newCommitment.notes || '',
    };

    setCommitments([...commitments, item]);

    const client = getSupabaseClient();
    if (client) {
      try {
        const payload = {
          id: item.id,
          title: item.title,
          amount: item.amount,
          type: item.type,
          due_date: item.due_date,
          due_day: item.due_day,
          end_date: item.end_date,
          status: item.status,
          notes: item.notes,
        };
        const { error } = await client.from('commitments').insert([payload]);
        if (error) {
          console.warn('Insert with due_date failed, using fallback:', error);
          const fallbackPayload = {
            id: item.id,
            title: item.title,
            amount: item.amount,
            due_day: item.due_day,
            end_date: item.end_date,
            status: item.status,
            notes: item.notes,
          };
          await client.from('commitments').insert([fallbackPayload]);
        }
      } catch (err) {
        console.error('Cloud insert error:', err);
      }
    }

    setNewCommitment({
      title: '',
      amount: '',
      type: 'specific_date',
      due_date: new Date().toISOString().split('T')[0],
      due_day: 15,
      status: 'معلق',
      notes: '',
    });
    setShowAddCommitment(false);
  };

  const handleUpdateCommitment = async (e) => {
    e.preventDefault();
    if (!editingCommitment) return;

    const isSpecific = editingCommitment.type === 'specific_date' || (!editingCommitment.type && Boolean(editingCommitment.due_date || editingCommitment.end_date));
    const targetDate = isSpecific ? (editingCommitment.due_date || editingCommitment.end_date) : null;
    const dayValue = !isSpecific && editingCommitment.due_day 
      ? parseInt(editingCommitment.due_day) 
      : (targetDate ? parseInt(targetDate.split('-')[2]) : 15);

    const updatedItem = {
      ...editingCommitment,
      type: isSpecific ? 'specific_date' : 'monthly_day',
      due_date: targetDate,
      end_date: targetDate,
      due_day: dayValue,
      amount: parseFloat(editingCommitment.amount),
    };

    const updated = commitments.map(item => item.id === editingCommitment.id ? updatedItem : item);
    setCommitments(updated);

    const client = getSupabaseClient();
    if (client) {
      try {
        const payload = {
          title: updatedItem.title,
          amount: updatedItem.amount,
          type: updatedItem.type,
          due_date: updatedItem.due_date,
          due_day: updatedItem.due_day,
          end_date: updatedItem.end_date,
          status: updatedItem.status,
          notes: updatedItem.notes || '',
        };

        const { error } = await client.from('commitments').update(payload).eq('id', editingCommitment.id);
        if (error) {
          console.warn('Update with due_date failed, trying fallback schema:', error);
          const fallbackPayload = {
            title: updatedItem.title,
            amount: updatedItem.amount,
            due_day: updatedItem.due_day,
            end_date: updatedItem.end_date,
            status: updatedItem.status,
            notes: updatedItem.notes || '',
          };
          const { error: err2 } = await client.from('commitments').update(fallbackPayload).eq('id', editingCommitment.id);
          if (err2) {
            console.error('Commitment update failed:', err2);
            alert(`⚠️ تعذر الحفظ في قاعدة البيانات: ${err2.message}`);
          }
        }
      } catch (err) {
        console.error('Commitment update error:', err);
      }
    }

    setEditingCommitment(null);
  };

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

  const deleteCommitment = async (id) => {
    if (!confirm('هل تريد حذف هذا الالتزام؟')) return;
    setCommitments(commitments.filter(c => c.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('commitments').delete().eq('id', id).then();
    }
  };

  // ----------------- CRUD: CATEGORIES & PAYMENT METHODS -----------------
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryForm.name) return;
    const cat = {
      id: generateUUID(),
      name: newCategoryForm.name.trim(),
      budget: parseFloat(newCategoryForm.budget) || 1000,
      icon: 'ShoppingBag',
      color: 'blue'
    };

    setCategories([...categories, cat]);
    setNewCategoryForm({ name: '', budget: 1000 });
    setNewCategoryModal(false);

    const client = getSupabaseClient();
    if (client) {
      client.from('categories').insert([cat]).then();
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    const oldName = categories.find(c => c.id === editingCategory.id)?.name;
    const updated = categories.map(c => c.id === editingCategory.id ? editingCategory : c);
    setCategories(updated);

    // Also update any expenses using the old category name
    if (oldName && oldName !== editingCategory.name) {
      setExpenses(expenses.map(exp => exp.category === oldName ? { ...exp, category: editingCategory.name } : exp));
    }

    const client = getSupabaseClient();
    if (client) {
      client.from('categories').update({
        name: editingCategory.name,
        budget: parseFloat(editingCategory.budget) || 0
      }).eq('id', editingCategory.id).then();
    }

    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id) => {
    const cat = categories.find(c => c.id === id);
    if (!confirm(`هل أنت متأكد من حذف فئة "${cat?.name}"؟`)) return;

    setCategories(categories.filter(c => c.id !== id));
    const client = getSupabaseClient();
    if (client) {
      client.from('categories').delete().eq('id', id).then();
    }
  };

  const handleAddPaymentMethod = (e) => {
    e.preventDefault();
    if (!newPaymentMethodText.trim()) return;
    if (paymentMethods.includes(newPaymentMethodText.trim())) {
      alert('وسيلة الدفع هذه موجودة بالفعل!');
      return;
    }
    setPaymentMethods([...paymentMethods, newPaymentMethodText.trim()]);
    setNewPaymentMethodText('');
  };

  const handleUpdatePaymentMethod = (e) => {
    e.preventDefault();
    if (!editingPaymentMethod || !editingPaymentMethod.newName.trim()) return;
    const { oldName, newName } = editingPaymentMethod;
    setPaymentMethods(paymentMethods.map(m => m === oldName ? newName.trim() : m));
    setExpenses(expenses.map(exp => exp.payment_method === oldName ? { ...exp, payment_method: newName.trim() } : exp));
    setEditingPaymentMethod(null);
  };

  const handleDeletePaymentMethod = (method) => {
    if (paymentMethods.length <= 1) {
      alert('يجب الإبقاء على وسيلة دفع واحدة على الأقل!');
      return;
    }
    if (!confirm(`هل تريد حذف طريقة الدفع "${method}"؟`)) return;
    setPaymentMethods(paymentMethods.filter(m => m !== method));
  };

  // ----------------- EXPORT / BACKUP -----------------
  const exportFullBackupJSON = () => {
    const backupData = {
      masroufy_version: '2.0',
      export_date: new Date().toISOString(),
      categories,
      paymentMethods,
      expenses,
      income,
      commitments,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masroufy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExpensesCSV = () => {
    const headers = ['التاريخ', 'البيان', 'الفئة', 'المبلغ', 'طريقة الدفع', 'ملاحظات'];
    const rows = expenses.map(e => [
      `"${e.date}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      e.amount,
      `"${(e.payment_method || '').replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masroufy_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ----------------- SMART NLP PARSER -----------------
  const parseSmartInput = (text) => {
    if (!text.trim()) return;
    const parts = text.trim().split(/\s+/);
    let detectedAmount = '';
    let detectedCategory = categories[0]?.name || 'طعام وسوبرماركت';
    let detectedMethod = paymentMethods[0] || 'نقداً (كاش)';

    for (const part of parts) {
      const num = parseFloat(part);
      if (!isNaN(num) && num > 0) {
        detectedAmount = num.toString();
        break;
      }
    }

    const lower = text.toLowerCase();
    for (const cat of categories) {
      if (lower.includes(cat.name.toLowerCase())) {
        detectedCategory = cat.name;
        break;
      }
    }

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
    }

    if (lower.includes('فيزا') || lower.includes('ديبت') || lower.includes('كارت')) {
      detectedMethod = paymentMethods.find(m => m.includes('Debit') || m.includes('فيزا')) || paymentMethods[0];
    } else if (lower.includes('كريديت') || lower.includes('ائتمان')) {
      detectedMethod = paymentMethods.find(m => m.includes('Credit')) || paymentMethods[0];
    } else if (lower.includes('محفظة') || lower.includes('فودافون')) {
      detectedMethod = paymentMethods.find(m => m.includes('محفظة')) || paymentMethods[0];
    } else if (lower.includes('تحويل') || lower.includes('انستاباي') || lower.includes('إنستاباي')) {
      detectedMethod = paymentMethods.find(m => m.includes('إنستاباي') || m.includes('تحويل')) || paymentMethods[0];
    }

    setNewExpense({
      ...newExpense,
      title: text,
      amount: detectedAmount || newExpense.amount,
      category: detectedCategory,
      payment_method: detectedMethod,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 md:pb-10 font-sans">
      
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
            <button
              onClick={() => setShowAddExpense(true)}
              className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مصروف سريع</span>
            </button>

            <button
              onClick={syncWithSupabase}
              title="مزامنة فورية"
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className={`w-5 h-5 ${syncStatus === 'syncing' ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'لوحة التحكم', icon: PieChart },
            { id: 'expenses', label: 'سجل المصاريف', icon: ShoppingBag },
            { id: 'commitments', label: 'الأقساط والجمعيات', icon: Calendar },
            { id: 'income', label: 'مصادر الدخل', icon: DollarSign },
            { id: 'reports', label: '📊 التقارير والتحليلات', icon: BarChart3 },
            { id: 'settings', label: '⚙️ الإعدادات والتحكم', icon: Settings },
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

        {/* ----------------- TAB 1: DASHBOARD ----------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* Top Financial KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>إجمالي الدخل</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-black text-slate-900">
                  {totalIncome.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium mt-1">
                  من {income.length} مصادر مسجلة
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>الأقساط والجمعيات</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-black text-rose-600">
                  {totalCommitments.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  {commitments.filter(c => c.status !== 'تم الدفع').length} التزامات متبقية
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
                  <span>المصاريف اليومية</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl md:text-2xl font-black text-amber-600">
                  {totalExpenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">{currency}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">
                  إجمالي {expenses.length} حركة مسجلة
                </div>
              </div>

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
                  {netLiquidity.toLocaleString()} <span className="text-xs font-normal opacity-80">{currency}</span>
                </div>
                <div className="text-[11px] opacity-90 font-medium mt-1">
                  معدل التوفير: {savingsRate}%
                </div>
              </div>
            </div>

            {/* Safe Daily Spend Highlight */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 md:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-indigo-100">حد الصرف اليومي الآمن (Safe Daily Spend)</h3>
                  <p className="text-xs text-slate-300">
                    متبقي {remainingDays} يوماً على نهاية الشهر. لتجنب العجز، حد صرفك اليومي الموصى به:
                  </p>
                </div>
              </div>
              <div className="bg-indigo-600/30 border border-indigo-500/40 px-5 py-2.5 rounded-xl text-center">
                <span className="text-2xl font-black text-emerald-400">{Number(safeDailySpend).toLocaleString()}</span>
                <span className="text-xs text-indigo-200 mr-1.5">{currency} / يومياً</span>
              </div>
            </div>

            {/* Upcoming Commitments Alert Radar */}
            {commitments.filter(c => c.status !== 'تم الدفع').length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>رادار الالتزامات والأقساط المستحقة:</span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('commitments')}
                    className="text-xs text-amber-800 font-bold hover:underline"
                  >
                    عرض الكل ←
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {commitments.filter(c => c.status !== 'تم الدفع').slice(0, 3).map(c => {
                    const statusInfo = getCommitmentStatus(c);
                    return (
                      <div key={c.id} className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900">{c.title}</div>
                          <div className="text-[11px] text-slate-500">{Number(c.amount).toLocaleString()} {currency}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
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
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <span>إدارة الفئات والميزانيات</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                {categories.map(cat => {
                  const spent = categorySpending[cat.name] || 0;
                  const budget = Number(cat.budget) || 1;
                  const ratio = (spent / budget) * 100;
                  const isOver = spent > budget;
                  const isClose = ratio >= alertThreshold && !isOver;

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
                          <span className="text-slate-400 font-normal"> / {budget.toLocaleString()} {currency}</span>
                        </div>
                      </div>

                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : isClose ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, ratio)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>المتبقي: {(budget - spent).toLocaleString()} {currency}</span>
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
                        {Number(item.amount).toLocaleString()} {currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------- TAB 2: EXPENSES (WITH EDIT) ----------------- */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">سجل المصاريف اليومية</h2>
                <p className="text-xs text-slate-500">إدارة وتعديل وتسجيل كافة العمليات والمشتريات</p>
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
                            {item.notes && <span className="text-slate-500">({item.notes})</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-base font-black text-slate-900">
                          {Number(item.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span>
                        </div>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingExpense(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="تعديل المصروف"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => deleteExpense(item.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
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

        {/* ----------------- TAB 3: COMMITMENTS (SMART DATES & EDIT) ----------------- */}
        {activeTab === 'commitments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">الأقساط والجمعيات والالتزامات</h2>
                <p className="text-xs text-slate-500">تتبع دقيق لمواعيد الاستحقاق القريبة والمستقبلية (2026، 2027...)</p>
              </div>
              <button
                onClick={() => setShowAddCommitment(true)}
                className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة التزام / قسط جديد</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: `الكل (${commitments.length})` },
                { id: 'urgent', label: `تستحق قريباً (${commitments.filter(c => c.status !== 'تم الدفع' && getCommitmentStatus(c).isDueSoon).length})` },
                { id: 'pending', label: `معلق (${commitments.filter(c => c.status !== 'تم الدفع').length})` },
                { id: 'paid', label: `تم السداد (${commitments.filter(c => c.status === 'تم الدفع').length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setCommitmentFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                    commitmentFilter === f.id 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {commitments
                .filter(item => {
                  if (commitmentFilter === 'paid') return item.status === 'تم الدفع';
                  if (commitmentFilter === 'pending') return item.status !== 'تم الدفع';
                  if (commitmentFilter === 'urgent') return item.status !== 'تم الدفع' && (getCommitmentStatus(item).isDueSoon || getCommitmentStatus(item).isLate);
                  return true;
                })
                .map(item => {
                  const isPaid = item.status === 'تم الدفع';
                  const statusInfo = getCommitmentStatus(item);
                  const displayDate = item.due_date || item.end_date;
                  const isSpecificDate = item.type === 'specific_date' || Boolean(displayDate);

                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border transition-all shadow-xs ${
                      isPaid ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-slate-200/80'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-base text-slate-900">{item.title}</h4>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            {isSpecificDate && displayDate ? (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-600" />
                                <span>تاريخ الاستحقاق: {displayDate}</span>
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                دوري شهرياً (يوم {item.due_day})
                              </span>
                            )}
                            {item.notes && <span>• {item.notes}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-slate-900">
                            {Number(item.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Toggle Paid */}
                          <button
                            onClick={() => toggleCommitmentStatus(item.id)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                              isPaid 
                                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isPaid ? 'إلغاء السداد' : 'تم السداد'}</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingCommitment(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="تعديل الالتزام"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteCommitment(item.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
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

        {/* ----------------- TAB 4: INCOME (WITH EDIT) ----------------- */}
        {activeTab === 'income' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">مصادر الدخل الشهري</h2>
                <p className="text-xs text-slate-500">تسجيل وتعديل الرواتب وعوائد الاستثمارات</p>
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
                          {Number(item.amount).toLocaleString()} <span className="text-xs font-normal text-slate-400">{currency}</span>
                        </div>
                        {item.expected_amount && (
                          <div className="text-[11px] text-slate-400">المتوقع: {Number(item.expected_amount).toLocaleString()} {currency}</div>
                        )}
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingIncome(item)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        title="تعديل مصدر الدخل"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteIncome(item.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
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

        {/* ----------------- TAB 5: REPORTS & AI INSIGHTS (NEW!) ----------------- */}
        {activeTab === 'reports' && (
          <div className="space-y-6">

            {/* Header & Print Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">📊 التقرير والتحليل المالي الشامل</h2>
                <p className="text-xs text-slate-500">رؤية تفصيلية ومؤشرات ذكية لفهم مسار أموالك وتوجيهات الترشيد</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>طباعة / حفظ PDF</span>
                </button>

                <button
                  onClick={exportExpensesCSV}
                  className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>تصدير Excel/CSV</span>
                </button>
              </div>
            </div>

            {/* Financial Health Score & Diagnosis Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 text-center md:text-right">
                  <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30">
                    <Award className="w-3.5 h-3.5" /> تقييم الصحة المالية العامة
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black">
                    {healthScore >= 80 ? '🟢 وضع مالي ممتاز ومستقر' : healthScore >= 60 ? '🟡 وضع مالي جيد ومقبول' : healthScore >= 40 ? '🟠 يحتاج إلى ترشيد وانتباه' : '🔴 في حالة عجز خطر'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                    يتم احتساب هذا المؤشر استناداً إلى نسبة التوفير الحالية، والالتزامات والأقساط، ومدى انضباطك بحدود ميزانية الفئات المقررة.
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl w-40 h-40">
                  <span className="text-4xl font-black text-emerald-400">{healthScore}</span>
                  <span className="text-xs text-slate-300 mt-1">من 100 نقطة</span>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 3 Metrics Pills */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-slate-400 mb-1">معدل الادخار الفعلي:</div>
                  <div className="text-base font-bold text-emerald-400">{savingsRate}% <span className="text-xs text-slate-300 font-normal">(المثالي: 20%)</span></div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-slate-400 mb-1">نسبة الأقساط إلى الدخل:</div>
                  <div className={`text-base font-bold ${totalIncome > 0 && (totalCommitments / totalIncome) > 0.4 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {totalIncome > 0 ? Math.round((totalCommitments / totalIncome) * 100) : 0}% <span className="text-xs text-slate-300 font-normal">(الحد الآمن: 35%)</span>
                  </div>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="text-slate-400 mb-1">البنود المتجاوزة للميزانية:</div>
                  <div className="text-base font-bold text-slate-200">
                    {categories.filter(c => (categorySpending[c.name] || 0) > Number(c.budget)).length} من {categories.length} فئات
                  </div>
                </div>
              </div>
            </div>

            {/* AI Advisor & Actionable Insights Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">توجيهات ونصائح المساعد المالي الذكي</h3>
                  <p className="text-xs text-slate-500">تحليلات دقيقة مبنية على نمط صرفك الحقيقي</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tip 1: Top Expense Warning */}
                {sortedCategoriesBySpend[0] && sortedCategoriesBySpend[0].spent > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>أكبر بند استنزافاً للأموال: {sortedCategoriesBySpend[0].name}</span>
                    </div>
                    <p className="text-xs text-amber-950/80 leading-relaxed">
                      هذا البند يستحوذ وحده على <strong className="font-bold text-amber-900">{sortedCategoriesBySpend[0].percentOfTotal}%</strong> من إجمالي مصاريفك ({sortedCategoriesBySpend[0].spent.toLocaleString()} {currency}).
                      ننصح بتحديد سقف أسبوعي ثابت وتقليل المشتريات الترفيهية به لتوفير ما يقارب 15% شهرياً.
                    </p>
                  </div>
                )}

                {/* Tip 2: 50/30/20 Rule Insights */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-900">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تطبيق القاعدة الذهبية للميزانية (50 / 30 / 20)</span>
                  </div>
                  <p className="text-xs text-indigo-950/80 leading-relaxed">
                    وفقاً للمعايير العالمية: خصص 50% للاحتياجات الأساسية، 30% للرغبات والترفيه، و 20% للادخار والاستثمار.
                    صافي وفرك الحالي هو <strong className="font-bold text-indigo-900">{savingsRate}%</strong> من إجمالي دخلك.
                  </p>
                </div>

                {/* Tip 3: Commitments Ahead */}
                {commitments.filter(c => c.status !== 'تم الدفع').length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>إدارة السيولة للالتزامات القادمة</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      لديك التزامات معلقة بقيمة إجمالية <strong className="font-bold text-slate-800">
                        {commitments.filter(c => c.status !== 'تم الدفع').reduce((s, i) => s + Number(i.amount), 0).toLocaleString()} {currency}
                      </strong>. تأكد من إبقاء هذا المبلغ في حسابك البنكي أو محفظتك قبل حلول مواعيد الاستحقاق.
                    </p>
                  </div>
                )}

                {/* Tip 4: Cash vs Digital */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>سلوك الدفع ونقاط الإنفاق</span>
                  </div>
                  <p className="text-xs text-emerald-950/80 leading-relaxed">
                    الدفع الإلكتروني (إنستاباي/بطاقات) يسهل تتبعه بدقة، لكنه أحياناً يقلل الشعور بحجم المصروف مقارنة بالكاش. حاول مراجعة كشف البطاقات أسبوعياً.
                  </p>
                </div>
              </div>
            </div>

            {/* Deep Breakdown: Top Categories + Payment Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Top Categories Ranking */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>ترتيب فئات الصرف (الأعلى استهلاكاً)</span>
                  </h3>
                  <span className="text-xs text-slate-400">إجمالي {totalExpenses.toLocaleString()} {currency}</span>
                </div>

                <div className="space-y-3">
                  {sortedCategoriesBySpend.slice(0, 6).map((cat, idx) => (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{cat.name}</span>
                        </div>
                        <div className="font-bold text-slate-900">
                          {cat.spent.toLocaleString()} {currency} <span className="text-[11px] text-slate-400 font-normal">({cat.percentOfTotal}%)</span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${cat.percentOfTotal}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>توزيع المصاريف حسب طرق الدفع</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map(m => {
                    const spent = paymentMethodSpending[m] || 0;
                    const percent = totalExpenses > 0 ? Math.round((spent / totalExpenses) * 100) : 0;

                    return (
                      <div key={m} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{m}</span>
                          <span className="font-bold text-slate-900">
                            {spent.toLocaleString()} {currency} <span className="text-[11px] text-slate-400 font-normal">({percent}%)</span>
                          </span>
                        </div>

                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------- TAB 6: SETTINGS & CONTROLS (CLEAN & ADVANCED) ----------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-bold text-slate-900">لوحة التحكم والإعدادات المتقدمة</h2>
              <p className="text-xs text-slate-500">تخصيص الفئات، وسائل الدفع، العملة، والنسخ الاحتياطي</p>
            </div>

            {/* Cloud Status Card (Clean & Modern - No manual API keys) */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">الربط السحابي التلقائي (Supabase Cloud Active)</h3>
                    <p className="text-xs text-slate-300">مربوط مركزياً من ملف الإعدادات: <code className="text-emerald-300 font-mono">src/supabaseConfig.js</code></p>
                  </div>
                </div>

                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isCloudConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {isCloudConnected ? '🟢 متصل ومزامن لحظياً' : '🟡 غير متصل'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-300 border-t border-white/10">
                <div>مشروع السحابة: <span className="font-mono text-white">smkuwngdtqxjbnwfueln</span> (متاح لجميع أجهزتك)</div>
                <button
                  onClick={syncWithSupabase}
                  className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>فحص وتحديث المزامنة الآن</span>
                </button>
              </div>
            </div>

            {/* General Preferences Grid */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>التفضيلات العامة والتنبيهات</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العملة المفضلة للتطبيق:</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ج.م">ج.م (الجنيه المصري)</option>
                    <option value="ر.س">ر.س (الريال السعودي)</option>
                    <option value="د.إ">د.إ (الدرهم الإماراتي)</option>
                    <option value="$">$ (الدولار الأمريكي)</option>
                    <option value="د.ك">د.ك (الدينار الكويتي)</option>
                    <option value="د.أ">د.أ (الدينار الأردني)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نسبة التنبيه المبكر قبل تخطي الميزانية:</label>
                  <select
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="75">تنبيه عند استهلاك 75% من الميزانية</option>
                    <option value="80">تنبيه عند استهلاك 80% من الميزانية</option>
                    <option value="85">تنبيه عند استهلاك 85% من الميزانية (موصى به)</option>
                    <option value="90">تنبيه عند استهلاك 90% من الميزانية</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Dynamic Categories Manager */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>إدارة فئات المصاريف والميزانيات المخصصة ({categories.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">تعديل أسماء الفئات وميزانياتها أو إضافة فئات جديدة</p>
                </div>
                <button
                  onClick={() => setNewCategoryModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>فئة جديدة</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map(cat => (
                  <div key={cat.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{cat.name}</div>
                      <div className="text-[11px] text-slate-500">الميزانية: {Number(cat.budget).toLocaleString()} {currency}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition"
                        title="تعديل الفئة"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition"
                        title="حذف الفئة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Payment Methods Manager */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-600" />
                    <span>إدارة خيارات طرق الدفع للقوائم المنسدلة ({paymentMethods.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">إضافة أو تعديل أي طريقة دفع تظهر في كل نوافذ الإدخال</p>
                </div>
              </div>

              <form onSubmit={handleAddPaymentMethod} className="flex gap-2">
                <input
                  type="text"
                  placeholder="اكتب اسم طريقة دفع جديدة (مثلاً: باي بال، محفظة أورانج...)"
                  value={newPaymentMethodText}
                  onChange={(e) => setNewPaymentMethodText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 pt-1">
                {paymentMethods.map(m => (
                  <div key={m} className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800">{m}</span>
                    <button
                      onClick={() => setEditingPaymentMethod({ oldName: m, newName: m })}
                      className="text-slate-400 hover:text-indigo-600"
                      title="تعديل الاسم"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeletePaymentMethod(m)}
                      className="text-slate-300 hover:text-rose-500"
                      title="حذف"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Backup & Export Tools */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>أدوات النسخ الاحتياطي وتصدير البيانات</span>
              </h3>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={exportFullBackupJSON}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير نسخة احتياطية كاملة (JSON Backup)</span>
                </button>

                <button
                  onClick={exportExpensesCSV}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير المصاريف إلى ملف (CSV/Excel)</span>
                </button>
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
          { id: 'reports', label: 'التقارير', icon: BarChart3 },
          { id: 'settings', label: 'الإعدادات', icon: Settings },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition ${
                active ? 'text-emerald-600 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ================= MODALS ================= */}

      {/* 1. MODAL: ADD EXPENSE */}
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

            {/* NLP Smart Box */}
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
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">{currency}</span>
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
                    {paymentMethods.map(m => (
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

      {/* 2. MODAL: EDIT EXPENSE */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <span>تعديل بيانات المصروف</span>
              </h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ:</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                  className="w-full text-base font-black px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البيان:</label>
                <input
                  type="text"
                  required
                  value={editingExpense.title}
                  onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الفئة:</label>
                <select
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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
                    value={editingExpense.payment_method}
                    onChange={(e) => setEditingExpense({ ...editingExpense, payment_method: e.target.value })}
                    className="w-full text-xs font-semibold px-2.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full text-xs font-semibold px-2.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL: ADD COMMITMENT (SMART DATE PICKER) */}
      {showAddCommitment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">إضافة التزام / قسط جديد</h3>
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
                  placeholder="مثال: قسط تمويل، جمعية الأهل، قسط جهاز..."
                  value={newCommitment.title}
                  onChange={(e) => setNewCommitment({ ...newCommitment, title: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المطلوب:</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={newCommitment.amount}
                  onChange={(e) => setNewCommitment({ ...newCommitment, amount: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طبيعة موعد الاستحقاق:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCommitment({ ...newCommitment, type: 'specific_date' })}
                    className={`py-2 px-3 text-xs rounded-xl font-bold transition ${
                      newCommitment.type === 'specific_date'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    تاريخ محدد (مثال: 30 يناير 2027)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCommitment({ ...newCommitment, type: 'monthly_day' })}
                    className={`py-2 px-3 text-xs rounded-xl font-bold transition ${
                      newCommitment.type === 'monthly_day'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    دوري شهرياً (يوم محدد)
                  </button>
                </div>
              </div>

              {newCommitment.type === 'specific_date' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق الدقيق (حتى لو بعيد):</label>
                  <input
                    type="date"
                    required
                    value={newCommitment.due_date}
                    onChange={(e) => setNewCommitment({ ...newCommitment, due_date: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">يوم الاستحقاق من كل شهر (1-31):</label>
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
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                <input
                  type="text"
                  placeholder="شيك، خصم مباشر، بنك..."
                  value={newCommitment.notes}
                  onChange={(e) => setNewCommitment({ ...newCommitment, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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

      {/* 4. MODAL: EDIT COMMITMENT */}
      {editingCommitment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">تعديل الالتزام / القسط</h3>
              <button onClick={() => setEditingCommitment(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCommitment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البند:</label>
                <input
                  type="text"
                  required
                  value={editingCommitment.title}
                  onChange={(e) => setEditingCommitment({ ...editingCommitment, title: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ:</label>
                <input
                  type="number"
                  required
                  value={editingCommitment.amount}
                  onChange={(e) => setEditingCommitment({ ...editingCommitment, amount: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الاستحقاق:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCommitment({ ...editingCommitment, type: 'specific_date' })}
                    className={`py-2 px-3 text-xs rounded-xl font-bold transition ${
                      editingCommitment.type === 'specific_date' || (!editingCommitment.type && editingCommitment.due_date)
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    تاريخ محدد
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCommitment({ ...editingCommitment, type: 'monthly_day' })}
                    className={`py-2 px-3 text-xs rounded-xl font-bold transition ${
                      editingCommitment.type === 'monthly_day'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    شهري دوري
                  </button>
                </div>
              </div>

              {editingCommitment.type === 'monthly_day' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اليوم شهرياً:</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingCommitment.due_day || 15}
                    onChange={(e) => setEditingCommitment({ ...editingCommitment, due_day: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الاستحقاق:</label>
                  <input
                    type="date"
                    value={editingCommitment.due_date || editingCommitment.end_date || ''}
                    onChange={(e) => setEditingCommitment({ ...editingCommitment, due_date: e.target.value, end_date: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  تحديث الالتزام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT INCOME */}
      {editingIncome && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">تعديل مصدر الدخل</h3>
              <button onClick={() => setEditingIncome(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateIncome} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مصدر الدخل:</label>
                <input
                  type="text"
                  required
                  value={editingIncome.source}
                  onChange={(e) => setEditingIncome({ ...editingIncome, source: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الفعلي:</label>
                  <input
                    type="number"
                    required
                    value={editingIncome.amount}
                    onChange={(e) => setEditingIncome({ ...editingIncome, amount: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ المتوقع:</label>
                  <input
                    type="number"
                    value={editingIncome.expected_amount}
                    onChange={(e) => setEditingIncome({ ...editingIncome, expected_amount: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">طريقة الاستلام:</label>
                <select
                  value={editingIncome.payment_method}
                  onChange={(e) => setEditingIncome({ ...editingIncome, payment_method: e.target.value })}
                  className="w-full text-xs font-semibold px-2.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {paymentMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
                >
                  حفظ تعديل الدخل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: ADD / EDIT CATEGORY */}
      {newCategoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">إضافة فئة مصروفات جديدة</h3>
              <button onClick={() => setNewCategoryModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفئة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اشتراكات ودورات، أثاث..."
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية الشهرية المقترحة:</label>
                <input
                  type="number"
                  required
                  value={newCategoryForm.budget}
                  onChange={(e) => setNewCategoryForm({ ...newCategoryForm, budget: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition text-xs"
                >
                  إضافة الفئة فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">تعديل فئة المصروف</h3>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الفئة:</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الميزانية الشهرية:</label>
                <input
                  type="number"
                  required
                  value={editingCategory.budget}
                  onChange={(e) => setEditingCategory({ ...editingCategory, budget: e.target.value })}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition text-xs"
                >
                  حفظ تعديل الفئة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: EDIT PAYMENT METHOD */}
      {editingPaymentMethod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">تعديل اسم طريقة الدفع</h3>
              <button onClick={() => setEditingPaymentMethod(null)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الجديد:</label>
                <input
                  type="text"
                  required
                  value={editingPaymentMethod.newName}
                  onChange={(e) => setEditingPaymentMethod({ ...editingPaymentMethod, newName: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl transition text-xs"
                >
                  حفظ الاسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: ADD INCOME */}
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

    </div>
  );
}
