'use client';

import { useEffect, useState } from 'react';
import { api, UPLOADS_BASE } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import MonthScroller from '@/components/MonthScroller';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt, Search, Loader2, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface Payment {
  id: number;
  vendorNumber: string;
  amount: number;
  reason: string;
  images: string[];
  createdAt: string;
  employee?: { name: string; email: string; department?: string };
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    setLoading(true);
    api.payments.list({ month: selectedMonth })
      .then(setPayments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const filtered = payments.filter(p =>
    p.reason.toLowerCase().includes(search.toLowerCase()) ||
    p.vendorNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.employee?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = filtered.reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500">
              {filtered.length} record{filtered.length !== 1 ? 's' : ''} · Total: <span className="text-rose-600 font-semibold">RWF {totalSpent.toLocaleString()}</span>
            </p>
          </div>
        </div>

        {/* Timeline Filter */}
        <MonthScroller 
          year={selectedYear} 
          value={selectedMonth} 
          onChange={(val) => {
            const parts = val.split('-');
            setSelectedYear(Number(parts[0]));
            setSelectedMonth(val);
          }} 
        />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by reason, vendor, or employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(p => (
                <div key={p.id} className="transition-colors">
                  <div
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.reason}</p>
                        {user?.role === 'ACCOUNTANT' && p.employee && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.employee.name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">Vendor #{p.vendorNumber} · {new Date(p.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-600">-RWF {p.amount.toLocaleString()}</p>
                        {p.images.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                            <ImageIcon className="w-3 h-3" /> {p.images.length}
                          </span>
                        )}
                      </div>
                      {expanded === p.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expanded === p.id && (
                    <div className="px-5 pb-5 bg-gray-50/50 border-t border-gray-100">
                      <div className="pt-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Description</p>
                          <p className="text-sm text-gray-700 mt-1">{p.reason}</p>
                        </div>
                        {p.employee && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Employee</p>
                            <p className="text-sm text-gray-700 mt-1">{p.employee.name} ({p.employee.email})</p>
                            {p.employee.department && <p className="text-xs text-gray-400">{p.employee.department}</p>}
                          </div>
                        )}
                        {p.images.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Supporting documents</p>
                            <div className="flex flex-wrap gap-2">
                              {p.images.map((img, i) => (
                                <a key={i} href={`${UPLOADS_BASE}${img}`} target="_blank" rel="noreferrer">
                                  <img
                                    src={`${UPLOADS_BASE}${img}`}
                                    alt={`Receipt ${i + 1}`}
                                    className="w-20 h-20 object-cover rounded-xl border border-gray-200 hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
