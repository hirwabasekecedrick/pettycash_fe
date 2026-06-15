'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
  Upload, Camera, X, Loader2, Check, AlertCircle, ImageIcon, Receipt
} from 'lucide-react';

export default function NewPaymentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ vendorNumber: '', amount: '', reason: '' });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      images.forEach(img => formData.append('images', img));
      await api.payments.create(formData);
      setSuccess(true);
      setTimeout(() => router.push('/transactions'), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
            <Check className="w-5 h-5 shrink-0" /> Payment submitted successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Form fields */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1">
              <Receipt className="w-4 h-4 text-primary" /> Expense Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Number <span className="text-red-400">*</span></label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF) <span className="text-red-400">*</span></label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="e.g. 5000"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Description <span className="text-red-400">*</span></label>
              <textarea
                required
                rows={3}
                placeholder="Describe what the expense was for..."
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors resize-none"
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ImageIcon className="w-4 h-4 text-primary" /> Receipt Photos
            </div>

            {/* Upload buttons */}
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

            {/* Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
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
            )}
            {previews.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">No receipts attached yet</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || success}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            ) : (
              <><Check className="w-4 h-4" /> Submit Expense</>
            )}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
