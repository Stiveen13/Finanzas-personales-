import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Trash2, Plus, Filter, Search, ReceiptText, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionsProps {
  transactions: Transaction[];
  uid: string;
  currency: string;
}

const CATEGORIES = [
  'Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Otros', 'Salario', 'Freelance', 'Inversión'
];

export default function Transactions({ transactions, uid, currency }: TransactionsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'transactions'), {
        uid,
        amount: parseFloat(amount),
        type,
        category,
        description,
        date: new Date(date),
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = transactions.filter(t => 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Transacciones</h2>
          <p className="text-slate-500">Historial completo de tus movimientos.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nueva Transacción
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por descripción o categoría..." 
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card-finance overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Monto</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(t => {
                const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {format(d, 'dd MMM, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {t.type === 'income' ? 
                          <ArrowUpCircle className="text-brand-secondary" size={22} /> : 
                          <ArrowDownCircle className="text-brand-accent" size={22} />
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-50 rounded-lg text-[11px] font-bold text-brand-muted border border-slate-100">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-brand-text truncate max-w-[200px]">
                      {t.description || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm font-extrabold text-right whitespace-nowrap ${t.type === 'income' ? 'text-brand-secondary' : 'text-brand-text'}`}>
                      {t.type === 'income' ? '+' : '-'}{currency}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No se encontraron transacciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Nueva Movimiento</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}
                >
                  Gasto
                </button>
                <button 
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                >
                  Ingreso
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Monto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">{currency}</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="w-full pl-8 py-4 text-xl font-bold"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Categoría</label>
                  <select 
                    className="w-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha</label>
                  <input 
                    type="date" 
                    className="w-full"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción</label>
                <input 
                  type="text" 
                  placeholder="Ej: Almuerzo con amigos" 
                  className="w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-4 text-lg mt-4"
              >
                {loading ? 'Guardando...' : 'Registrar'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
