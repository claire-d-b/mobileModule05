import * as React from "react";
import { BottomNavigation, Text } from "react-native-paper";
import { useAuthContext } from "../context/AuthContext";
import Profile from "./Profile";
import Agenda from "./Agenda";

interface Props {
  style: {};
}

const _ = ({ style }: Props) => {
  const { localLogin } = useAuthContext();

  const ProfileRoute = () => <Profile login={localLogin} />;
  const AgendaRoute = () => <Agenda login={localLogin} />;

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {
      key: "profile",
      title: "Profile",
      focusedIcon: "account",
      unfocusedIcon: "account-outline",
    },
    { key: "agenda", title: "Agenda", focusedIcon: "calendar" },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    profile: ProfileRoute,
    agenda: AgendaRoute,
  });

  return (
    <BottomNavigation
      style={style}
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default _;
