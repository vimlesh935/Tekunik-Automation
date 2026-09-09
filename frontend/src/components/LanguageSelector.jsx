import React, { useState, useRef, useEffect, useCallback } from "react";
import { Globe, Check, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext.jsx";
import apiCall from "../services/api";

const LANGUAGES = [
  { code: "en", native: "English", latin: "English" },
  { code: "hi", native: "हिन्दी", latin: "Hindi" },
  { code: "mr", native: "मराठी", latin: "Marathi" },
  { code: "gu", native: "ગુજરાતી", latin: "Gujarati" },
  { code: "ta", native: "தமிழ்", latin: "Tamil" },
  { code: "te", native: "తెలుగు", latin: "Telugu" },
  { code: "kn", native: "ಕನ್ನಡ", latin: "Kannada" },
  { code: "ml", native: "മലയാളം", latin: "Malayalam" },
  { code: "bn", native: "বাংলা", latin: "Bengali" },
  { code: "pa", native: "ਪੰਜਾਬੀ", latin: "Punjabi" },
  { code: "or", native: "ଓଡ଼ିଆ", latin: "Odia" },
  { code: "as", native: "অসমীয়া", latin: "Assamese" },
  { code: "ur", native: "اردو", latin: "Urdu" },
];

const LANG_MAP = Object.fromEntries(LANGUAGES.map((l) => [l.code, l]));

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const buttonRef = useRef(null);

  const currentLang = LANG_MAP[i18n.language?.split("-")[0]] || LANG_MAP.en;

  const filtered = LANGUAGES.filter((lang) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      lang.latin.toLowerCase().includes(q) ||
      lang.native.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const handleChange = useCallback(
    async (code) => {
      if (code === i18n.language) {
        setOpen(false);
        setQuery("");
        return;
      }

      i18n.changeLanguage(code);

      try {
        localStorage.setItem("teknode_lang", code);
      } catch {}

      setOpen(false);
      setQuery("");

      if (isAuthenticated) {
        try {
          await apiCall("/api/user/profile", {
            method: "PUT",
            body: JSON.stringify({ language_preference: code }),
          });
        } catch {}
      }
    },
    [i18n, isAuthenticated]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
          setQuery("");
        }}
        className={`relative inline-flex items-center gap-1.5 font-bold transition-all duration-300 h-7 px-2.5 rounded-lg border ${
          open
            ? "border-indigo-500/30 bg-indigo-500/5 text-indigo-400"
            : "border-slate-900 bg-slate-900/30 text-slate-300 hover:text-white hover:border-slate-800"
        }`}
        title="Select language"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe
          size={13}
          className={open ? "text-indigo-400" : "text-slate-400"}
        />
        <span className="hidden sm:inline tracking-wide text-[10px] uppercase font-black">
          {currentLang.code}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-72 max-h-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden flex flex-col"
              role="listbox"
              aria-label="Available languages"
            >
              <div className="px-3 py-2.5 border-b border-slate-800 bg-slate-950/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Select Language
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="text-slate-600 hover:text-slate-300 transition-colors"
                    aria-label="Close language selector"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="relative">
                  <Search
                    size={12}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600"
                  />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full h-8 rounded-lg border border-slate-800 bg-slate-950/50 pl-8 pr-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {filtered.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-slate-600 font-medium">
                      No languages found
                    </p>
                  </div>
                )}
                {filtered.map((lang) => {
                  const isActive =
                    (i18n.language?.split("-")[0] || "en") === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleChange(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-500/10 text-indigo-400"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {lang.native}
                          {lang.native !== lang.latin && (
                            <span className="text-slate-500 font-medium ml-1.5">
                              ({lang.latin})
                            </span>
                          )}
                        </span>
                      </span>
                      {isActive && (
                        <Check
                          size={14}
                          className="text-indigo-400 flex-shrink-0"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
