import { Check, GitCompareArrows } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useComparison } from "../context/ComparisonContext.jsx";
import { useToast } from "./Toast.jsx";

export default function CompareButton({ productId, compact = false }) {
  const { t } = useTranslation();
  const { addProduct, removeProduct, isCompared } = useComparison();
  const { addToast } = useToast();
  const selected = isCompared(productId);

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (selected) {
      removeProduct(productId);
      addToast(t('compare.productAddedToCompare'), "success");
      return;
    }
    const result = addProduct(productId);
    if (result.reason === "limit") {
      addToast(t('compare.max4'), "warning");
    } else if (result.ok) {
      addToast(t('compare.productAddedToCompare'), "success");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      title={selected ? t('common.remove') : t('compare.addToCompare')}
      className={`inline-flex items-center justify-center gap-1.5 border text-xs font-semibold transition ${compact ? "rounded-lg px-2.5 py-2" : "rounded-xl px-3 py-2.5"} ${selected ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/50 hover:text-cyan-300"}`}
    >
      {selected ? <Check size={14} /> : <GitCompareArrows size={14} />}
      {selected ? t('compare.productAddedToCompare') : t('compare.addToCompare')}
    </button>
  );
}
