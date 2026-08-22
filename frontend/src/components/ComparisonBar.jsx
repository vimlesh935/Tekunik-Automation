import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, GitCompareArrows, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useComparison } from "../context/ComparisonContext.jsx";
import { useEffect, useState } from "react";
import { productService } from "../services/api";
import SafeImage from "./SafeImage.jsx";

export default function ComparisonBar() {
  const { ids, removeProduct, clearProducts } = useComparison();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!ids.length) {
      setProducts([]);
      return;
    }
    productService.compareProducts(ids).then((response) => {
      const loaded = response?.data?.products || [];
      setProducts(loaded);
      const validIds = new Set(loaded.map((product) => Number(product.id)));
      ids.filter((id) => !validIds.has(id)).forEach(removeProduct);
    }).catch(() => {});
  }, [ids]);

  return (
    <AnimatePresence>
      {ids.length > 0 && (
        <motion.aside initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="fixed bottom-5 left-1/2 z-50 w-[min(760px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-indigo-400/30 bg-slate-950/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-white"><GitCompareArrows size={18} className="text-cyan-400" /> Compare Products <span className="text-cyan-300">{ids.length} selected</span></div>
            <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
              {products.map((product) => (
                <div key={product.id} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-xs text-slate-200">
                  <SafeImage src={product.image_url} alt="" className="h-7 w-7 rounded object-cover" />
                  <span className="max-w-24 truncate">{product.name}</span>
                  <button type="button" onClick={() => removeProduct(product.id)} aria-label={`Remove ${product.name}`} className="text-slate-500 hover:text-rose-400"><X size={13} /></button>
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={clearProducts} className="px-2 py-2 text-xs font-semibold text-slate-400 hover:text-white">Clear All</button>
              {ids.length >= 2 && <button type="button" onClick={() => navigate("/compare")} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500">Compare Now <ArrowRight size={14} /></button>}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
