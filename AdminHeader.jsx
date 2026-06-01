import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

const AdminHeader = ({ toggleSidebar }) => {
    return (
        <header className="h-20 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8 z-40">
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors lg:hidden"
                >
                    <Menu size={20} />
                </button>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search analytics, orders..." 
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 w-64 transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors group">
                    <Bell size={20} className="group-hover:rotate-12 transition-transform" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_#06b6d4]" />
                </button>
                
                <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-white tracking-tight leading-none">Administrator</p>
                        <p className="text-[10px] text-cyan-500 uppercase tracking-widest mt-1 font-bold">Tekunik Systems</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-cyan-400 shadow-lg">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;