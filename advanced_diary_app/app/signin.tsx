import React, { useState } from "react";
import { View } from "react-native";
import { TextInput } from "react-native-paper";
import { useAuthContext } from "../context/AuthContext";
import { router } from "expo-router";
import useGoogleAuth from "../auth/auth_google";
import useGithubAuth from "../auth/auth_github";
import CTextInput from "./CTextInput";
import CButton from "./CButton";
import CLoading from "./CLoading";

interface Information {
  login: string;
  password: string;
}

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

const SignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");

  const { promptAsync: googlePrompt, request: googleRequest } = useGoogleAuth();
  const { promptAsync: githubPrompt, request: githubRequest } = useGithubAuth();
  const { setSession } = useAuthContext();

  const handleSubmit = async ({ login, password }: Information) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${backendUrl}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        console.error("Login failed:", data.error);
        setIsLoading(false); // cache loading si erreur
        return;
      }

      if (!data.token || !data.user) {
        setError("Unexpected server response");
        console.error("Missing token or user in backend response");
        setIsLoading(false);
        return;
      }

      // Le backend est désormais la seule source de vérité, quel que soit le provider (local, Google, GitHub)
      console.log("Login success:", data.user);
      await setSession(data.token, data.user.login);
      setLogin("");
      setPassword("");
      router.replace("/home" as any);
    } catch (e) {
      console.error("Error during login:", e);
      setError("An error occurred");
      setIsLoading(false); // cache loading si erreur
    }
  };
  if (isLoading) return <CLoading />;

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ width: "100%", padding: 10 }}>
        <CTextInput
          secureTextEntry={false}
          right={<></>}
          onBlur={() => {}}
          onChangeText={(text: string) => setLogin(text)}
          label="login"
          msg={login}
          placeholder="Type your login"
          variant="outlined"
          textColor="#534DB3"
          outlineColor="#534DB3"
          outlineStyle={{ borderRadius: 10 }}
          activeOutlineColor="#534DB3"
          underlineColor="#534DB3"
          activeUnderlineColor="#534DB3"
          selectionColor="#534DB3"
          contentStyle={{}}
          style={{ width: "100%" }}
          disabled={false}
          multiline={false}
        />
        <CTextInput
          secureTextEntry={secure}
          right={
            <TextInput.Icon
              icon={secure ? "eye-off" : "eye"}
              onPress={() => setSecure(!secure)}
            />
          }
          onBlur={() => {}}
          onChangeText={(text: string) => setPassword(text)}
          label="password"
          msg={password}
          placeholder="Type your password"
          variant="outlined"
          textColor="#534DB3"
          outlineColor="#534DB3"
          outlineStyle={{ borderRadius: 10 }}
          activeOutlineColor="#534DB3"
          underlineColor="#534DB3"
          activeUnderlineColor="#534DB3"
          selectionColor="#534DB3"
          contentStyle={{}}
          style={{ width: "100%" }}
          disabled={false}
          multiline={false}
        />
        {error ? (
          <CButton
            msg={error}
            variant="text"
            textColor="red"
            style={{}}
            buttonColor="transparent"
            labelStyle={{}}
            onPress={() => {}}
          />
        ) : null}
        <CButton
          onPress={() => handleSubmit({ login, password })}
          msg="Send"
          variant="contained"
          textColor="white"
          style={{ display: "flex", alignSelf: "flex-end", marginTop: 20 }}
          buttonColor="#534DB3"
          labelStyle={{}}
        />
        <CButton
          onPress={() => router.push("/register")}
          msg="Not registered yet ? Create an account"
          variant="text"
          textColor="#534DB3"
          style={{ display: "flex", alignSelf: "flex-end" }}
          buttonColor="transparent"
          labelStyle={{}}
        />
        <CButton
          onPress={() => {
            setIsLoading(true); // affiche loading avant d'ouvrir le navigateur
            googleRequest &&
              googlePrompt().then((result) => {
                // si l'utilisateur annule ou si ça échoue, on remet isLoading à false
                if (result?.type !== "success") {
                  setIsLoading(false);
                }
              });
          }}
          msg="Connect with Google"
          variant="text"
          textColor="gray"
          style={{ display: "flex", alignSelf: "flex-end" }}
          buttonColor="transparent"
          labelStyle={{}}
        />
        <CButton
          onPress={() => {
            setIsLoading(true);
            githubRequest &&
              githubPrompt().then((result) => {
                if (result?.type !== "success") {
                  setIsLoading(false);
                }
              });
          }}
          msg="Connect with Github"
          variant="text"
          textColor="gray"
          style={{ display: "flex", alignSelf: "flex-end" }}
          buttonColor="transparent"
          labelStyle={{}}
        />
      </View>
    </View>
  );
};

export default SignIn;
