import * as React from "react";
import { View } from "react-native";
import { GestureResponderEvent } from "react-native";

import { Text, TouchableRipple } from "react-native-paper";

interface Props {
  onPress: (e: GestureResponderEvent) => void;
  rippleColor: string;
  children: React.ReactNode;
}

const _ = ({ onPress, rippleColor, children }: Props) => (
  <TouchableRipple onPress={onPress} rippleColor={rippleColor}>
    {children}
  </TouchableRipple>
);

export default _;
