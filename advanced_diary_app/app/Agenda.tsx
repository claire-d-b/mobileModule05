import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import CIconButton from "./CIconButton";
import CChip from "./CChip";
import CCalendar from "./CCalendar";
import CDelete from "./CDelete";
import CViewEntry from "./CViewEntry";
import { formatDate } from "../utils/utils";

const backendUrl = "http://192.168.1.39:3000";

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

  const containerStyle = {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
  };

  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

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

  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const [page, setPage] = React.useState(0);

  const loadMore = async () => {
    if (hasNext) {
      const nextPage = page + 1;
      await fetchEntriesByDate(date ?? new Date(), nextPage); // ← nextPage pas page
      setPage(nextPage);
    }
  };

  const loadLess = async () => {
    if (hasPrev) {
      const nextPage = page - 1;
      await fetchEntriesByDate(date ?? new Date(), nextPage); // ← nextPage pas page
      setPage(nextPage);
    }
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
      setPage(data.page ?? 0);
      setHasNext(data.hasNext ?? false);
      setHasPrev(data.hasPrev ?? false);
    } catch (err) {
      console.error("Error fetching entries by date:", err);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      const res = await fetch(`${backendUrl}/entries/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to delete entry:", data.error);
        return;
      }
      console.log("Entry deleted:", data.entry);
      fetchEntriesByDate(date ?? new Date(), page);
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  };

  useEffect(() => {
    fetchEntriesByDate(date ?? new Date(), page);
  }, [date, login]);

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
          {entries && entries.length >= 4 && (
            <Text
              style={{
                color: "#534DB3",
                alignSelf: "center",
                marginHorizontal: 20,
                marginTop: 40,
              }}
            >
              {`Scroll down and click below to get other entries (<)/(>).`}
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
                      margin: 5,
                      marginHorizontal: isLandscape ? 80 : 20,
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
                              <Text>{formatDate(new Date(e.date))}</Text>
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
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {hasPrev && (
                <CIconButton
                  style={{ alignSelf: "center", marginBottom: 40 }}
                  icon="chevron-left"
                  iconColor="#534DB3"
                  containerColor=""
                  size={25}
                  onPress={loadLess}
                />
              )}
              {hasNext && (
                <CIconButton
                  style={{ alignSelf: "center", marginBottom: 40 }}
                  icon="chevron-right"
                  iconColor="#534DB3"
                  containerColor=""
                  size={25}
                  onPress={loadMore}
                />
              )}
            </View>
          </ScrollView>
          {details && (
            <CViewEntry
              emotions={emotions}
              containerStyle={containerStyle}
              details={details}
              hideDetails={hideDetails}
              selectedEntry={selectedEntry}
            />
          )}
        </View>
      </View>
      <CDelete
        visibleDialog={visibleDialog}
        setVisibleDialog={setVisibleDialog}
        showDialog={showDialog}
        hideDialog={hideDialog}
        deleteEntry={deleteEntry}
        idx={entryToDelete ?? -1}
      />
    </View>
  );
};

export default _;
