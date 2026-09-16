import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { setGlobalLogoutCallback, authService, getApiUrl } from "../services/api";
import i18n from "../i18n";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Register global logout callback once
  const registeredRef = useRef(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validated, setValidated] = useState(false);
  const initRef = useRef(false);

  const clearAllAuth = useCallback(() => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_data");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("auth_data");
    } catch (e) {
      // Storage access may fail in some environments
    }
    setToken(null);
    setUser(null);
    setValidated(false);
  }, []);

  const logout = useCallback(async () => {
    // 🛡️ MUST call backend to clear the httpOnly cookie before clearing local state
    try {
      await authService.logout();
    } catch (e) {
      // Backend might be down - still clear local state
    }
    // Then clear all local auth data
    clearAllAuth();
  }, [clearAllAuth]);

  const login = useCallback((newToken, userData) => {
    try {
      localStorage.setItem("authToken", newToken);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (e) {
      console.warn("[Auth] localStorage write failed:", e);
    }
    setToken(newToken);
    setUser(userData || null);
    const preferredLanguage = userData?.language_preference || userData?.languagePreference;
    if (preferredLanguage) {
      i18n.changeLanguage(preferredLanguage);
      try {
        localStorage.setItem("teknode_lang", preferredLanguage);
      } catch {}
    }
    setValidated(true);
  }, []);

  // Register global logout callback (fires on 401 from API calls)
  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;
    setGlobalLogoutCallback(clearAllAuth);
  }, [clearAllAuth]);

  // Validate token on app load
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const validateAuth = async () => {
      try {
        const savedToken = localStorage.getItem("authToken");
        if (!savedToken) {
          setLoading(false);
          return;
        }

        let profileUser = null;

        // Use raw fetch to validate the token WITHOUT triggering the global
        // 401 handler (api.js normalizeApiError calls triggerAuthClear on every
        // 401). During validation we probe both admin and user endpoints; the
        // "wrong" endpoint will legitimately return 401 and we must not wipe the
        // token before we finish checking.
        const rawFetch = async (endpoint) => {
          const res = await fetch(getApiUrl(endpoint), {
            headers: { Authorization: `Bearer ${savedToken}` },
            credentials: "include",
          });
          if (!res.ok) return null;
          return res.json();
        };

        // Try admin endpoint first (most likely for admin-panel visitors)
        try {
          const adminData = await rawFetch("/api/admin/me");
          const adminInfo = adminData?.data?.admin || adminData?.admin || null;
          if (adminInfo) {
            profileUser = {
              id: adminInfo.id,
              email: adminInfo.email,
              name: adminInfo.name || "",
              first_name: adminInfo.name || "",
              last_name: "",
              role: adminInfo.role || "admin",
              is_admin: true,
              phone: "",
              city: "",
              address: "",
            };
          }
        } catch (e) {
          // Network error — continue to user endpoint
        }

        // If not admin, try user endpoint
        if (!profileUser) {
          try {
            const userData = await rawFetch("/api/user/profile");
            profileUser = userData?.data?.user || userData?.user || null;
          } catch (e) {
            // Network error
          }
        }

        if (profileUser) {
          // Token is valid — persist auth state
          setToken(savedToken);
          setUser(profileUser);
          setValidated(true);
          try {
            localStorage.setItem("user", JSON.stringify(profileUser));
            const preferredLanguage =
              profileUser.language_preference || profileUser.languagePreference;
            if (preferredLanguage) {
              await i18n.changeLanguage(preferredLanguage);
              localStorage.setItem("teknode_lang", preferredLanguage);
            }
          } catch (e) {
            // Storage / i18n errors are non-fatal
          }
        } else {
          // Neither endpoint accepted the token — it is invalid or expired
          clearAllAuth();
        }
      } catch (error) {
        clearAllAuth();
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, [clearAllAuth]);

  const value = {
    token,
    user,
    loading,
    validated,
    isAuthenticated: !!token && validated,
    login,
    logout,
    clearAllAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
