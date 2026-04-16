import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { 
  Transaction, 
  SavingsGoal, 
  MonthlyBudget, 
  UserSettings 
} from './types';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Target, 
  Wallet, 
  Plus, 
  LogOut, 
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

// Components (We'll define these inline or small ones here, larger ones in separate files later if needed)
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import Budgets from './components/Budgets';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        // Ensure user doc exists
        const userRef = doc(db, 'users', u.uid);
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || 'Usuario',
          currency: 'USD',
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to data
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setBudgets([]);
      setSettings(null);
      return;
    }

    // Transactions listener
    const qTrans = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubTrans = onSnapshot(qTrans, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });

    // Goals listener
    const qGoals = query(
      collection(db, 'savings_goals'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubGoals = onSnapshot(qGoals, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)));
    });

    // Budgets listener
    const qBudgets = query(
      collection(db, 'budgets'),
      where('uid', '==', user.uid)
    );
    const unsubBudgets = onSnapshot(qBudgets, (snap) => {
      setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() } as MonthlyBudget)));
    });

    // Settings listener
    const unsubSettings = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setSettings(snap.data() as UserSettings);
    });

    return () => {
      unsubTrans();
      unsubGoals();
      unsubBudgets();
      unsubSettings();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-slate-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f5f5f5] p-4 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-white">
          <Wallet size={32} />
        </div>
        <h1 className="text-3xl font-bold mb-2">Finanzas Pro</h1>
        <p className="text-slate-500 mb-8 max-w-sm">Gestiona tus ingresos, gastos y ahorros de forma sencilla y segura.</p>
        <button 
          onClick={signInWithGoogle}
          className="btn-primary flex items-center gap-3 px-8 py-3 text-lg"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  const handleCurrencyChange = async (newCurrency: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { currency: newCurrency }, { merge: true });
    } catch (err) {
      console.error("Error updating currency:", err);
    }
  };

  const currencySymbol = settings?.currency === 'EUR' ? '€' : settings?.currency === 'COP' ? 'COP $' : '$';

  const tabs = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transacciones', icon: ReceiptText },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'budgets', label: 'Presupuestos', icon: Wallet },
  ];

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[260px] bg-white border-r-2 border-brand-border flex-col py-10 px-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white">
            <Wallet size={18} />
          </div>
          <span className="font-extrabold text-2xl tracking-tighter text-brand-primary">FinanzaPro</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] font-bold text-[15px] transition-all ${
                activeTab === tab.id ? 'nav-item-active' : 'nav-item-inactive'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t-2 border-slate-50">
          <div className="px-2 mb-4">
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-2 px-2">Moneda</p>
            <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
              {['USD', 'EUR', 'COP'].map((curr) => (
                <button
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    settings?.currency === curr ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-2">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-sm">{user.displayName}</p>
              <p className="text-[11px] text-brand-muted uppercase font-bold tracking-tight">Premium</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-brand-accent hover:bg-rose-50 transition-colors"
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Wallet className="text-slate-900" size={24} />
            <span className="font-bold text-lg">Finanzas Pro</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  transactions={transactions} 
                  goals={goals} 
                  budgets={budgets}
                  settings={settings}
                  currency={currencySymbol}
                />
              )}
              {activeTab === 'transactions' && (
                <Transactions 
                  transactions={transactions} 
                  uid={user.uid}
                  currency={currencySymbol}
                />
              )}
              {activeTab === 'goals' && (
                <Goals 
                  goals={goals} 
                  uid={user.uid}
                  currency={currencySymbol}
                />
              )}
              {activeTab === 'budgets' && (
                <Budgets 
                  budgets={budgets} 
                  uid={user.uid}
                  transactions={transactions}
                  currency={currencySymbol}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white p-8 flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-10">
                <span className="font-bold text-xl">Menú</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 flex-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-lg transition-colors ${
                      activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500'
                    }`}
                  >
                    <tab.icon size={24} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-lg text-red-500"
                >
                  <LogOut size={24} />
                  Cerrar sesión
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
