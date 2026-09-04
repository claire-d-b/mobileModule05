import * as AuthSession from "expo-auth-session";
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { router } from "expo-router";

const discovery = {
  authorizationEndpoint: "https://github.com/login/oauth/authorize",
  tokenEndpoint: "https://github.com/login/oauth/access_token",
};

const useGithubAuth = () => {
  const { setSession, setAuthenticating } = useAuthContext();
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
    if (!response) return;

    // Même logique que pour Google : le deep link de retour peut ramener
    // l'app sur "/" avant la fin de l'appel backend, donc on pilote
    // isSigningIn/authenticating uniquement depuis ce `response`.
    if (response.type !== "success") {
      setIsSigningIn(false);
      setAuthenticating(false);
      return;
    }

    setIsSigningIn(true);

    const signIn = async () => {
      const { code } = response.params;

      if (!code) {
        console.error("Missing code");
        setIsSigningIn(false);
        setAuthenticating(false);
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
          setAuthenticating(false);
          return;
        }

        const data = await res.json();

        if (!data.token || !data.user) {
          console.error("Missing token or user in backend response");
          setIsSigningIn(false);
          setAuthenticating(false);
          return;
        }

        await setSession(data.token, data.user.login);
        console.log("GitHub login success:", data.user.login);
        // router.replace("/home" as any);
        setAuthenticating(false);
        // Pas de setIsSigningIn(false) ici : on laisse le loading affiché
        // jusqu'à ce que la navigation démonte ce composant.
      } catch (e) {
        console.error("GitHub auth error:", e);
        setIsSigningIn(false);
        setAuthenticating(false);
      }
    };

    signIn();
  }, [response]);

  // À appeler au clic du bouton : ouvre le navigateur et signale globalement
  // (via le contexte) qu'une authentification est en cours.
  const startGithubSignIn = () => {
    if (!request) return;
    setIsSigningIn(true);
    setAuthenticating(true);
    promptAsync(); // Fonction qui ouvre une fenêtre de navigateur (Custom Tab sur Android, ASWebAuthenticationSession sur iOS) sur l'URL construite à partir de discovery.authorizationEndpoint + les paramètres (clientId, scopes, redirectUri, etc.)
  };

  return { promptAsync, request, isSigningIn, startGithubSignIn };
};

export default useGithubAuth;
