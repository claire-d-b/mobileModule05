import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { useEffect, useRef } from "react";
import { useAuthContext } from "../context/AuthContext";
// import { router } from "expo-router";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

const useGoogleAuth = () => {
  const { setSession } = useAuthContext();

  // Garde le dernier access token Google en mémoire, pour pouvoir le révoquer au logout
  const lastAccessTokenRef = useRef<string | null>(null);

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
    console.log("Google redirectUri:", redirectUri);
    if (response?.type !== "success") return;
    const signIn = async () => {
      console.log(backendUrl);
      const { authentication } = response;
      const accessToken = authentication?.accessToken;
      if (!accessToken) {
        console.error("Missing access token");
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
          return;
        }

        if (!data.token || !data.user) {
          console.error("Missing token or user in backend response");
          return;
        }

        // On garde l'accessToken Google en mémoire pour pouvoir le révoquer plus tard (logout)
        lastAccessTokenRef.current = accessToken;

        console.log("Google user in DB:", data.user);
        // Le backend a vérifié l'accessToken Google et renvoyé un JWT — on l'enregistre comme session.
        await setSession(data.token, data.user.login);
        console.log("Google login success:", data.user.login);
        // router.replace("/home");
      } catch (e) {
        console.error("Google auth error:", e);
      }
    };
    signIn();
  }, [response]);

  console.log("Google request:", request);
  console.log("Google env vars:", {
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Révoque le token Google côté Google (déconnecte le compte Google associé à cette app).
  // Note : n'a d'effet que si l'utilisateur s'est connecté via Google pendant cette session
  // (le token n'est pas persisté après un redémarrage de l'app). Si aucun token n'est en
  // mémoire, la fonction ne fait rien — ce n'est pas une erreur.
  const signOutGoogle = async () => {
    const accessToken = lastAccessTokenRef.current;
    if (!accessToken) return;

    try {
      await AuthSession.revokeAsync(
        { token: accessToken },
        { revocationEndpoint: "https://oauth2.googleapis.com/revoke" },
      );
      lastAccessTokenRef.current = null;
      console.log("Google token revoked");
    } catch (e) {
      console.warn("Failed to revoke Google token:", e);
    }
  };

  return { promptAsync, request, signOutGoogle };
};

export default useGoogleAuth;
