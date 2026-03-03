import React, { useState, useEffect } from "react";
import { DashboardStats } from "../types";
import { TrendingUp, Users, Package, AlertTriangle, IndianRupee, ShoppingCart, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [fastMoving, setFastMoving] = useState<any[]>([]);
  const [monthlySales, setMonthlySales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, fastRes, monthlyRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/analytics/fast-moving"),
          fetch("/api/analytics/monthly-sales")
        ]);
        
        setStats(await statsRes.json());
        setFastMoving(await fastRes.json());
        setMonthlySales(await monthlyRes.json());
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64">Loading Dashboard...</div>;

  const statCards = [
    { title: "Today's Sales", value: stats?.todaySales || 0, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "Today's Profit", value: stats?.todayProfit || 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Total Credit", value: stats?.totalOutstanding || 0, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Low Stock", value: stats?.lowStockItems || 0, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", isCount: true },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Shop Overview</h1>
        <p className="text-gray-500">Welcome back to your shop management dashboard.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const content = (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={stat.title}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{stat.title}</span>
              </div>
              <div className="flex items-baseline gap-1">
                {!stat.isCount && <span className="text-lg font-semibold text-gray-600">₹</span>}
                <span className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString('en-IN')}</span>
              </div>
            </motion.div>
          );

          if (stat.title === "Low Stock") {
            return (
              <Link key={stat.title} to="/inventory?filter=low-stock">
                {content}
              </Link>
            );
          }

          return content;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Sales Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fast Moving Products */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Selling Designs</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fastMoving}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total_sold"
                  nameKey="design_name"
                >
                  {fastMoving.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {fastMoving.slice(0, 4).map((item, i) => (
              <div key={item.design_name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-gray-600 truncate">{item.design_name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/sales" className="flex flex-col items-center justify-center p-6 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors">
            <ShoppingCart className="w-8 h-8 mb-2" />
            <span className="font-medium">New Sale</span>
          </Link>
          <Link to="/inventory" className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 text-gray-900 rounded-2xl hover:bg-gray-50 transition-colors">
            <Package className="w-8 h-8 mb-2 text-indigo-600" />
            <span className="font-medium">Add Stock</span>
          </Link>
          <Link to="/customers" className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 text-gray-900 rounded-2xl hover:bg-gray-50 transition-colors">
            <Users className="w-8 h-8 mb-2 text-indigo-600" />
            <span className="font-medium">Customers</span>
          </Link>
          <Link to="/reports" className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 text-gray-900 rounded-2xl hover:bg-gray-50 transition-colors">
            <BarChart3 className="w-8 h-8 mb-2 text-indigo-600" />
            <span className="font-medium">Reports</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
