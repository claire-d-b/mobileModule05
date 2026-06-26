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
  return (
    <Calendar
      firstDay={1}
      style={{
        width: 350,
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
