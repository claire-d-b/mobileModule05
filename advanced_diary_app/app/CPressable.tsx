import * as React from "react";
import { View } from "react-native";
import { GestureResponderEvent, Pressable } from "react-native";

interface Props {
  onPress: (e: GestureResponderEvent) => void;
  children: React.ReactNode;
}

const _ = ({ onPress, children}: Props) => (
  <Pressable onPress={onPress}>
    {children}
  </Pressable>
);

export default _;
