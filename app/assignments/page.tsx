'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Wallet, Loader2, AlertCircle, X, Check, CalendarDays } from 'lucide-react';

interface Employee { id: number; name: string; email: string; }
interface Assignment {
  id: number;
  amount: number;
  createdAt: string;
  assignedTo: { name: string; email: string };
  assignedBy: { name: string };
  authorizedItems?: { id: number; name: string }[];
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assignedToId: '', amount: '' });
  const [authorizedItems, setAuthorizedItems] = useState<string[]>([]);
  const [budgetInput, setBudgetInput] = useState('');
  const [masterBudgetItems, setMasterBudgetItems] = useState<{id: number, name: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [assignData, empData, budgetData] = await Promise.all([
        api.assignments.list(),
        user?.role === 'ACCOUNTANT' ? api.employees.list() : Promise.resolve([]),
        user?.role === 'ACCOUNTANT' ? api.budgetItems.list() : Promise.resolve([]),
      ]);
      setAssignments(assignData);
      setEmployees(empData);
      setMasterBudgetItems(budgetData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addBudgetItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !authorizedItems.includes(trimmed)) {
      setAuthorizedItems(prev => [...prev, trimmed]);
    }
    setBudgetInput('');
  };

  const removeBudgetItem = (item: string) => {
    setAuthorizedItems(prev => prev.filter(i => i !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.assignments.create({ 
        assignedToId: Number(form.assignedToId), 
        amount: Number(form.amount),
        authorizedItems
      });
      await fetchData();
      setShowModal(false);
      setForm({ assignedToId: '', amount: '' });
      setAuthorizedItems([]);
      setBudgetInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAssigned = assignments.reduce((sum, a) => sum + a.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cash Assignments</h1>
            <p className="text-sm text-gray-500">Total assigned: <span className="text-primary font-semibold">RWF {totalAssigned.toLocaleString()}</span></p>
          </div>
          {user?.role === 'ACCOUNTANT' && (
            <button
              onClick={() => { setShowModal(true); setError(''); }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Assign Cash
            </button>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No assignments yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {a.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="font-semibold text-gray-900">{a.assignedTo.name}</p>
                <p className="text-xs text-gray-500 mb-3">{a.assignedTo.email}</p>
                  <div className="border-t border-gray-50 pt-3">
                    <p className="text-2xl font-bold text-primary">RWF {a.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 mb-2">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(a.createdAt).toLocaleDateString()} · by {a.assignedBy.name}
                    </div>
                    {a.authorizedItems && a.authorizedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.authorizedItems.map((item: any) => (
                          <span key={item.id} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        {/* Assign Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Assign Petty Cash</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    required
                    value={form.assignedToId}
                    onChange={e => setForm(prev => ({ ...prev, assignedToId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={form.amount}
                    onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
                
                {/* Budget Items / Purposes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Authorized Purposes (Optional)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      list="budget-items-list"
                      placeholder="Type purpose and press enter..."
                      value={budgetInput}
                      onChange={e => setBudgetInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addBudgetItem(budgetInput);
                        }
                      }}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                    />
                    <button 
                      type="button" 
                      onClick={() => addBudgetItem(budgetInput)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <datalist id="budget-items-list">
                    {masterBudgetItems.map(item => (
                      <option key={item.id} value={item.name} />
                    ))}
                  </datalist>
                  {authorizedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {authorizedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                          <span>{item}</span>
                          <button type="button" onClick={() => removeBudgetItem(item)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Assign
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }
