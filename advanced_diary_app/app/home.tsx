import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import CBottomNav from "./CBottomNav";
import * as React from "react";
import { BottomNavigation } from "react-native-paper";
import Profile from "./Profile";
import Agenda from "./Agenda";
import Entries from "./Entries";

const _ = () => {
  const { localLogin } = useAuthContext();
  const [email, setEmail] = useState<string | null>(localLogin ?? null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const resolvedEmail = user?.email ?? localLogin ?? null;
      setEmail(resolvedEmail);
    });
    return () => unsubscribe();
  }, [localLogin]);

  const ProfileRoute = () => <Profile login={email} />;
  const AgendaRoute = () => <Agenda login={email} />;
  const HomeRoute = () => <Entries login={email} />; // ← ton composant actuel sans CBottomNav

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
    {
      key: "agenda",
      title: "Agenda",
      focusedIcon: "calendar",
      unfocusedIcon: "calendar-outline",
    },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    home: HomeRoute,
    profile: ProfileRoute,
    agenda: AgendaRoute,
  });

  return (
    <CBottomNav
      style={{ backgroundColor: "white" }}
      index={index}
      setIndex={setIndex}
      routes={routes}
      renderScene={renderScene}
    />
  );
};

export default _;
