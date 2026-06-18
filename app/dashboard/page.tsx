'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import MonthScroller from '@/components/MonthScroller';
import Link from 'next/link';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Receipt,
  Plus,
  Users,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface Stats {
  totalAssigned: number;
  totalSpent: number;
  remaining: number;
}

interface Payment {
  id: number;
  vendorNumber: string;
  amount: number;
  reason: string;
  createdAt: string;
  employee?: { name: string };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, paymentsData] = await Promise.all([
          api.dashboard.stats({ month: selectedMonth }),
          api.payments.list({ month: selectedMonth }),
        ]);
        setStats(statsData);
        setPayments(paymentsData.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const isAccountant = user?.role === 'ACCOUNTANT';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary p-6 text-white">
          <p className="text-sm font-medium opacity-80">Welcome back </p>
          <h1 className="text-2xl font-bold mt-1">{user?.name}</h1>
          <p className="text-sm opacity-70 mt-1 capitalize">{user?.role.toLowerCase()} · {user?.department || 'General'}</p>
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

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Assigned"
            value={`RWF ${(stats?.totalAssigned ?? 0).toLocaleString()}`}
            icon={Wallet}
            color="bg-secondary"
            sub="All petty cash assigned"
          />
          <StatCard
            label="Total Spent"
            value={`RWF ${(stats?.totalSpent ?? 0).toLocaleString()}`}
            icon={TrendingDown}
            color="bg-rose-500"
            sub="Expenses recorded"
          />
          <StatCard
            label="Remaining Balance"
            value={`RWF ${(stats?.remaining ?? 0).toLocaleString()}`}
            icon={PiggyBank}
            color="bg-primary"
            sub="Available to spend"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/payments/new"
            className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">New Expense</span>
          </Link>

          <Link href="/transactions"
            className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-gray-100 hover:border-secondary hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-gray-700">Transactions</span>
          </Link>

          {isAccountant && (
            <>
              <Link href="/employees"
                className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">Employees</span>
              </Link>

              <Link href="/assignments"
                className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 border border-gray-100 hover:border-secondary hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700">Assignments</span>
              </Link>
            </>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Transactions
            </h3>
            <Link href="/transactions" className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {payments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No transactions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payments.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.reason}</p>
                    <p className="text-xs text-gray-400">Vendor #{p.vendorNumber} {isAccountant && p.employee ? `· ${p.employee.name}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-rose-600">-RWF {p.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
