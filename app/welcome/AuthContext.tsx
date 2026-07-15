import { createClient } from "@openauthjs/openauth/client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { subjects } from "../../workers/app"; // 🔥 Import subjects dari server

const client = createClient({
  clientID: "service",
  issuer: "https://service.readtalk.workers.dev",
});

interface AuthContextType {
  userId?: string;
  userEmail?: string;
  loaded: boolean;
  loggedIn: boolean;
  logout: () => void;
  login: () => Promise<void>;
  getToken: () => Promise<string | undefined>;
}

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializing = useRef(true);
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const token = useRef<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();

  useEffect(() => {
    const hash = new URLSearchParams(location.search.slice(1));
    const code = hash.get("code");
    const state = hash.get("state");

    if (!initializing.current) return;

    initializing.current = false;

    if (code && state) {
      callback(code, state);
      return;
    }

    auth();
  }, []);

  // ============================================================
  // 🔥 AUTH: Cek token dan ambil user
  // ============================================================
  async function auth() {
    try {
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        const next = await client.refresh(refresh, { access: token.current });
        if (!next.err && next.tokens) {
          token.current = next.tokens.access;
          localStorage.setItem("refresh", next.tokens.refresh);
          
          // 🔥 Ambil user info dari /api/user
          await fetchUser();
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoaded(true);
    }
  }

  // ============================================================
  // 🔥 FETCH USER: Panggil /api/user
  // ============================================================
  async function fetchUser() {
    try {
      const res = await fetch("https://service.readtalk.workers.dev/api/user", {
        headers: {
          Authorization: `Bearer ${token.current}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUserId(data.id);
        setUserEmail(data.email);
        setLoggedIn(true);
      } else {
        // Token invalid → logout
        logout();
      }
    } catch (error) {
      console.error("Fetch user error:", error);
    }
  }

  // ============================================================
  // 🔥 GET TOKEN
  // ============================================================
  async function getToken() {
    if (!token.current) {
      await login();
      return;
    }
    return token.current;
  }

  // ============================================================
  // 🔥 LOGIN: Redirect ke OpenAuth
  // ============================================================
  async function login() {
    const { challenge, url } = await client.authorize(
      "https://service.readtalk.workers.dev/callback",
      "code",
      { pkce: true }
    );
    sessionStorage.setItem("challenge", JSON.stringify(challenge));
    location.href = url;
  }

  // ============================================================
  // 🔥 CALLBACK: Tukar code dengan token
  // ============================================================
  async function callback(code: string, state: string) {
    try {
      const challenge = JSON.parse(sessionStorage.getItem("challenge")!);
      if (code && state === challenge.state && challenge.verifier) {
        const exchanged = await client.exchange(
          code,
          "https://service.readtalk.workers.dev/callback",
          challenge.verifier
        );
        if (!exchanged.err) {
          token.current = exchanged.tokens?.access;
          localStorage.setItem("refresh", exchanged.tokens?.refresh || "");
          
          // 🔥 Ambil user info setelah login
          await fetchUser();
          
          // 🔥 Redirect ke halaman utama
          window.location.replace("/");
        }
      }
    } catch (error) {
      console.error("Callback error:", error);
    }
  }

  // ============================================================
  // 🔥 LOGOUT: Hapus token dan redirect
  // ============================================================
  function logout() {
    localStorage.removeItem("refresh");
    token.current = undefined;
    setLoggedIn(false);
    setUserId(undefined);
    setUserEmail(undefined);
    window.location.replace("/");
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        userEmail,
        loaded,
        loggedIn,
        logout,
        login,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
