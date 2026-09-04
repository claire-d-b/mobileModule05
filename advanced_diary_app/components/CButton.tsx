import { Button } from "react-native-paper";
import { GestureResponderEvent } from "react-native";

interface Props {
  onPress: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  msg: string;
  variant: "text" | "outlined" | "contained" | "elevated" | "contained-tonal";
  textColor: string;
  style: {};
  buttonColor: string;
  labelStyle: {};
}

const _ = ({
  onPress,
  disabled,
  msg,
  variant,
  textColor,
  style,
  buttonColor,
  labelStyle,
}: Props) => {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      style={style}
      mode={variant}
      textColor={textColor}
      buttonColor={buttonColor}
      labelStyle={labelStyle}
    >
      {msg}
    </Button>
  );
};

export default _;
