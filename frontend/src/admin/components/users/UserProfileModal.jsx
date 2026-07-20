import { X, User, Mail, Phone, Calendar, MapPin, ShoppingCart } from "lucide-react";

export default function UserProfileModal({ show, user, onClose, onToggleStatus }) {
  if (!show || !user) return null;

  const formatShortDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric", month: "short", day: "numeric"
      });
    } catch { return dateStr; }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      confirmed: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      processing: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      delivered: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    };
    return colors[status] || "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 p-6 sm:p-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user?.first_name || "N/A"} {user?.last_name || ""}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-0.5 rounded">ID: {user?.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${user?.is_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {user?.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="text-2xl font-black text-cyan-400 font-mono">{user?.order_count || 0}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Spend</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">₹{(parseFloat(user?.total_spent || 0)).toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 text-center sm:col-span-2 lg:col-span-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Last Order Date</p>
                  <p className="text-lg font-black text-amber-400 font-mono">{formatShortDate(user?.last_order_date)}</p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500"><Mail size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Email</p>
                      <p className="text-sm text-slate-200 font-bold truncate">{user?.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500"><Phone size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Contact</p>
                      <p className="text-sm text-slate-200 font-bold">{user?.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500"><Calendar size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Age Profile</p>
                      <p className="text-sm text-slate-200 font-bold">{user?.age || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin size={20} className="text-orange-500" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Shipping Repository</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Detailed Address</p>
                      <p className="text-sm text-slate-300 font-medium leading-relaxed">{user?.address || "No records found."}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">City</p>
                      <p className="text-sm text-slate-100 font-bold">{user?.city || "N/A"}</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Pincode</p>
                      <p className="text-sm text-slate-100 font-bold font-mono">{user?.pincode || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/30">
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={18} className="text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Transaction History</h3>
                  </div>
                  <span className="text-[10px] font-black px-3 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800">{user?.orders?.length || 0} Records</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar max-h-[400px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                        <th className="p-6">Order ID</th>
                        <th className="p-6">Products</th>
                        <th className="p-6">Timeline</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {(user?.orders || []).map(order => (
                        <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-6 text-xs font-mono font-black text-cyan-400 tracking-tighter">{order?.order_number}</td>
                          <td className="p-6">
                            <div className="flex flex-col gap-1">
                              {order.items?.map((item, idx) => (
                                <p key={idx} className="text-[10px] text-slate-300 font-medium truncate max-w-[150px]">{item.product_name} <span className="text-slate-500">x{item.quantity}</span></p>
                              ))}
                            </div>
                          </td>
                          <td className="p-6 text-xs text-slate-300 font-bold">{order?.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</td>
                          <td className="p-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-[10px] font-black border uppercase tracking-widest ${getStatusColor(order?.status)}`}>
                              {order?.status?.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-6 text-right text-sm font-black text-emerald-400 font-mono">₹{parseFloat(order?.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                      {(!user?.orders || user?.orders.length === 0) && (
                        <tr><td colSpan={4} className="p-20 text-center text-xs font-bold uppercase tracking-widest text-slate-600">No transaction logs available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
