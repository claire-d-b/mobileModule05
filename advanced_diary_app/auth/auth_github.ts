import * as AuthSession from "expo-auth-session";
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { router } from "expo-router";

const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
};

const useGithubAuth = () => {
  const { setSession } = useAuthContext();
  // true dès que le navigateur OAuth renvoie une réponse "success",
  // jusqu'à ce que le backend ait répondu et la session soit posée.
  const [isSigningIn, setIsSigningIn] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "com.anonymous.diaryapp",
  });

  const clientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
  if (!clientId)
    throw new Error("Missing EXPO_PUBLIC_GITHUB_CLIENT_ID in .env");

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["read:user", "user:email"],
      redirectUri,
      usePKCE: false,
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type !== "success") return;

    setIsSigningIn(true);

    const signIn = async () => {
      const { code } = response.params;

      if (!code) {
        console.error("Missing code");
        setIsSigningIn(false);
        return;
      }

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      try {
        const res = await fetch(`${backendUrl}/auth/github`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!res.ok) {
          const error = await res.text();
          console.error("Backend error:", error);
          setIsSigningIn(false);
          return;
        }

        const data = await res.json();

        if (!data.token || !data.user) {
          console.error("Missing token or user in backend response");
          setIsSigningIn(false);
          return;
        }

        await setSession(data.token, data.user.login);
        console.log("GitHub login success:", data.user.login);
        router.replace("/home" as any);
        // Pas de setIsSigningIn(false) ici : on laisse le loading affiché
        // jusqu'à ce que la navigation démonte ce composant.
      } catch (e) {
        console.error("GitHub auth error:", e);
        setIsSigningIn(false);
      }
    };

    signIn();
  }, [response]);

  return { promptAsync, request, isSigningIn };
};

export default useGithubAuth;
