import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Download, FileText, Table as TableIcon, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "motion/react";

export default function Reports() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const exportExcel = () => {
    const headers = ["Month", "Total Sales", "Profit"];
    const rows = monthlyData.map(d => [d.month, d.total, d.profit]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Vastra_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics/monthly-sales");
        setMonthlyData(await res.json());
      } catch (err) {
        console.error("Failed to fetch reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading Reports...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-500">Analyze your shop's performance over time.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-100"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales vs Profit Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue vs Profit</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="total" name="Revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Summary Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Summary</h3>
          <div className="space-y-4">
            {monthlyData.map((data, i) => (
              <div key={data.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">{data.month}</p>
                  <p className="text-xs text-gray-500">Total Sales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">₹{data.total.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-emerald-600 font-medium">+₹{data.profit.toLocaleString('en-IN')} profit</p>
                </div>
              </div>
            ))}
            {monthlyData.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <TableIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h4 className="text-indigo-100 font-medium mb-2">Total Business Revenue</h4>
          <p className="text-4xl font-bold mb-4">
            ₹{monthlyData.reduce((sum, d) => sum + d.total, 0).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full">
            <ArrowUpRight className="w-4 h-4" />
            <span>12% increase from last month</span>
          </div>
        </div>
        <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h4 className="text-emerald-100 font-medium mb-2">Total Net Profit</h4>
          <p className="text-4xl font-bold mb-4">
            ₹{monthlyData.reduce((sum, d) => sum + d.profit, 0).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-2 text-sm bg-white/10 w-fit px-3 py-1 rounded-full">
            <ArrowUpRight className="w-4 h-4" />
            <span>8% increase from last month</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
  );
}
