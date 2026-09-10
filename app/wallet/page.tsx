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
  Smartphone,
  Pencil,
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

interface Collection {
  id: string;
  amount: number;
  cnumber: string;
  msisdn: string;
  customerRef: string | null;
  refid: string | null;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED';
  providerStatus: string | null;
  note: string | null;
  createdAt: string;
  message?: string;
}

const COLLECTION_STATUS_META: Record<string, { label: string; classes: string; pulse?: boolean }> = {
  PENDING: { label: 'Awaiting approval', classes: 'bg-amber-50 text-amber-600', pulse: true },
  SUCCESSFUL: { label: 'Funded', classes: 'bg-green-50 text-green-600' },
  FAILED: { label: 'Failed', classes: 'bg-rose-50 text-rose-600' },
};

function amountClass(type: string) {
  return type === 'CREDIT'
    ? 'text-green-600'
    : 'text-rose-600';
}

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [collectingId, setCollectingId] = useState<string | null>(null);

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
      // Gateway unreachable — keep showing stored balance.
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

  const fetchCollections = useCallback(async () => {
    try {
      const data = await api.collections.list();
      setCollections(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const syncPendingCollections = useCallback(async () => {
    const pending = collections.filter(c => c.status === 'PENDING' && c.refid);
    for (const c of pending) {
      try {
        await api.collections.check(c.id);
      } catch (err) {
        console.error(err);
      }
    }
    await fetchCollections();
    await fetchWallet();
    await fetchLedger();
  }, [collections, fetchCollections, fetchWallet, fetchLedger]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchWallet(), fetchLedger(), fetchCollections()]);
      setLoading(false);
      syncLive();
      syncPendingCollections();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchWallet, fetchLedger, fetchCollections]);

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

  // ----- Fund Wallet modal -----
  const [showFund, setShowFund] = useState(false);
  const [fundMethod, setFundMethod] = useState<'momo' | 'manual'>('momo');
  const [fundAmount, setFundAmount] = useState('');
  const [fundPhone, setFundPhone] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [fundSaving, setFundSaving] = useState(false);

  const refreshWalletData = async () => {
    await Promise.all([fetchWallet(), fetchLedger(), fetchCollections()]);
  };

  const fundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(fundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setFundSaving(true);
    try {
      if (fundMethod === 'manual') {
        await api.wallet.credit({ amount, note: fundNote });
        toast.success('Manual top-up recorded');
      } else {
        if (!/^0?7\d{8}$/.test((fundPhone || '').replace(/\s/g, ''))) {
          toast.error('Enter a valid 10-digit mobile number (e.g. 0788302208)');
          setFundSaving(false);
          return;
        }
        const created = await api.collections.create({ amount, msisdn: fundPhone, note: fundNote });
        toast.success(created.message || 'Collection initiated — customer approves payment on 182*7*1#');
      }
      setFundAmount('');
      setFundPhone('');
      setFundNote('');
      setShowFund(false);
      await refreshWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to fund wallet');
    } finally {
      setFundSaving(false);
    }
  };

  const checkCollection = async (c: Collection) => {
    setCollectingId(c.id);
    try {
      const updated = await api.collections.check(c.id);
      toast.success(updated.status === 'SUCCESSFUL'
        ? 'Payment confirmed — wallet funded'
        : `Status: ${updated.status}`);
      await refreshWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to check collection');
    } finally {
      setCollectingId(null);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFund(true)}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors border border-primary/20"
            >
              <Plus className="w-4 h-4" />
              Fund Wallet
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

        {/* Funding requests (MoMo collections) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-gray-900">Funding Requests</h3>
            </div>
            <span className="text-xs text-gray-400">status syncs automatically</span>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </div>
          ) : collections.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No funding requests yet — click Fund Wallet to collect money into the wallet via mobile money.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Amount</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">Phone</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Reference</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {collections.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-semibold text-gray-800">
                        RWF {c.amount.toLocaleString()}
                        {c.note && <p className="text-[11px] font-normal text-gray-400">{c.note}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs hidden sm:table-cell">{c.cnumber}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${COLLECTION_STATUS_META[c.status]?.classes || 'bg-gray-100 text-gray-500'}`}>
                          {COLLECTION_STATUS_META[c.status]?.pulse && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {COLLECTION_STATUS_META[c.status]?.label || c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 font-mono text-xs hidden md:table-cell">{c.customerRef || c.refid || '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        {c.status === 'PENDING' ? (
                          <button
                            type="button"
                            disabled={collectingId === c.id}
                            onClick={() => checkCollection(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                          >
                            {collectingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Check
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">{new Date(c.createdAt).toLocaleDateString()}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {/* Fund Wallet modal */}
      {showFund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !fundSaving && setShowFund(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Fund Wallet</h3>
              <button onClick={() => setShowFund(false)} disabled={fundSaving} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setFundMethod('momo')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${fundMethod === 'momo' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              >
                <Smartphone className="w-4 h-4" /> Mobile Money
              </button>
              <button
                type="button"
                onClick={() => setFundMethod('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${fundMethod === 'manual' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              >
                <Pencil className="w-4 h-4" /> Manual Record
              </button>
            </div>

            <form onSubmit={fundWallet} className="space-y-4">
              {fundMethod === 'momo' ? (
                <>
                  <p className="text-xs text-gray-400">
                    Initiates a real collection via XentriPay. The customer approves the payment on their phone (
                    <span className="font-medium text-gray-500">182*7*1#</span>), after which the wallet is credited automatically.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      autoFocus
                      value={fundAmount}
                      onChange={e => setFundAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Mobile Number</label>
                    <input
                      type="tel"
                      required
                      value={fundPhone}
                      onChange={e => setFundPhone(e.target.value)}
                      placeholder="e.g. 0788302208"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400">
                    Records a manual top-up (e.g. cash deposited into the gateway). Use the Mobile Money option to collect funds through XentriPay instead.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RWF)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      autoFocus
                      value={fundAmount}
                      onChange={e => setFundAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <input
                      type="text"
                      value={fundNote}
                      onChange={e => setFundNote(e.target.value)}
                      placeholder="e.g. Cash deposited into gateway"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                  </div>
                </>
              )}
              <button
                type="submit"
                disabled={fundSaving}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70"
              >
                {fundSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {fundMethod === 'momo' ? 'Initiate Collection' : 'Add Funds'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}