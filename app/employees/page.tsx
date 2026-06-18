'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Search, Loader2, X, Check, AlertCircle, User, Copy, Eye, EyeOff
} from 'lucide-react';

interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'EMPLOYEE' | 'ACCOUNTANT';
  createdAt: string;
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  department: '',
  role: 'EMPLOYEE' as 'EMPLOYEE' | 'ACCOUNTANT',
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<typeof emptyForm & { id?: number }>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [generateNewPwd, setGenerateNewPwd] = useState(false);

  // displayed after create or edit when backend returns a generated password
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showGenPwd, setShowGenPwd] = useState(false);

  const fetchEmployees = async () => {
    try {
      const data = await api.employees.list();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setError('');
    setGenerateNewPwd(false);
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({ name: emp.name, email: emp.email, phone: emp.phone || '', department: emp.department || '', role: emp.role });
    setError('');
    setGenerateNewPwd(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        const payload: any = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          department: form.department,
          role: form.role,
        };
        if (generateNewPwd) {
          payload.generateNewPassword = true;
        }
        const res = await api.employees.update(editing.id, payload);
        if (res.generatedPassword) {
          setGeneratedPassword(res.generatedPassword);
          setShowGenPwd(false);
        }
        toast.success('Employee updated successfully');
      } else {
        const res = await api.employees.create(form);
        setGeneratedPassword(res.generatedPassword);
        setShowGenPwd(false);
        toast.success('Employee created successfully');
      }
      await fetchEmployees();
      setShowModal(false);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.employees.delete(id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('Employee deleted successfully');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete employee');
    } finally {
      setDeleteId(null);
    }
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Employees</h1>
            <p className="text-sm text-gray-500">{employees.length} member{employees.length !== 1 ? 's' : ''} registered</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Name</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Email</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Department</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Role</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-400 sm:hidden">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 hidden sm:table-cell">{emp.email}</td>
                      <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{emp.department || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          emp.role === 'ACCOUNTANT' ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {emp.role.charAt(0) + emp.role.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(emp.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Employee' : 'Add New Employee'}</h2>
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
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Full Name', key: 'name', type: 'text', required: true },
                  { label: 'Email', key: 'email', type: 'email', required: true },
                  { label: 'Phone', key: 'phone', type: 'tel', required: false },
                  { label: 'Department', key: 'department', type: 'text', required: false },
                ].map(({ label, key, type, required }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type}
                      required={required}
                      value={(form as any)[key]}
                      onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                ))}

                {/* Generate new password toggle — only when editing */}
                {editing && (
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div
                      onClick={() => setGenerateNewPwd(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${generateNewPwd ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${generateNewPwd ? 'translate-x-5' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">Generate new password</span>
                      <p className="text-xs text-gray-400">A new random password will be created for this employee</p>
                    </div>
                  </label>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value as 'EMPLOYEE' | 'ACCOUNTANT' }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password reveal modal — shown after create or edit-when-pwd-generated */}
      {generatedPassword && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {editing ? 'New Password Generated' : 'Employee Created'}
                </h3>
                <p className="text-sm text-gray-500">
                  {editing
                    ? 'The employee password has been reset. Share the new password with them.'
                    : 'Save this password — you will need it to share with the employee.'}
                </p>
              </div>
            </div>

            <div className="relative">
              <input
                type={showGenPwd ? 'text' : 'password'}
                readOnly
                value={generatedPassword}
                className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-mono tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowGenPwd(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showGenPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  toast.success('Password copied to clipboard');
                }}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy Password
              </button>
              <button
                type="button"
                onClick={() => setGeneratedPassword(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Employee?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}