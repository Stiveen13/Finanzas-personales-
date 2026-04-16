import React from 'react';
import { Transaction, SavingsGoal, MonthlyBudget, UserSettings } from '../types';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, isSameMonth } from 'date-fns';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
  budgets: MonthlyBudget[];
  settings: UserSettings | null;
}

export default function Dashboard({ transactions, goals, budgets, settings }: DashboardProps) {
  const currency = settings?.currency || '$';

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expenses;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyExpenses = transactions
    .filter(t => {
      const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const activeBudget = budgets.find(b => b.month === currentMonth + 1 && b.year === currentYear);

  // Chart data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = format(d, 'dd MMM');
    
    const dayIncome = transactions
      .filter(t => {
        const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return t.type === 'income' && format(td, 'dd MMM') === dayStr;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const dayExpense = transactions
      .filter(t => {
        const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        return t.type === 'expense' && format(td, 'dd MMM') === dayStr;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    return { name: dayStr, ingreso: dayIncome, gasto: dayExpense };
  });

  const categoryData = Array.from(new Set(transactions.filter(t => t.type === 'expense').map(t => t.category)))
    .map(cat => ({
      name: cat,
      value: transactions.filter(t => t.category === cat && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Hola, {settings?.displayName || 'Usuario'}</h2>
        <p className="text-slate-500">Aquí tienes un resumen de tu actividad financiera.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <span className="stat-label">Balance Total</span>
          <div className="stat-value">{currency}{balance.toLocaleString()}</div>
          <div className="text-[12px] text-brand-secondary font-bold mt-1">↑ 8.2% vs mes anterior</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Ingresos</span>
          <div className="stat-value text-brand-secondary">+{currency}{income.toLocaleString()}</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Gastos</span>
          <div className="stat-value text-brand-accent">-{currency}{expenses.toLocaleString()}</div>
        </div>
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-finance">
          <h4 className="font-bold text-lg mb-6">Actividad (Últimos 7 días)</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="ingreso" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIngreso)" />
                <Area type="monotone" dataKey="gasto" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorGasto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-finance">
          <h4 className="font-bold text-lg mb-6">Gastos por Categoría</h4>
          <div className="h-[300px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <p className="text-slate-400 italic">No hay datos de gastos registrados.</p>
            )}
          </div>
        </div>
      </div>

      {/* Budget Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-finance lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-lg">Presupuesto Mensual</h4>
                <p className="text-sm text-slate-500">{format(new Date(), 'MMMM yyyy')}</p>
            </div>
            {activeBudget ? (
                <div className="space-y-4">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Gastado: {currency}{monthlyExpenses.toLocaleString()}</span>
                        <span className="font-bold">Límite: {currency}{activeBudget.limit.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${monthlyExpenses > activeBudget.limit ? 'bg-rose-500' : 'bg-slate-900'}`}
                            style={{ width: `${Math.min((monthlyExpenses / activeBudget.limit) * 100, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-400">
                        {monthlyExpenses > activeBudget.limit 
                            ? `Has excedido tu presupuesto por ${currency}${(monthlyExpenses - activeBudget.limit).toLocaleString()}`
                            : `Te quedan ${currency}${(activeBudget.limit - monthlyExpenses).toLocaleString()} disponibles`}
                    </p>
                </div>
            ) : (
                <div className="text-center py-6">
                    <p className="text-slate-400 mb-4">No has establecido un presupuesto para este mes.</p>
                </div>
            )}
        </div>

        <div className="card-finance">
            <h4 className="font-bold text-lg mb-6">Próximas Metas</h4>
            <div className="space-y-6">
                {goals.slice(0, 3).map(goal => (
                    <div key={goal.id}>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-slate-700">{goal.name}</span>
                            <span className="text-slate-500">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500"
                                style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
                {goals.length === 0 && <p className="text-slate-400 italic text-sm">No hay metas activas.</p>}
            </div>
        </div>
      </div>
    </div>
  );
}
