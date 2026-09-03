import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  token: string | null;
  localLogin: string | null;
  setSession: (token: string | null, login: string | null) => Promise<void>;
  loading: boolean;
  // true pendant qu'un flow OAuth (Google/GitHub) est en cours, entre l'ouverture
  // du navigateur et la fin de l'appel backend. Permet à app/index.tsx de ne pas
  // rediriger vers /signin si le deep link de retour OAuth ramène l'app sur "/"
  // avant que setSession n'ait été appelé.
  authenticating: boolean;
  setAuthenticating: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  localLogin: null,
  setSession: async () => {},
  loading: true,
  authenticating: false,
  setAuthenticating: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [localLogin, setLocalLogin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedLogin = await AsyncStorage.getItem("localLogin");
        if (storedToken) setToken(storedToken);
        if (storedLogin) setLocalLogin(storedLogin);
      } catch (e) {
        console.warn("Failed to restore session", e);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const setSession = async (newToken: string | null, login: string | null) => {
    setToken(newToken);
    setLocalLogin(login);
    if (newToken && login) {
      await AsyncStorage.setItem("token", newToken);
      await AsyncStorage.setItem("localLogin", login);
    } else {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("localLogin");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        localLogin,
        setSession,
        loading,
        authenticating,
        setAuthenticating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
