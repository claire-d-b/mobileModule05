import { View, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import CIconButton from "./CIconButton";
import CChip from "./CChip";
import CAvatar from "./CAvatar";
import CDelete from "./CDelete";
import CViewEntry from "./CViewEntry";
import useGoogleAuth from "../auth/auth_google";
import { formatDate } from "../utils/utils";

const emotions = [
  "emoticon",
  "emoticon-happy",
  "emoticon-neutral",
  "emoticon-sad",
  "emoticon-angry",
];

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

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
  entries: Entry[];
  fetchEntries: (pageNumber?: number, email?: string | null) => Promise<void>;
}

const _ = ({ login, entries, fetchEntries }: Props) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { signOutGoogle } = useGoogleAuth();

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

  const { localLogin, setLocalLogin } = useAuthContext();

  const [totalNbOfEntries, setTotalNbOfEntries] = useState(0);

  const selectedEntry = selectedIndex !== null ? entries[selectedIndex] : null;
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  const containerStyle = {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
  };

  interface Stats {
    [key: number]: { count: number; percentage: number };
  }

  const [stats, setStats] = useState<Stats>({});

  const fetchStats = async () => {
    if (!login) return;
    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(login)}/stats`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      );
      const data = await res.json();
      setStats(data.stats ?? {});
      console.log("stats", data.stats);
    } catch (e) {
      console.error("fetchStats:", e);
    }
  };

  const fetchCount = async () => {
    if (!login) return;

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(login)}/count`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        },
      );

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("count not JSON:", text);
        return;
      }

      setTotalNbOfEntries(data.count ?? 0);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      const res = await fetch(`${backendUrl}/entries/${id}`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to delete entry:", data.error);
        return;
      }
      console.log("Entry deleted:", data.entry);
      await fetchEntries(0, login); // celui de Home, met à jour le state partagé
      fetchCount();
      fetchStats();
    } catch (e) {
      console.error("Error deleting entry:", e);
    }
  };

  const logout = async () => {
    try {
      await signOutGoogle();
    } catch (e) {
      console.warn("Google sign-out failed:", e);
    }
    try {
      await getAuth().signOut();
    } catch (_) {}
    await setLocalLogin(null);
    router.replace("/signin");
  };

  useEffect(() => {
    if (!login) return;
    if (!localLogin) router.replace("/signin");
    fetchCount();
    fetchStats();
  }, [localLogin, login, entries]);

  useEffect(() => {
    if (!login) return;
    if (!localLogin) router.replace("/signin");

    fetchCount();
    fetchEntries(0, login);
    fetchStats();
  }, [localLogin, login]);

  return (
    <View
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isLandscape ? "flex-start" : "space-around",
        backgroundColor: "white",
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            padding: isLandscape ? 10 : 0,
          }}
        >
          <CAvatar
            size={80}
            icon="account"
            color="white"
            style={{ backgroundColor: "#534DB3" }}
          />
          <Text style={{ padding: 20, color: "#353172" }}>{login}</Text>
        </View>
        <CIconButton
          mode="outlined"
          icon="logout"
          iconColor="#534DB3"
          containerColor="transparent"
          size={20}
          onPress={logout}
        />
      </View>
      {(entries && entries.length > 0 && (
        <View
          style={{
            flexDirection: isLandscape ? "row" : "column",
            width: "100%",
            alignItems: isLandscape ? "flex-start" : "center",
          }}
        >
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              width: isLandscape ? "50%" : "100%",
            }}
          >
            <Text style={{ color: "#353172", alignSelf: "center" }}>
              Your last diary entries
            </Text>
            <View
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {entries &&
                entries.length > 0 &&
                entries.slice(0, 2).map((e, i) => {
                  return (
                    <View
                      key={`entry_${i}`}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        marginHorizontal: 20,
                        marginVertical: 2.5,
                        padding: 5,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#BBB0D1",
                        borderRadius: 10,
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
                          textStyle={{ color: "#534DB3" }}
                          style={{}}
                          icon=""
                          disabled={true}
                        >
                          {formatDate(new Date(e.date))}
                        </CChip>
                      </View>
                      <CIconButton
                        icon={emotions[(e.feeling ?? 3) - 1]}
                        iconColor="#534DB3"
                        containerColor=""
                        size={20}
                        onPress={() => {}}
                        theme={{
                          colors: {
                            onSurfaceDisabled: "white",
                          },
                        }}
                        disabled={true}
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
                          icon="magnify"
                          iconColor="#534DB3"
                          containerColor="transparent"
                          size={20}
                          onPress={() => {
                            setSelectedIndex(i);
                            showDetails();
                          }}
                        />
                        <CIconButton
                          icon="trash-can-outline"
                          iconColor="#534DB3"
                          containerColor="transparent"
                          size={20}
                          onPress={() => {
                            setEntryToDelete(e.id);
                            showDialog();
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
            </View>
          </View>
          <View
            style={{
              display: "flex",
              flexDirection: "column",
              flexWrap: "wrap",
              width: isLandscape ? "50%" : "100%",
            }}
          >
            <View
              style={{
                width: "100%",
                flexDirection: "column",
                paddingHorizontal: 20,
              }}
            >
              {totalNbOfEntries > 0 && (
                <Text
                  style={{
                    color: "#353172",
                    textAlign: "center",
                  }}
                >
                  {`Your feels for ${totalNbOfEntries} entries`}
                </Text>
              )}
              {[1, 2, 3, 4, 5]
                .filter((f) => stats[f]?.percentage > 0)
                .map((f) => (
                  <View
                    key={`stat_${f}`}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      width: "100%",
                    }}
                  >
                    {(isLandscape && (
                      <CIconButton
                        style={{ padding: 0, margin: 0 }}
                        icon={emotions[f - 1]}
                        iconColor="#534DB3"
                        containerColor="transparent"
                        size={16}
                        onPress={() => {}}
                      />
                    )) || (
                      <CIconButton
                        icon={emotions[f - 1]}
                        iconColor="#534DB3"
                        containerColor="transparent"
                        size={20}
                        onPress={() => {}}
                      />
                    )}
                    <View
                      style={{
                        flex: 1,
                        height: isLandscape ? 4 : 6,
                        backgroundColor: "#e0e0e0",
                        borderRadius: 4,
                        marginHorizontal: 8,
                      }}
                    >
                      <View
                        style={{
                          width: `${stats[f]?.percentage ?? 0}%`,
                          height: isLandscape ? 4 : 6,
                          backgroundColor: "#534DB3",
                          borderRadius: 4,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        color: "#353172",
                        minWidth: 45,
                        textAlign: "right",
                        marginRight: 20,
                      }}
                    >
                      {`${stats[f]?.percentage ?? 0}%`}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        </View>
      )) || <Text style={{ color: "#534DB3" }}>No entry found</Text>}
      {details && (
        <CViewEntry
          emotions={emotions}
          containerStyle={containerStyle}
          details={details}
          hideDetails={hideDetails}
          selectedEntry={selectedEntry}
        />
      )}
      <CDelete
        visibleDialog={visibleDialog}
        hideDialog={hideDialog}
        deleteEntry={deleteEntry}
        idx={entryToDelete ?? -1}
      />
    </View>
  );
};

export default _;
