'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';
import {
  Wallet,
  Landmark,
  RefreshCw,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  ShieldAlert,
  Info,
  Plus,
  X,
} from 'lucide-react';

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  liveBalance: number | null;
  payoutMode: 'AUTO' | 'MANUAL';
  providerConfigured: boolean;
  liveError?: string;
  message?: string;
}

interface LedgerEntry {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string | null;
  reference: string | null;
  paymentId: string | null;
  createdAt: string;
}

function amountClass(type: string) {
  return type === 'CREDIT'
    ? 'text-green-600'
    : 'text-rose-600';
}

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMode, setSavingMode] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const data = await api.wallet.get();
      setWallet(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load wallet');
    }
  }, []);

  const syncLive = useCallback(async () => {
    try {
      const data = await api.wallet.refresh();
      setWallet(prev => ({ ...(prev as WalletData), ...data }));
    } catch (err) {
      // Gateway unreachable — keep showing stored balance; refresh button reports the error.
      console.error('Live sync failed', err);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      const data = await api.wallet.ledger();
      setLedger(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchWallet(), fetchLedger()]);
      setLoading(false);
      syncLive();
    })();
  }, [fetchWallet, fetchLedger, syncLive]);

  if (user?.role !== 'ACCOUNTANT') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldAlert className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Only accountants can manage the organisation wallet.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.wallet.refresh();
      setWallet(prev => ({ ...(prev as WalletData), ...data }));
      toast.success('Wallet balance refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh wallet balance');
    } finally {
      setRefreshing(false);
    }
  };

  const setPayoutMode = async (mode: 'AUTO' | 'MANUAL') => {
    setSavingMode(true);
    try {
      const data = await api.wallet.update({ payoutMode: mode });
      setWallet(prev => ({ ...(prev as WalletData), payoutMode: data.payoutMode }));
      toast.success(mode === 'AUTO'
        ? 'Payouts will be sent automatically when an expense is submitted'
        : 'Expenses will wait for your approval before payout');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payout mode');
    } finally {
      setSavingMode(false);
    }
  };

  const displayBalance = wallet?.liveBalance ?? wallet?.balance ?? 0;

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [topUpSaving, setTopUpSaving] = useState(false);

  const topUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topUpAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setTopUpSaving(true);
    try {
      await api.wallet.credit({ amount, note: topUpNote });
      toast.success('Wallet topped up');
      setTopUpAmount('');
      setTopUpNote('');
      setShowTopUp(false);
      await fetchWallet();
      await fetchLedger();
    } catch (err: any) {
      toast.error(err.message || 'Failed to top up wallet');
    } finally {
      setTopUpSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Organisation Wallet</h1>
            <p className="text-sm text-gray-500">Managed by the accountant · powered by XentriPay</p>
          </div>
          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors border border-primary/20"
          >
            <Plus className="w-4 h-4" />
            Top Up
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Balance
          </button>
        </div>

        {/* Balance hero */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium opacity-80 flex items-center gap-1.5">
                <Landmark className="w-4 h-4" /> Available Balance
              </p>
              <p className="text-4xl font-bold mt-1">
                {wallet?.currency || 'RWF'} {displayBalance.toLocaleString()}
              </p>
              {wallet?.liveBalance != null && wallet.liveBalance !== wallet.balance && (
                <p className="text-xs opacity-75 mt-1">
                  Stored: {wallet.currency} {wallet.balance.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${wallet?.providerConfigured ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>
                {wallet?.providerConfigured ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {wallet?.providerConfigured ? 'Gateway Connected' : 'Gateway Not Configured'}
              </span>
              {wallet?.liveError && (
                <p className="text-[11px] opacity-75 text-right">{wallet.liveError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payout mode */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Payout Mode</h3>
                <p className="text-xs text-gray-400 mt-0.5 max-w-md">
                  AUTO sends payouts the moment an expense is submitted. MANUAL lets you review and send payouts from the transactions page.
                </p>
              </div>
            </div>
            <div className="flex p-1 bg-gray-100 rounded-xl">
              {(['AUTO', 'MANUAL'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  disabled={savingMode}
                  onClick={() => setPayoutMode(mode)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    wallet?.payoutMode === mode
                      ? 'bg-white shadow text-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode === 'AUTO' ? 'Auto' : 'Manual'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-gray-900">Wallet Ledger</h3>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : ledger.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No wallet activity yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Event</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Reference</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ledger.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {entry.type === 'CREDIT' ? (
                            <ArrowUpCircle className={`w-4 h-4 ${amountClass('CREDIT')}`} />
                          ) : (
                            <ArrowDownCircle className={`w-4 h-4 ${amountClass('DEBIT')}`} />
                          )}
                          <span className="text-gray-700">{entry.description || entry.type}</span>
                        </div>
                      </td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${amountClass(entry.type)}`}>
                        {entry.type === 'CREDIT' ? '+' : '-'}RWF {entry.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs hidden md:table-cell">
                        {entry.reference || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs hidden sm:table-cell">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showTopUp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !topUpSaving && setShowTopUp(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Top Up Wallet</h3>
              <button onClick={() => setShowTopUp(false)} disabled={topUpSaving} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Records a manual top-up. If you funded the XentriPay gateway externally, this keeps your stored ledger in sync.
            </p>
            <form onSubmit={topUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  value={topUpNote}
                  onChange={e => setTopUpNote(e.target.value)}
                  placeholder="e.g. Cash deposited into gateway"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={topUpSaving}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {topUpSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Funds
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}