import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

const AdminLayout = ({ onLogout }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    
    // Check for admin token as stored in localStorage based on TASK_STATUS.md
    const isAdmin = !!localStorage.getItem('authToken');

    if (!isAdmin) {
        return <Navigate to="/admin-login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans flex overflow-hidden" id="admin-root">
            {/* Sidebar - Professional glassmorphism */}
            {AdminSidebar ? (
                <AdminSidebar 
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                    onLogout={onLogout}
                />
            ) : <div className="w-20 bg-black" />}

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Admin Header */}
                <AdminHeader 
                    toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Background Decorative Glows */}
            <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
            <div className="fixed bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>
    );
};

export default AdminLayout;