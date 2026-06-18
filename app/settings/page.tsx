"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import DashboardLayout from "@/components/DashboardLayout";
import toast from "react-hot-toast";
import { Paintbrush, Loader2, Check } from "lucide-react";

export default function ThemeSettingsPage() {
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    primaryColor: "#0f172a",
    secondaryColor: "#f1f5f9",
    accentColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#020617",
    successColor: "#22c55e",
    warningColor: "#eab308",
    errorColor: "#ef4444",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (theme) {
      setFormData({
        primaryColor: theme.primaryColor || "#0f172a",
        secondaryColor: theme.secondaryColor || "#f1f5f9",
        accentColor: theme.accentColor || "#3b82f6",
        backgroundColor: theme.backgroundColor || "#ffffff",
        textColor: theme.textColor || "#020617",
        successColor: theme.successColor || "#22c55e",
        warningColor: theme.warningColor || "#eab308",
        errorColor: theme.errorColor || "#ef4444",
      });
    }
  }, [theme]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:4000/api/theme", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setTheme(data);
        toast.success("Theme settings updated successfully!");
      } else {
        toast.error("Failed to update theme settings.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating theme settings.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: "Primary Color", name: "primaryColor" },
    { label: "Secondary Color", name: "secondaryColor" },
    { label: "Accent Color", name: "accentColor" },
    { label: "Background Color", name: "backgroundColor" },
    { label: "Text Color", name: "textColor" },
    { label: "Success Color", name: "successColor" },
    { label: "Warning Color", name: "warningColor" },
    { label: "Error Color", name: "errorColor" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Theme Settings</h1>
            <p className="text-sm text-gray-500">Customize the look and feel of the application for your organization</p>
          </div>
        </div>

        {/* Colors card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Paintbrush className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-gray-900">Colors</h2>
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.name} className="flex items-center gap-4 border border-gray-100 p-3.5 rounded-xl hover:border-gray-200 transition-colors">
                  <input
                    type="color"
                    name={field.name}
                    value={(formData as any)[field.name]}
                    onChange={handleChange}
                    className="w-11 h-11 rounded-lg cursor-pointer border-0 p-0 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                    <span className="text-xs text-gray-400 font-mono">{(formData as any)[field.name]}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {loading ? "Saving..." : "Save Theme"}
              </button>
            </div>
          </form>
        </div>

        {/* Preview card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Preview</h2>
          </div>
          <div className="p-6 flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">Primary</button>
            <button className="px-4 py-2 rounded-xl bg-secondary text-white text-sm font-medium">Secondary</button>
            <div className="px-4 py-2 rounded-xl border border-[var(--success)] text-[var(--success)] text-sm font-medium">Success</div>
            <div className="px-4 py-2 rounded-xl border border-[var(--warning)] text-[var(--warning)] text-sm font-medium">Warning</div>
            <div className="px-4 py-2 rounded-xl border border-[var(--destructive)] text-[var(--destructive)] text-sm font-medium">Error</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
