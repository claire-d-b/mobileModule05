import { useEffect } from "react";
import { Calendar } from "react-native-calendars";
import { Dimensions, useWindowDimensions } from "react-native";

interface Props {
  page: number;
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
}

// Remplace le Button + DatePickerModal par :
const _ = ({ page, date, setDate }: Props) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const nwidth = isLandscape
    ? Dimensions.get("window").width / 2
    : Dimensions.get("window").width;

  const nheight = isLandscape
    ? height * 0.35 // ← 60% de la hauteur en landscape
    : height * 0.45; // ← 45% de la hauteur en portrait
  return (
    <Calendar
      firstDay={1}
      style={{
        borderRadius: 10,
        // marginBottom: 10,
        width: nwidth,
        height: nheight,
      }}
      theme={{
        backgroundColor: "#ffffff",
        calendarBackground: "#ffffff",
        selectedDayBackgroundColor: "#534DB3",
        selectedDayTextColor: "#ffffff",
        todayTextColor: "#534DB3",
        dayTextColor: "#353172",
        arrowColor: "#534DB3",
        monthTextColor: "#353172",
      }}
      markedDates={
        date ? { [date.toLocaleDateString("en-CA")]: { selected: true } } : {}
      }
      onDayPress={(day) => {
        const selected = new Date(day.dateString);
        setDate(selected);
        // fetchEntriesByDate(selected);
      }}
    />
  );
};

export default _;
