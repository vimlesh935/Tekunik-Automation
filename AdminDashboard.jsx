import React from 'react';
import { DollarSign, Package, Users, Activity, FileText, Download } from 'lucide-react';

const StatCard = ({ title, value, change, trend, color, icon: Icon }) => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:border-white/20 hover:bg-white/10 transition-all group relative overflow-hidden">
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {change}
            </div>
        </div>
        <div className="flex items-end justify-between">
            <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                {value}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl group-hover:scale-110 group-hover:border-white/10 transition-all duration-300">
                <Icon size={24} className="text-slate-400 group-hover:text-white transition-colors" />
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
                    <p className="text-slate-400 mt-1">Welcome back, Administrator. Here's what's happening today.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-sm font-medium"><FileText size={16}/> Generate Report</button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all text-sm"><Download size={16}/> Export Data</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    value="$128,430" 
                    change="+12.5%" 
                    trend="up" 
                    color="from-cyan-400 to-blue-500"
                    icon={DollarSign}
                />
                <StatCard 
                    title="Active Orders" 
                    value="1,240" 
                    change="+4.2%" 
                    trend="up" 
                    color="from-purple-400 to-pink-500"
                    icon={Package}
                />
                <StatCard 
                    title="Total Customers" 
                    value="8,542" 
                    change="-2.1%" 
                    trend="down" 
                    color="from-orange-400 to-amber-500"
                    icon={Users}
                />
                <StatCard 
                    title="Avg. Conversion" 
                    value="4.12%" 
                    change="+0.8%" 
                    trend="up" 
                    color="from-emerald-400 to-teal-500"
                    icon={Activity}
                />
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
                    <button className="text-cyan-400 text-sm hover:underline">View All</button>
                </div>
                <div className="p-0 overflow-x-auto">
                    <div className="min-w-full h-64 flex items-center justify-center text-slate-500">
                        {/* Table would go here */}
                        <p className="italic">Dynamic analytics chart loading...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;