import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "../context/AuthContext";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

const useGoogleAuth = () => {
  const { setSession, setAuthenticating } = useAuthContext();

  // true dès que Google renvoie une réponse "success", jusqu'à ce que le
  // backend ait répondu et la session soit posée (ou qu'une erreur survienne).
  const [isSigningIn, setIsSigningIn] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "com.anonymous.diaryapp", // must match app.json — même scheme que GitHub, fixe quel que soit le mode (tunnel/lan/dev build)
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;

    // Le retour direct de promptAsync() n'est pas fiable sur Android : le
    // Custom Tab peut se fermer (dismiss) avant que le vrai deep link
    // "success" n'arrive. On pilote isSigningIn/authenticating uniquement
    // depuis ce `response`, jamais depuis la Promise de promptAsync().
    if (response.type !== "success") {
      setIsSigningIn(false);
      setAuthenticating(false);
      return;
    }

    setIsSigningIn(true);

    const signIn = async () => {
      const { authentication } = response;
      const accessToken = authentication?.accessToken;
      if (!accessToken) {
        console.error("Missing access token");
        setIsSigningIn(false);
        setAuthenticating(false);
        return;
      }
      try {
        const res = await fetch(`${backendUrl}/auth/google`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ token: accessToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Backend Google error:", data.error);
          setIsSigningIn(false);
          setAuthenticating(false);
          return;
        }

        if (!data.token || !data.user) {
          console.error("Missing token or user in backend response");
          setIsSigningIn(false);
          setAuthenticating(false);
          return;
        }

        console.log("Google user in DB:", data.user);
        // Le backend a vérifié l'accessToken Google et renvoyé un JWT — on l'enregistre comme session.
        await setSession(data.token, data.user.login);
        console.log("Google login success:", data.user.login);
        // On lève authenticating seulement une fois la session posée ET la
        // navigation lancée : index.tsx a alors un `token` valide et peut
        // rediriger vers /home directement s'il est re-sollicité entre-temps.
        setAuthenticating(false);
        // Pas de setIsSigningIn(false) ici : on laisse le loading affiché
        // jusqu'à ce que la navigation démonte le composant appelant.
      } catch (e) {
        console.error("Google auth error:", e);
        setIsSigningIn(false);
        setAuthenticating(false);
      }
    };
    signIn();
  }, [response]);

  // À appeler au clic du bouton : ouvre le navigateur et signale globalement
  // (via le contexte) qu'une authentification est en cours, pour que
  // app/index.tsx ne redirige pas vers /signin si le deep link de retour
  // ramène temporairement l'app sur la route racine.
  const startGoogleSignIn = () => {
    if (!request) return;
    setIsSigningIn(true);
    setAuthenticating(true);
    promptAsync();
  };

  return {
    promptAsync,
    request,
    isSigningIn,
    startGoogleSignIn,
  };
};

export default useGoogleAuth;
