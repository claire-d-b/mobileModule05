import * as Google from "expo-auth-session/providers/google";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import auth from "../config/firebase";

const backendUrl = "http://192.168.1.164:3000";

const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    extraParams: {
      prompt: "select_account", // force le choix du compte à chaque fois
    },
  });

  const [lastAccessToken, setLastAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type !== "success") return;

    const signIn = async () => {
      const { authentication } = response;
      const accessToken = authentication?.accessToken;
      const idToken = authentication?.idToken;

      if (!accessToken || !idToken) {
        console.error("❌ Missing tokens");
        return;
      }

      setLastAccessToken(accessToken);

      try {
        const res = await fetch(`${backendUrl}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: accessToken }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("❌ Backend Google error:", data.error);
          return;
        }
        console.log("✅ Google user in DB:", data.user);

        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        console.log("✅ Google login success:", data.user.login);
      } catch (err) {
        console.error("❌ Google auth error:", err);
      }
    };

    signIn();
  }, [response]);

  const signOutGoogle = async () => {
    // Révoque le token côté Google (invalide l'accès existant, pas de navigateur ouvert)
    if (lastAccessToken) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${lastAccessToken}`,
          { method: "POST" },
        );
        console.log("✅ Google token revoked");
      } catch (e) {
        console.warn("⚠️ Failed to revoke Google token:", e);
      }
      setLastAccessToken(null);
    }
  };

  return { promptAsync, request, signOutGoogle };
};

export default useGoogleAuth;
