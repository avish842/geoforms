import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";

const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(!!getStoredUser());
  const sessionChecked = useRef(false);

  const persistUser = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // One-time background session validation on app load
  useEffect(() => {
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    // Only validate if there's a cached user
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/api/v1/user/profile`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          setUser(null);
          localStorage.removeItem("user");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Email / password login
  const login = useCallback(async (identifier, password) => {
    const isEmail = identifier.includes("@");
    const payload = {
      password,
      ...(isEmail ? { email: identifier } : { username: identifier }),
    };

    const res = await fetch(`${API_URL}/api/v1/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    persistUser(data.data.user);
    return data.data;
  }, []);

  // Google login via Firebase popup → send ID token to backend
  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const res = await fetch(`${API_URL}/api/v1/user/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Google login failed");

    persistUser(data.data.user);
    return data.data;
  }, []);

  // Logout — clear backend cookies + Firebase session
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/v1/user/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore network errors on logout
    }
    await firebaseSignOut(auth).catch(() => {});
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  // Fetch current user profile (validates cookie session)
  const fetchProfile = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/v1/user/profile`, {
      credentials: "include",
    });
    if (!res.ok) {
      setUser(null);
      localStorage.removeItem("user");
      return null;
    }
    const data = await res.json();
    persistUser(data.data);
    return data.data;
  }, []);



  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, logout, fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
