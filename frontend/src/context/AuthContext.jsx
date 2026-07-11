import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import apiCall, { setGlobalLogoutCallback, authService } from "../services/api";

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

        // Temporarily set token so API call includes Authorization header
        setToken(savedToken);

        // Verify token by calling a protected endpoint
        await apiCall("/api/user/profile");

        // Token is valid - keep it
        setValidated(true);

        // Try to restore cached user data
        try {
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }
        } catch (e) {
          // Ignore parse errors for cached user
        }
      } catch (error) {
        // 🛡️ ANY error during validation means the token is not valid.
        // This includes network errors - we must NOT keep the user logged in
        // because the cookie/httpOnly token may have been cleared server-side.
        // A network error is not a reason to assume the token is still valid.
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