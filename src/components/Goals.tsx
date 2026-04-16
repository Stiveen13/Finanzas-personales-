import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Target, Plus, X, Trash2, TrendingUp, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

interface GoalsProps {
  goals: SavingsGoal[];
  uid: string;
}

export default function Goals({ goals, uid }: GoalsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form sate
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'savings_goals'), {
        uid,
        name,
        targetAmount: parseFloat(target),
        currentAmount: parseFloat(current),
        deadline: deadline ? new Date(deadline) : null,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setName('');
      setTarget('');
      setCurrent('0');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (goalId: string, currentAmount: number, delta: number) => {
    try {
      await updateDoc(doc(db, 'savings_goals', goalId), {
        currentAmount: Math.max(0, currentAmount + delta)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return;
    await deleteDoc(doc(db, 'savings_goals', id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Metas de Ahorro</h2>
          <p className="text-slate-500">Manten el enfoque en tus objetivos financieros.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nueva Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const deadlineDate = goal.deadline?.toDate ? goal.deadline.toDate() : (goal.deadline ? new Date(goal.deadline) : null);

          return (
            <div key={goal.id} className="card-finance flex flex-col group relative bg-white border-2 border-slate-50">
              <button 
                onClick={() => handleDelete(goal.id)}
                className="absolute top-4 right-4 text-brand-muted hover:text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{goal.name}</h3>
                  {deadlineDate && (
                    <div className="flex items-center gap-1 text-brand-muted text-[10px] font-extrabold uppercase tracking-widest">
                       <Calendar size={12} />
                       {format(deadlineDate, 'dd MMM, yyyy')}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-brand-muted uppercase font-extrabold tracking-tight">Ahorrado</p>
                    <p className="text-xl font-extrabold">${goal.currentAmount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-brand-muted uppercase font-extrabold tracking-tight">Objetivo</p>
                    <p className="text-sm font-bold text-slate-400">${goal.targetAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-brand-primary rounded-full"
                  />
                </div>
                
                <div className="flex items-center justify-between mt-2">
                   <span className={`budget-pill ${progress >= 100 ? 'pill-ok' : (progress < 25 ? 'pill-warning' : 'pill-ok')}`}>
                     {progress >= 100 ? 'Completado' : (progress < 25 ? 'Aumentar cuota' : 'En camino')}
                   </span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => updateGoalProgress(goal.id, goal.currentAmount, 50)}
                    className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    +$50
                  </button>
                  <button 
                    onClick={() => updateGoalProgress(goal.id, goal.currentAmount, 100)}
                    className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    +$100
                  </button>
                  <button 
                    onClick={() => {
                        const amount = prompt('Cuánto quieres agregar?');
                        if (amount) updateGoalProgress(goal.id, goal.currentAmount, parseFloat(amount));
                    }}
                    className="flex-1 py-2 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Personalizado
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
            <Target className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-400">Aún no tienes metas de ahorro. ¡Crea una para comenzar!</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Nueva Meta</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre de la Meta</label>
                <input 
                  type="text" 
                  placeholder="Ej: Viaje a Japón, Auto nuevo..." 
                  className="w-full"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Monto Objetivo</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full"
                    required
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Monto Inicial</label>
                  <input 
                    type="number" 
                    className="w-full"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha Límite (Opcional)</label>
                <input 
                  type="date" 
                  className="w-full"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary w-full py-4 text-lg mt-4"
              >
                {loading ? 'Creando...' : 'Establecer Meta'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
