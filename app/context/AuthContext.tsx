// app/context/AuthContext.tsx
import {
  useRef,
  useState,
  ReactNode,
  useEffect,
  useContext,
  createContext,
} from "react";
import { createClient } from "@openauthjs/openauth/client";
import { useNavigate } from "react-router";

// ============================================================
// KONFIGURASI CLIENT OPEN AUTH
// ============================================================
const client = createClient({
  clientID: "react",
  issuer: "http://localhost:3000", // Ganti dengan URL OpenAuth server Anda
});

// ============================================================
// TYPE DEFINITION
// ============================================================
interface AuthContextType {
  userId?: string;
  loaded: boolean;
  loggedIn: boolean;
  logout: () => void;
  login: () => Promise<void>;
  getToken: () => Promise<string | undefined>;
}

// ============================================================
// CONTEXT
// ============================================================
const AuthContext = createContext({} as AuthContextType);

// ============================================================
// PROVIDER
// ============================================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const initializing = useRef(true);
  const [loaded, setLoaded] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const token = useRef<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | undefined>();

  // ============================================================
  // INISIALISASI: Cek callback atau refresh token
  // ============================================================
  useEffect(() => {
    const hash = new URLSearchParams(location.search.slice(1));
    const code = hash.get("code");
    const state = hash.get("state");

    if (!initializing.current) {
      return;
    }

    initializing.current = false;

    if (code && state) {
      callback(code, state);
      return;
    }

    auth();
  }, []);

  // ============================================================
  // FUNGSI AUTH
  // ============================================================
  async function auth() {
    const token = await refreshTokens();

    if (token) {
      await user();
    }

    setLoaded(true);
  }

  async function refreshTokens() {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return;
    const next = await client.refresh(refresh, {
      access: token.current,
    });
    if (next.err) return;
    if (!next.tokens) return token.current;

    localStorage.setItem("refresh", next.tokens.refresh);
    token.current = next.tokens.access;

    return next.tokens.access;
  }

  async function getToken() {
    const token = await refreshTokens();

    if (!token) {
      await login();
      return;
    }

    return token;
  }

  async function login() {
    const { challenge, url } = await client.authorize(location.origin, "code", {
      pkce: true,
    });
    sessionStorage.setItem("challenge", JSON.stringify(challenge));
    location.href = url;
  }

  async function callback(code: string, state: string) {
    const challenge = JSON.parse(sessionStorage.getItem("challenge")!);
    if (code) {
      if (state === challenge.state && challenge.verifier) {
        const exchanged = await client.exchange(
          code!,
          location.origin,
          challenge.verifier
        );
        if (!exchanged.err) {
          token.current = exchanged.tokens?.access;
          localStorage.setItem("refresh", exchanged.tokens.refresh);
        }
      }
      navigate("/");
    }
  }

  async function user() {
    const res = await fetch("http://localhost:3001/", {
      headers: {
        Authorization: `Bearer ${token.current}`,
      },
    });

    if (res.ok) {
      setUserId(await res.text());
      setLoggedIn(true);
    }
  }

  function logout() {
    localStorage.removeItem("refresh");
    token.current = undefined;
    setLoggedIn(false);
    setUserId(undefined);
    navigate("/");
  }

  // ============================================================
  // RENDER PROVIDER
  // ============================================================
  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        userId,
        loaded,
        loggedIn,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================
export function useAuth() {
  return useContext(AuthContext);
}
