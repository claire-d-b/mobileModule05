import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Button, IconButton, PaperProvider } from "react-native-paper";
import {
  DatePickerModal,
  registerTranslation,
  en,
} from "react-native-paper-dates";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import CIconButton from "./CIconButton";
import CChip from "./CChip";
import CModal from "./CModal";
import CTextInput from "./CTextInput";
import CCalendar from "./CCalendar";

registerTranslation("en", en);

const backendUrl = "http://192.168.1.192:3000";

const emotions = [
  "emoticon",
  "emoticon-happy",
  "emoticon-neutral",
  "emoticon-sad",
  "emoticon-angry",
];

interface Entry {
  id: number;
  date: string;
  title: string;
  feeling: number;
  content: string;
  created_at: string;
}

interface Props {
  login: string | null;
}

const _ = ({ login }: Props) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [visibleDialog, setVisibleDialog] = useState(false);
  const showDialog = () => setVisibleDialog(true);
  const hideDialog = () => setVisibleDialog(false);

  const [details, setDetails] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const hideDetails = () => {
    setSelectedIndex(null);
    setDetails(false);
  };
  const showDetails = () => setDetails(true);
  const [pressed, setPressed] = useState<boolean[]>([false]);
  const [entries, setEntries] = useState<Entry[]>([]);

  const selectedEntry = selectedIndex !== null ? entries[selectedIndex] : null;
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  // const { localLogin } = useAuthContext();

  const auth = getAuth();
  const [email, setEmail] = useState<string | null>(login ?? null);

  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [open, setOpen] = React.useState(false);

  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  const [totalNbOfEntries, setTotalNbOfEntries] = React.useState(0);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-CA"); // "2026-05-01"
  };

  const formatDateFR = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "2-digit",
    });
  };

  const fetchEntriesByDate = async (selectedDate: Date, pageNumber = 0) => {
    if (!login) return;
    const dateStr = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
    ).toLocaleDateString("en-CA");

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(login)}/date/${dateStr}?page=${pageNumber}`,
      );
      const data = await res.json();
      if (!res.ok) return;

      setEntries(data.entries ?? []);
      console.log(data.entries.length);
      setTotalPages(data.totalPages ?? 0);
      setPage(data.page ?? 0);
    } catch (err) {
      console.error("❌ Error fetching entries by date:", err);
    }
  };

  const [visible, setVisible] = React.useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  useEffect(() => {
    fetchEntriesByDate(date ?? new Date(), page);
    // setDate(date);
  }, [date]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const resolvedEmail = user?.email ?? login ?? null;
      setEmail(resolvedEmail);
    });
    return () => unsubscribe();
  }, [login]);

  return (
    <View style={{ width: "100%", flex: 1 }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          flexDirection: isLandscape ? "row" : "column", // ← côte à côte en landscape
          justifyContent: "flex-start",
          alignItems: "center",
          // padding: 10,
        }}
      >
        <View
          style={{
            width: 275,
            height: 275,
            // padding: 5,
            overflow: "hidden",
            borderRadius: 10,
          }}
        >
          <CCalendar page={page} date={date ?? new Date()} setDate={setDate} />
        </View>
        <View
          style={{
            flex: 1,
          }}
        >
          {entries && entries.length > 0 && (
            <Text
              style={{
                color: "#534DB3",
                alignSelf: "flex-start",
                marginLeft: 10,
                marginTop: 40,
              }}
            >
              Scroll down to see next entries.
            </Text>
          )}
          <ScrollView style={{ flex: 1 }}>
            {(entries &&
              entries.length > 0 &&
              entries.map((e, i) => {
                return (
                  <View
                    key={`entry_agenda_${i}`}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      // marginHorizontal: 20,
                      margin: 5,
                      marginRight: 80,
                      // marginHorizontal: 20,
                      padding: 5,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#BBB0D1",
                      borderRadius: 10,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <View
                          key={`touchable_${i}`}
                          style={{
                            width: "100%",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "white",
                              borderRadius: 10,
                              margin: 5,
                            }}
                          >
                            <CChip
                              theme={{
                                colors: {
                                  surfaceDisabled: "#BBB0D1",
                                  onSurfaceDisabled: "#534DB3",
                                } as any,
                              }}
                              onPress={() => {}}
                              label=""
                              mode="outlined"
                              style={{ padding: 5 }}
                              textStyle={{ color: "#534DB3" }}
                              icon=""
                              disabled={true}
                            >
                              <Text>{formatDateFR(new Date(e.date))}</Text>
                            </CChip>
                          </View>
                          <CIconButton
                            icon={emotions[(e.feeling ?? 3) - 1]}
                            iconColor="#534DB3"
                            containerColor=""
                            size={20}
                            onPress={() => {}}
                            disabled={true}
                            theme={{
                              colors: {
                                onSurfaceDisabled: "white", // ← couleur de l'icône quand disabled
                              },
                            }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              color: "#353172",
                              paddingRight: 5,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {e.title}
                          </Text>
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "flex-end",
                              alignItems: "center",
                            }}
                          >
                            <CIconButton
                              icon="eye-outline"
                              iconColor={pressed[i] ? "white" : "#534DB3"}
                              containerColor="transparent"
                              size={20}
                              onPress={() => {
                                setSelectedIndex(i); // ← add this
                                showDetails();
                              }}
                            />
                            <CIconButton
                              icon="trash-can-outline"
                              iconColor={pressed[i] ? "white" : "#534DB3"}
                              containerColor="transparent"
                              size={20}
                              onPress={() => {
                                setEntryToDelete(e.id); // ← stocke le bon id
                                showDialog();
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })) || (
              <Text style={{ color: "#353172", textAlign: "center" }}>
                No entry found
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default _;
