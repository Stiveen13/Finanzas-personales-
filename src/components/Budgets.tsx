import React, { useState } from 'react';
import { MonthlyBudget, Transaction } from '../types';
import { db } from '../lib/firebase';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Wallet, PieChart, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetsProps {
  budgets: MonthlyBudget[];
  uid: string;
  transactions: Transaction[];
}

export default function Budgets({ budgets, uid, transactions }: BudgetsProps) {
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const activeBudget = budgets.find(b => b.month === currentMonth + 1 && b.year === currentYear);
  
  const monthlyExpenses = transactions
    .filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const handleSaveBudget = async () => {
    if (!limit) return;
    setLoading(true);
    try {
      const budgetId = `${uid}_${currentYear}_${currentMonth + 1}`;
      await setDoc(doc(db, 'budgets', budgetId), {
        uid,
        year: currentYear,
        month: currentMonth + 1,
        limit: parseFloat(limit),
        createdAt: serverTimestamp()
      }, { merge: true });
      setLimit('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const percentage = activeBudget ? (monthlyExpenses / activeBudget.limit) * 100 : 0;
  const isOver = activeBudget && monthlyExpenses > activeBudget.limit;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Presupuesto Mensual</h2>
        <p className="text-slate-500">Controla tus gastos estableciendo límites claros.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-finance">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-slate-400" />
            Configuración de Presupuesto
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Define cuánto planeas gastar este mes ({format(new Date(), 'MMMM yyyy')}).
          </p>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Límite Mensual</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                <input 
                  type="number" 
                  placeholder={activeBudget ? activeBudget.limit.toString() : "0.00"} 
                  className="w-full pl-8 py-4 text-xl font-bold"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>
            </div>
            <button 
              onClick={handleSaveBudget}
              disabled={loading}
              className="btn-primary w-full py-4 text-lg"
            >
              {loading ? 'Guardando...' : activeBudget ? 'Actualizar Presupuesto' : 'Establecer Presupuesto'}
            </button>
          </div>
        </div>

        <div className="card-finance">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <PieChart size={20} className="text-slate-400" />
            Estado Actual
          </h3>

          {activeBudget ? (
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-slate-500 text-sm">Has gastado</p>
                  <p className={`text-4xl font-bold ${isOver ? 'text-rose-600' : 'text-slate-900'}`}>
                    ${monthlyExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-sm">De un total de</p>
                  <p className="text-xl font-semibold text-slate-600">
                    ${activeBudget.limit.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${isOver ? 'bg-brand-accent' : 'bg-brand-primary shadow-[0_0_12px_rgba(99,102,241,0.3)]'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-extrabold text-brand-muted uppercase tracking-widest">
                  <span>0%</span>
                  <span className={isOver ? 'text-brand-accent' : 'text-brand-primary'}>{Math.round(percentage)}% consumido</span>
                  <span>100%</span>
                </div>
              </div>

              <div className={`p-5 rounded-3xl flex gap-3 ${isOver ? 'bg-rose-50 text-brand-accent' : 'bg-brand-bg text-brand-primary'}`}>
                {isOver ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                <p className="text-sm font-bold">
                  {isOver 
                    ? `¡Atención! Has superado tu presupuesto por $${(monthlyExpenses - activeBudget.limit).toLocaleString()}.`
                    : `Vas por buen camino. Te quedan $${(activeBudget.limit - monthlyExpenses).toLocaleString()} antes de alcanzar el límite.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Wallet size={32} />
              </div>
              <p className="text-slate-400 max-w-[200px]">Establece un límite de gastos para ver tu progreso aquí.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
