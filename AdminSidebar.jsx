import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FolderTree, Users, DollarSign, BarChart3, Settings, LogOut } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Revenue', path: '/admin/revenue', icon: DollarSign },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
];

const AdminSidebar = ({ isOpen, setIsOpen, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        if (onLogout) onLogout();
        navigate('/admin-login', { replace: true });
    };

    return (
        <aside 
            className={`${
                isOpen ? 'w-64' : 'w-20'
            } transition-all duration-300 ease-in-out bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col h-screen z-50`}
        >
            {/* Logo Section */}
            <div className="h-20 flex items-center px-6 border-b border-white/10">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-lg flex-shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
                {isOpen && <span className="ml-3 font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">TEKUNIK <span className="text-cyan-400">PRO</span></span>}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center px-3 py-3 rounded-xl transition-all duration-200 group
                            ${isActive 
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                                : 'hover:bg-white/5 text-slate-400 hover:text-white'}
                        `}
                    >
                        <Icon size={20} />
                        {isOpen && <span className="ml-4 font-medium">{item.name}</span>}
                        {isActive && isOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
                    </NavLink>
                )})}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-colors group"
                >
                    <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
                    {isOpen && <span className="ml-4 font-medium">Logout</span>}
                </button>
                
                {isOpen && (
                    <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 text-center">
                            Admin v2.4.0 <br />
                            Tekunik Automation
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default AdminSidebar;