"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import MonthScroller from "@/components/MonthScroller";
import toast from "react-hot-toast";
import {
  Plus,
  Wallet,
  Loader2,
  AlertCircle,
  X,
  Check,
  CalendarDays,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

interface Employee {
  id: number;
  name: string;
  email: string;
}
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
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [loadingFormData, setLoadingFormData] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ assignedToId: "", amount: "" });
  const [authorizedItems, setAuthorizedItems] = useState<string[]>([]);
  const [masterBudgetItems, setMasterBudgetItems] = useState<
    { id: number; name: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAssignments = async (month?: string) => {
    setLoading(true);
    try {
      const assignData = await api.assignments.list({ month: month || selectedMonth });
      setAssignments(assignData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    if (user?.role !== "ACCOUNTANT") return;
    setLoadingFormData(true);
    try {
      const [empData, budgetData] = await Promise.all([
        api.employees.list(),
        api.budgetItems.list(),
      ]);
      setEmployees(empData);
      setMasterBudgetItems(budgetData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFormData(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchAssignments(selectedMonth);
  }, [user, selectedMonth]);

  const openModal = () => {
    setShowModal(true);
    setError("");
    setForm({ assignedToId: "", amount: "" });
    setAuthorizedItems([]);
    fetchFormData();
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ assignedToId: "", amount: "" });
    setAuthorizedItems([]);
    setError("");
  };

  const addBudgetItem = (name: string) => {
    if (!authorizedItems.includes(name)) {
      setAuthorizedItems((prev) => [...prev, name]);
    }
  };

  const removeBudgetItem = (name: string) => {
    setAuthorizedItems((prev) => prev.filter((i) => i !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assignedToId) {
      setError("Please select an employee.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.assignments.create({
        assignedToId: form.assignedToId,
        amount: Number(form.amount),
        authorizedItems,
      });
      await fetchAssignments(selectedMonth);
      toast.success("Assignment created successfully");
      closeModal();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((a) =>
    a.assignedTo.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assignedTo.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.authorizedItems && a.authorizedItems.some((i) => i.name.toLowerCase().includes(search.toLowerCase())))
  );

  const totalAssigned = filtered.reduce((sum, a) => sum + a.amount, 0);
  const selectedEmployee = employees.find(
    (e) => String(e.id) === form.assignedToId
  );

  // Budget items not yet selected
  const availableItems = masterBudgetItems.filter(
    (item) => !authorizedItems.includes(item.name)
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Cash Assignments
            </h1>
            <p className="text-sm text-gray-500">
              Total assigned:{" "}
              <span className="text-primary font-semibold">
                RWF {totalAssigned.toLocaleString()}
              </span>
            </p>
          </div>
          {user?.role === "ACCOUNTANT" && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Assign Cash
            </button>
          )}
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
            placeholder="Search by employee, email, or authorized purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400">
            <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No assignments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {a.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="font-semibold text-gray-900">
                  {a.assignedTo.name}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {a.assignedTo.email}
                </p>
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-2xl font-bold text-primary">
                    RWF {a.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 mb-2">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(a.createdAt).toLocaleDateString()} · by{" "}
                    {a.assignedBy.name}
                  </div>
                  {a.authorizedItems && a.authorizedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.authorizedItems.map((item: any) => (
                        <span
                          key={item.id}
                          className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
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
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-bold text-gray-900">Assign Petty Cash</h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5 overflow-y-auto"
            >
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* ── Employee Combobox ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Employee <span className="text-red-400">*</span>
                </label>
                {loadingFormData ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 hover:bg-white transition-colors flex items-center justify-between text-left gap-2"
                      >
                        {selectedEmployee ? (
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                              {selectedEmployee.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate text-gray-900">
                              {selectedEmployee.name}
                              <span className="text-gray-400 ml-1">
                                — {selectedEmployee.email}
                              </span>
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            Search employee...
                          </span>
                        )}
                        <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl border border-gray-200 rounded-xl overflow-hidden"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search by name or email…" />
                        <CommandList className="max-h-52">
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            {employees.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                value={`${emp.name} ${emp.email}`}
                                onSelect={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    assignedToId: String(emp.id),
                                  }));
                                  setEmployeeOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                    {emp.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {emp.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {emp.email}
                                    </p>
                                  </div>
                                </div>
                                {String(emp.id) === form.assignedToId && (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* ── Amount ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount (RWF) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50,000"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              {/* ── Authorized Budget Items (LinkedIn-style) ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Authorized Purposes{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    (Optional)
                  </span>
                </label>

                {/* Selected tags */}
                {authorizedItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {authorizedItems.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => removeBudgetItem(item)}
                          className="hover:text-red-500 ml-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available items pool */}
                {loadingFormData ? (
                  <div className="flex flex-wrap gap-2">
                    {[80, 100, 64, 90, 72].map((w, i) => (
                      <Skeleton
                        key={i}
                        className="h-7 rounded-full"
                        style={{ width: w }}
                      />
                    ))}
                  </div>
                ) : availableItems.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/80">
                    <p className="text-[11px] text-gray-400 mb-2 font-medium uppercase tracking-wide">
                      Click to add
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addBudgetItem(item.name)}
                          className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all font-medium"
                        >
                          + {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : masterBudgetItems.length > 0 ? (
                  <p className="text-xs text-gray-400 italic py-1">
                    ✓ All budget items have been selected
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic py-1">
                    No budget items found in the database
                  </p>
                )}
              </div>

              {/* ── Actions ── */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.assignedToId || !form.amount}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
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
