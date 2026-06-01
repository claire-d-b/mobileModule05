import { useEffect } from "react";
import { Calendar } from "react-native-calendars";

interface Props {
  page: number;
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  fetchEntriesByDate: (
    selectedDate: Date,
    pageNumber?: number,
  ) => Promise<void>;
}

// Remplace le Button + DatePickerModal par :
const _ = ({ page, date, setDate, fetchEntriesByDate }: Props) => {
  useEffect(() => {
    fetchEntriesByDate(date, page);
    // setDate(date);
  }, [page, date]);
  return (
    <Calendar
      style={{ width: "100%", borderRadius: 10, marginBottom: 10 }}
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
        date ? { [date.toISOString().split("T")[0]]: { selected: true } } : {}
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
