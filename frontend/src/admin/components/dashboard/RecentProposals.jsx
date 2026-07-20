import { useState, useEffect } from "react";
import { ClipboardList, Phone, Mail, Home, Loader2 } from "lucide-react";
import { smartHomeProposalService } from "../../../services/api";

const STATUS_COLORS = {
  "New": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Contacted": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Under Review": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Quotation Prepared": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Approved": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Completed": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Cancelled": "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function RecentProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await smartHomeProposalService.list({ limit: 5 });
        if (mounted) setProposals(res?.data?.proposals || res?.proposals || []);
      } catch (e) {
        console.warn("[RecentProposals] Failed:", e?.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={18} className="text-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recent Proposals</h3>
        </div>
        <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-600" /></div>
      </div>
    );
  }

  if (!proposals.length) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={18} className="text-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recent Proposals</h3>
        </div>
        <p className="text-xs text-slate-600 text-center py-8">No proposals yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList size={18} className="text-cyan-400" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Automate My Home Requests</h3>
        </div>
        <span className="text-[10px] font-black px-2 py-1 bg-slate-900 text-slate-400 rounded-full border border-slate-800">{proposals.length} Recent</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
              <th className="p-4">Customer</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Home Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {proposals.map((p) => {
              const sc = STATUS_COLORS[p.status] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-bold text-white">{p.full_name}</p>
                    <p className="text-[10px] text-slate-500">{p.city}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-slate-300 flex items-center gap-1"><Mail size={10} />{p.email}</span>
                      <span className="text-xs text-slate-300 flex items-center gap-1"><Phone size={10} />{p.phone}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-slate-300 uppercase font-bold">
                    <span className="flex items-center gap-1"><Home size={12} />{p.home_type}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${sc}`}>{p.status}</span>
                  </td>
                  <td className="p-4 text-xs text-slate-500 font-mono">{p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
