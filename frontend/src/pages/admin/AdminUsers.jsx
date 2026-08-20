import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, Eye, Loader2, XCircle } from "lucide-react";
import apiCall, { getApiUrl } from "../../services/api.js";
import AdminLoading from "../../components/admin/AdminLoading.jsx";
import AdminPageToolbar from "../../components/admin/AdminPageToolbar.jsx";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import Toast from "../../admin/components/common/Toast.jsx";
import UserProfileModal from "../../admin/components/users/UserProfileModal.jsx";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [userProfileLoading, setUserProfileLoading] = useState(null);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
      const payload = res.data;
      setUsers(payload?.users || []);
      setTotalPages(payload?.pagination?.pages || 1);
    } catch (err) {
      showToast(err.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const viewUserProfile = async (user) => {
    setUserProfileLoading(user.id);
    try {
      const res = await apiCall(`/api/admin/users/${user?.id}`);
      setSelectedUserProfile(res.data?.user || res.data);
    } catch (err) {
      showToast(`Failed to load user profile: ${err.message}`, "error");
    } finally {
      setUserProfileLoading(null);
    }
  };

  const toggleUserStatus = async (id) => {
    if (!window.confirm("Toggle user verification status?")) return;
    try {
      await apiCall(`/api/admin/users/${id}/toggle`, { method: "PATCH" });
      showToast("User status updated.");
      fetchUsers();
    } catch (err) {
      showToast(err.message || "Failed to update user status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <Toast toast={toast} />
      <AdminPageToolbar title="Users" description="Manage customer profiles, contact details, and verification status." search={search} onSearchChange={(value) => { setPage(1); setSearch(value); }} showSearch />
      {loading ? <AdminLoading /> : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead><tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-400">
              <th className="p-4 font-semibold">User</th><th className="p-4 font-semibold">Contact</th><th className="p-4 font-semibold text-center">Orders</th><th className="p-4 font-semibold text-center">Status</th><th className="p-4 font-semibold text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800/20 transition">
                  <td className="p-4"><div><p className="font-semibold text-sm text-white">{u.first_name} {u.last_name}</p><p className="text-xs text-gray-500 break-all">{u.email}</p></div></td>
                  <td className="p-4"><p className="text-sm text-gray-300">{u.phone || "-"}</p><p className="text-xs text-gray-500">{u.city || "-"}</p></td>
                  <td className="p-4 text-center text-sm font-bold text-cyan-400">{u.order_count}</td>
                  <td className="p-4 text-center">{u.is_verified ? <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/10 text-emerald-400"><CheckCircle size={12} /> Active</span> : <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-gray-800 text-gray-400"><XCircle size={12} /> Inactive</span>}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => viewUserProfile(u)} disabled={userProfileLoading === u.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-bold hover:bg-cyan-500 hover:text-black transition-all group disabled:opacity-50">
                      {userProfileLoading === u.id ? <><Loader2 size={14} className="animate-spin" /> Loading profile...</> : <><Eye size={14} className="group-hover:scale-110 transition-transform" /> View Profile</>}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found.</td></tr>}
            </tbody>
          </table>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
      <UserProfileModal show={!!selectedUserProfile} user={selectedUserProfile} onClose={() => setSelectedUserProfile(null)} onToggleStatus={toggleUserStatus} getApiUrl={getApiUrl} />
    </div>
  );
}
