'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import {
  Upload, Camera, X, Loader2, Check, AlertCircle, ImageIcon, Receipt, Tag,
} from 'lucide-react';

interface Assignment {
  id: number;
  amount: number;
  createdAt: string;
  assignedToId: number;
  authorizedItems?: { id: number; name: string }[];
}

export default function NewPaymentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    vendorNumber: '',
    amount: '',
    reason: '',
    assignmentId: '',
  });
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadAssignments = async () => {
      setLoadingAssignments(true);
      try {
        // ?mine=true ensures only THIS user's own allocations are returned,
        // even if they have an ACCOUNTANT role.
        const data = await api.assignments.list({ mine: true });
        // Client-side guard: keep only allocations truly assigned to this user
        const safe = user
          ? data.filter((a: Assignment) => a.assignedToId === user.id)
          : data;
        setAssignments(safe);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAssignments(false);
      }
    };
    if (!authLoading) loadAssignments(); // wait for auth to resolve before fetching
  }, [authLoading, user]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setImages(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendorNumber', form.vendorNumber);
      formData.append('amount', form.amount);
      formData.append('reason', form.reason);
      formData.append('assignmentId', form.assignmentId);
      if (selectedBudgetItem) {
        formData.append('budgetItemName', selectedBudgetItem);
      }
      images.forEach(img => formData.append('images', img));
      await api.payments.create(formData);
      setSuccess(true);
      toast.success('Payment submitted successfully!');
      setTimeout(() => router.push('/transactions'), 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAssignment = assignments.find(
    a => a.id === Number(form.assignmentId)
  );
  const authorizedItems = selectedAssignment?.authorizedItems ?? [];

  const handleAssignmentChange = (value: string) => {
    setForm(p => ({ ...p, assignmentId: value }));
    setSelectedBudgetItem(''); // reset budget item when assignment changes
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Record New Expense</h1>
          <p className="text-sm text-gray-500">Fill in the details and attach receipt photos</p>
        </div>

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200 font-medium">
            <Check className="w-5 h-5 shrink-0" /> Payment submitted successfully! Redirecting…
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* ── Expense Details ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <Receipt className="w-4 h-4 text-primary" /> Expense Details
            </div>

            {/* Allocation select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Allocation <span className="text-red-400">*</span>
              </label>
              {loadingAssignments ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : assignments.length === 0 ? (
                <div className="w-full px-3 py-2.5 border border-amber-200 rounded-xl text-sm bg-amber-50 text-amber-700">
                  No active allocations found. Ask your accountant to assign you petty cash first.
                </div>
              ) : (
                <select
                  required
                  value={form.assignmentId}
                  onChange={e => handleAssignmentChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                >
                  <option value="">Choose an active petty cash allocation…</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>
                      RWF {a.amount.toLocaleString()} — Assigned on{' '}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Number <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. VND-001"
                  value={form.vendorNumber}
                  onChange={e => setForm(p => ({ ...p, vendorNumber: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (RWF) <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 5,000"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* ── Purpose / Budget Item — LinkedIn-style ── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Purpose / Budget Item
                </span>
              </label>

              {/* selected tag */}
              {selectedBudgetItem && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    <span>{selectedBudgetItem}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedBudgetItem('')}
                      className="hover:text-red-500 ml-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* available authorized items */}
              {!form.assignmentId ? (
                <p className="text-xs text-gray-400 italic py-1">
                  Select an allocation above to see authorized purposes.
                </p>
              ) : loadingAssignments ? (
                <div className="flex flex-wrap gap-2">
                  {[80, 100, 64, 90].map((w, i) => (
                    <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
                  ))}
                </div>
              ) : authorizedItems.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-1">
                  No specific purposes defined — any purpose is allowed.
                </p>
              ) : (
                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/80">
                  <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">
                    Click to select a purpose
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {authorizedItems
                      .filter((item: any) => item.name !== selectedBudgetItem)
                      .map((item: any) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedBudgetItem(item.name)}
                          className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-medium"
                        >
                          {item.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">
                You can select from authorized purposes above, or leave blank for a general expense.
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason / Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe what the expense was for…"
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>

          {/* ── Receipt Photos ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ImageIcon className="w-4 h-4 text-primary" /> Receipt Photos
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors flex-1 justify-center"
              >
                <Upload className="w-4 h-4" /> Upload Files
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-secondary hover:text-secondary transition-colors flex-1 justify-center"
              >
                <Camera className="w-4 h-4" /> Take Photo
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />

            {previews.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100"
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">
                No supporting documents attached yet
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || success || loadingAssignments}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Check className="w-4 h-4" /> Submit Expense</>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
