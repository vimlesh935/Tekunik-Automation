import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "teknode_comparison_ids";
const ComparisonContext = createContext(null);

const readIds = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? [...new Set(parsed.map(Number).filter((id) => Number.isInteger(id) && id > 0))].slice(0, 4) : [];
  } catch {
    return [];
  }
};

export function ComparisonProvider({ children }) {
  const [ids, setIds] = useState(readIds);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Comparison remains available for the current session if storage is unavailable.
    }
  }, [ids]);

  const addProduct = (productId) => {
    const id = Number(productId);
    if (!Number.isInteger(id) || id < 1) return { ok: false, reason: "invalid" };
    if (ids.includes(id)) return { ok: true, alreadySelected: true };
    if (ids.length >= 4) return { ok: false, reason: "limit" };
    setIds((previous) => [...previous, id]);
    return { ok: true };
  };

  const removeProduct = (productId) => {
    const id = Number(productId);
    setIds((previous) => previous.filter((value) => value !== id));
  };

  const clearProducts = () => setIds([]);

  return (
    <ComparisonContext.Provider value={{ ids, addProduct, removeProduct, clearProducts, isCompared: (id) => ids.includes(Number(id)), getCount: () => ids.length }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error("useComparison must be used within a ComparisonProvider");
  return context;
};
