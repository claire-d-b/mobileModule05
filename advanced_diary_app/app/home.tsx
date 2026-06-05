import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import { View, Platform, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Modal, Portal, Text, Button, PaperProvider } from "react-native-paper";
import CTextInput from "./CTextInput";
import CIconButton from "./CIconButton";
import CRating from "./CRating";
import CChip from "./CChip";
import CModal from "./CModal";
import CAvatar from "./CAvatar";
import CBottomNav from "./CBottomNav";
import type { MD3Colors } from "react-native-paper";
import CButton from "./CButton";
import { Background } from "@react-navigation/elements";
import * as React from "react";
import { BottomNavigation } from "react-native-paper";
import Profile from "./Profile";
import Agenda from "./Agenda";
import Entries from "./Entries";

const _ = () => {
  const { localLogin } = useAuthContext();

  const ProfileRoute = () => <Profile login={localLogin} />;
  const AgendaRoute = () => <Agenda login={localLogin} />;
  const HomeRoute = () => <Entries />; // ← ton composant actuel sans CBottomNav

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {
      key: "home",
      title: "Home",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "profile",
      title: "Profile",
      focusedIcon: "account",
      unfocusedIcon: "account-outline",
    },
    { key: "agenda", title: "Agenda", focusedIcon: "calendar" },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    profile: ProfileRoute,
    agenda: AgendaRoute,
  });
  return (
    <SafeAreaView
      style={{ flex: 1 }}
      edges={["top", "bottom", "left", "right"]}
    >
      <PaperProvider>
        <CBottomNav
          style={{ backgroundColor: "white" }}
          index={index}
          setIndex={setIndex}
          routes={routes}
          renderScene={renderScene}
        />
      </PaperProvider>
    </SafeAreaView>
  );
};

export default _;
