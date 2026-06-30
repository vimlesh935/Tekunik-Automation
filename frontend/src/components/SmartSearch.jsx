import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp, Loader2, ChevronRight, Package } from "lucide-react";
import { productService } from "../services/api";

const POPULAR_SEARCHES = [
  "Smart Switch",
  "Digital Lock",
  "Smart Gateway",
  "WiFi Switch",
  "Motion Sensor",
  "Smart Home",
];

const MAX_HISTORY = 5;

const SmartSearch = ({ isOpen, onClose, query: externalQuery = "", onQueryChange }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const searchCacheRef = useRef(new Map());

  // Load search history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("searchHistory");
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load search history:", e);
    }
  }, []);

  // Sync with external query
  useEffect(() => {
    if (externalQuery !== undefined) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery("");
      setSuggestions([]);
      setShowResults(false);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced smart search
  const fetchSuggestions = useCallback(
    async (searchQuery) => {
      const trimmed = searchQuery.trim();

      if (!trimmed || trimmed.length < 1) {
        setSuggestions([]);
        setShowResults(false);
        setTotalResults(0);
        return;
      }

      setIsLoading(true);
      setSelectedIndex(-1);

      // Use cache if available
      const cached = searchCacheRef.current.get(trimmed);
      if (cached) {
        setSuggestions(cached.products);
        setTotalResults(cached.total);
        setShowResults(true);
        setIsLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await productService.smartSearch(trimmed, 8);
        console.log("[SMART SEARCH] Response:", response);
        if (response?.data?.products) {
          const products = response.data.products;
          setSuggestions(products);
          setTotalResults(response.data.total || products.length);
          setShowResults(true);
          console.log("[SMART SEARCH] Products:", products);
          searchCacheRef.current.set(trimmed, { products, total: response.data.total || products.length });
        } else {
          setSuggestions([]);
          setTotalResults(0);
          setShowResults(true);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Smart search failed:", error);
          setSuggestions([]);
          setTotalResults(0);
          setShowResults(true);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Handle query changes with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim().length >= 1) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 250);
    } else {
      setSuggestions([]);
      setShowResults(false);
      setTotalResults(0);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showResults || suggestions.length === 0) return;

      const maxIndex = suggestions.length;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < maxIndex - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const selectedProduct = suggestions[selectedIndex];
            handleProductClick(selectedProduct);
          } else {
            navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
            saveSearchHistory(query.trim());
            handleClose();
          }
          break;
        case "Escape":
          handleClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showResults, suggestions, selectedIndex, query, navigate]);

  const handleProductClick = (product) => {
    saveSearchHistory(query.trim());
    navigate(`/product/${product.slug || product.id}`);
    handleClose();
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onClose?.();
  };

  const saveSearchHistory = (searchQuery) => {
    if (!searchQuery.trim()) return;
    try {
      const updated = [
        searchQuery.trim(),
        ...searchHistory.filter((h) => h !== searchQuery.trim()),
      ].slice(0, MAX_HISTORY);
      setSearchHistory(updated);
      localStorage.setItem("searchHistory", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save search history:", e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveSearchHistory(query.trim());
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      handleClose();
    }
  };

  const handleSearchHistoryClick = (historyItem) => {
    setQuery(historyItem);
    onQueryChange?.(historyItem);
    fetchSuggestions(historyItem);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("searchHistory");
  };

  const formatPrice = (price) => {
    return `₹${Number(price).toLocaleString("en-IN")}`;
  };

  const isInStock = (product) => {
    return product.stock_status === "in_stock" || product.stock_quantity > 0;
  };

  const getAvailabilityLabel = (product) => {
    if (product.stock_status === "out_of_stock" || product.stock_quantity === 0) {
      return "Out of Stock";
    }
    return "Available";
  };

  const getAvailabilityClass = (product) => {
    if (product.stock_status === "out_of_stock" || product.stock_quantity === 0) {
      return "text-rose-400";
    }
    return "text-emerald-400";
  };

  if (!isOpen) return null;

  return (
    <div className="smart-search-container">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative z-50">
        <div className="relative flex items-center">
          <div className="absolute left-3 pointer-events-none text-slate-500">
            <Search size={14} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-9 rounded-full border border-slate-600/60 bg-slate-900/95 pl-9 pr-8 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:bg-slate-900 transition-all shadow-lg backdrop-blur-xl"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setShowResults(false);
                inputRef.current?.focus();
              }}
              className="absolute right-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-slate-700 bg-slate-900/98 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50"
            ref={dropdownRef}
          >
            <div className="max-h-[480px] overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-indigo-500" size={24} />
                </div>
              )}

              {!isLoading && suggestions.length === 0 && query.trim().length >= 1 && (
                <div className="px-4 py-8 text-center">
                  <Package className="mx-auto text-slate-600 mb-2" size={32} />
                  <p className="text-sm text-slate-400">No products found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try searching for something else
                  </p>
                </div>
              )}

              {!isLoading && suggestions.length > 0 && (
                <>
                  {/* Suggestions List */}
                  <div className="p-2">
                    {suggestions.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleProductClick(product)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedIndex === index
                            ? "bg-indigo-500/20 border border-indigo-500/30"
                            : "hover:bg-slate-800/60 border border-transparent"
                        }`}
                      >
                        {/* Product Image */}
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`absolute inset-0 flex items-center justify-center bg-slate-800 ${
                              product.image_url ? "hidden" : "flex"
                            }`}
                          >
                            <Package className="text-slate-600" size={24} />
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {product.name}
                              </h4>
                              {product.category_name && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {product.category_name}
                                </p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-indigo-400 flex-shrink-0">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span
                              className={`text-xs font-medium ${getAvailabilityClass(product)}`}
                            >
                              {getAvailabilityLabel(product)}
                            </span>
                            {product.brand && (
                              <span className="text-xs text-slate-500">
                                {product.brand}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <ChevronRight className="text-slate-600 flex-shrink-0" size={16} />
                      </motion.div>
                    ))}
                  </div>

                  {/* View All Results */}
                  {totalResults > 8 && (
                    <div className="border-t border-slate-800 p-2">
                      <button
                        onClick={() => {
                          saveSearchHistory(query.trim());
                          navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
                          handleClose();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all duration-200"
                      >
                        <TrendingUp size={14} />
                        View All Results ({totalResults})
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Search History */}
              {!isLoading && query.trim().length === 0 && searchHistory.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearHistory}
                      className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {searchHistory.map((historyItem, index) => (
                    <div
                      key={index}
                      onClick={() => handleSearchHistoryClick(historyItem)}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-all duration-200"
                    >
                      <Clock className="text-slate-600" size={14} />
                      <span className="text-sm text-slate-300 flex-1">{historyItem}</span>
                      <ChevronRight className="text-slate-600" size={14} />
                    </div>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {!isLoading && query.trim().length === 0 && searchHistory.length === 0 && (
                <div className="p-2">
                  <div className="px-2 py-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Popular Searches
                    </span>
                  </div>
                  <div className="space-y-1">
                    {POPULAR_SEARCHES.map((term, index) => (
                      <div
                        key={index}
                        onClick={() => handleSearchHistoryClick(term)}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-800/60 transition-all duration-200"
                      >
                        <TrendingUp className="text-indigo-500" size={14} />
                        <span className="text-sm text-slate-300 flex-1">{term}</span>
                        <ChevronRight className="text-slate-600" size={14} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartSearch;