import React from "react";
import { View, Text, Platform } from "react-native";
import { Button, IconButton, PaperProvider } from "react-native-paper";
import {
  DatePickerModal,
  registerTranslation,
  en,
} from "react-native-paper-dates";
import { SafeAreaView } from "react-native-safe-area-context";
import CIconButton from "./CIconButton";
import CChip from "./CChip";
import CTouchableRipple from "./CTouchableRipple";
import CModal from "./CModal";
import CTextInput from "./CTextInput";
import CCalendar from "./CCalendar";

registerTranslation("en", en);

const backendUrl = "http://192.168.1.39:3000"

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
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [open, setOpen] = React.useState(false);
  const [entries, setEntries] = React.useState<Entry[]>([]);

  const [page, setPage] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);

  const [totalNbOfEntries, setTotalNbOfEntries] = React.useState(0);

  const [selectedEntry, setSelectedEntry] = React.useState<Entry | null>(null);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toISOString().split("T")[0]; // "2026-05-01"
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
    const dateStr = selectedDate.toISOString().split("T")[0];

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(login)}/date/${dateStr}?page=${pageNumber}`,
      );
      const data = await res.json();
      if (!res.ok) return;

      setEntries(data.entries ?? []);
      setTotalPages(data.totalPages ?? 0);
      setPage(data.page ?? 0);
    } catch (err) {
      console.error("❌ Error fetching entries by date:", err);
    }
  };

  const loadMore = async () => {
    if (page + 1 < totalPages) {
      const nextPage = page + 1;
      await fetchEntriesByDate(date ?? new Date(), nextPage);
      // setPage(nextPage);
    }
  };

  const loadLess = async () => {
    if (page > 0) {
      const nextPage = page - 1;
      await fetchEntriesByDate(date ?? new Date(), nextPage);
      // setPage(nextPage);
    }
  };

  const [visible, setVisible] = React.useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const deleteEntry = async (id: number) => {
    try {
      const res = await fetch(`${backendUrl}/entries/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("❌ Failed to delete entry:", data.error);
        return;
      }
      console.log("✅ Entry deleted:", data.entry);
      if (date) await fetchEntriesByDate(date);
    } catch (err) {
      console.error("❌ Error deleting entry:", err);
    }
  };

  const onDismissSingle = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const onConfirmSingle = (params: { date: Date | undefined }) => {
    setOpen(false);
    setDate(params.date);
    if (params.date) fetchEntriesByDate(params.date); // ← ici
  };

  return (
    <SafeAreaView
      style={{ display: "flex", flex: 1 }}
      edges={["top", "bottom", "left", "right"]}
    >
      <PaperProvider>
        <View
          style={{
            display: "flex",
            flex: 1,
            justifyContent: "flex-start",
            alignItems: "center",
            padding: 20,
          }}
        >
          {/* <Button
            onPress={() => setOpen(true)}
            uppercase={false}
            mode="outlined"
          >
            Pick single date
          </Button> */}
          <CCalendar
            page={page}
            date={date ?? new Date()}
            setDate={setDate}
            fetchEntriesByDate={fetchEntriesByDate}
          />
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
                    marginHorizontal: 20,
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
                    <CTouchableRipple
                      onPress={() => {
                        setSelectedEntry(e); // ← stocke l'entrée
                        showModal(); // ← ouvre la modal
                      }}
                      rippleColor="rgba(0, 0, 0, .32)"
                    >
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
                            buttonColor="#534DB3"
                            icon=""
                            disabled={true}
                          >
                            <Text>{formatDateFR(new Date(e.created_at))}</Text>
                          </CChip>
                        </View>
                        <CIconButton
                          icon={emotions[(e.feeling ?? 3) - 1]}
                          iconColor="#534DB3"
                          containerColor=""
                          size={20}
                          onPress={() => {}}
                          disabled={true}
                        />
                        <Text style={{ flex: 1, color: "#353172" }}>
                          {e.title}
                        </Text>
                        <CIconButton
                          style={{ alignSelf: "flex-end" }}
                          icon="close"
                          iconColor="#534DB3"
                          containerColor=""
                          size={20}
                          onPress={() => {
                            deleteEntry(e.id);
                          }}
                        />
                      </View>
                    </CTouchableRipple>
                  </View>
                </View>
              );
            })) || <Text style={{ color: "#353172" }}>No entry found</Text>}
          {selectedEntry && (
            <CModal
              visible={visible}
              hideModal={hideModal}
              showModal={showModal}
              style={{}}
              children={
                <View style={{ gap: 8 }}>
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 8,
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
                      mode="flat"
                      textStyle={{ color: "#534DB3" }}
                      style={{}}
                      buttonColor="#534DB3"
                      icon=""
                      disabled={true}
                    >
                      <>
                        <Text style={{ color: "gray" }}>date: </Text>
                        <Text>
                          {formatDateFR(new Date(selectedEntry?.created_at))}
                        </Text>
                      </>
                    </CChip>
                    <CIconButton
                      style={{
                        backgroundColor: "rgba(229, 231, 235)",
                      }}
                      mode="contained"
                      icon={emotions[(selectedEntry?.feeling ?? 3) - 1]}
                      iconColor="#534DB3"
                      containerColor=""
                      size={18}
                      onPress={() => {}}
                    />
                    <CChip
                      theme={{
                        colors: {
                          surfaceDisabled: "#BBB0D1",
                          onSurfaceDisabled: "#534DB3",
                        } as any,
                      }}
                      onPress={() => {}}
                      label=""
                      mode="flat"
                      textStyle={{ color: "#534DB3" }}
                      style={{}}
                      buttonColor="#534DB3"
                      icon=""
                      disabled={true}
                    >
                      <>
                        <Text style={{ color: "gray" }}>title: </Text>
                        <Text>{selectedEntry.title}</Text>
                      </>
                    </CChip>
                  </View>
                  <View
                    style={{
                      display: "flex",
                      width: "100%",
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <CTextInput
                      secureTextEntry={false}
                      right={<></>}
                      onBlur={() => {}}
                      onChangeText={() => {}}
                      label="Content"
                      msg={selectedEntry?.content ?? ""}
                      placeholder=""
                      variant="outlined"
                      textColor="#534DB3"
                      outlineColor="#534DB3"
                      outlineStyle={{ borderRadius: 10 }}
                      activeOutlineColor="#534DB3"
                      underlineColor="#534DB3"
                      activeUnderlineColor="#534DB3"
                      selectionColor="#534DB3"
                      contentStyle={{}}
                      style={{ flex: 1 }}
                      disabled={true}
                      multiline={true}
                    />
                  </View>
                </View>
              }
              button={false}
              content=""
            />
          )}
        </View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <CIconButton
            icon="chevron-left"
            iconColor="#534DB3"
            containerColor=""
            size={25}
            onPress={loadLess}
          />
          <CIconButton
            icon="chevron-right"
            iconColor="#534DB3"
            containerColor=""
            size={25}
            onPress={loadMore}
          />
        </View>
      </PaperProvider>
    </SafeAreaView>
  );
};

export default _;
