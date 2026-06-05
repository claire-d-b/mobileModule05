import * as React from "react";
import type { ReactNode, Dispatch, SetStateAction } from "react";
import { BottomNavigation, Text } from "react-native-paper";
import { useAuthContext } from "../context/AuthContext";
import Profile from "./Profile";
import Agenda from "./Agenda";

// Définis le type manuellement
type Route = {
  key: string;
  title?: string;
  focusedIcon?: string;
  unfocusedIcon?: string;
};

interface Props {
  style: {};
  index: number;
  setIndex: Dispatch<SetStateAction<number>>;
  routes: Route[];
  renderScene: (props: {
    route: Route;
    jumpTo: (key: string) => void;
  }) => ReactNode;
}

const _ = ({ style, index, setIndex, routes, renderScene }: Props) => {
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
