import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import { View, Platform, useWindowDimensions } from "react-native";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  Modal,
  Portal,
  Text,
  Button,
  PaperProvider,
  IconButton,
} from "react-native-paper";
import { router } from "expo-router";
import CTextInput from "./CTextInput";
import CIconButton from "./CIconButton";
import CRating from "./CRating";
import CChip from "./CChip";
import CModal from "./CModal";
import CAvatar from "./CAvatar";

const nbOfEntriesPerPage = 6;

const emotions = [
  "emoticon",
  "emoticon-happy",
  "emoticon-neutral",
  "emoticon-sad",
  "emoticon-angry",
];

const backendUrl = "http://192.168.1.192:3000";

interface Entry {
  id: number;
  date: string;
  title: string;
  feeling: number;
  content: string;
  created_at: string;
}

interface PaginatedResponse {
  entries: Entry[];
  page: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Props {
  login: string | null;
}

const successColor = "#25783F";
const errorColor = "#A12237";

const Profile = ({ login }: Props) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { localLogin, setLocalLogin } = useAuthContext();

  const auth = getAuth();
  const [email, setEmail] = useState<string | null>(localLogin ?? null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const resolvedEmail = user?.email ?? localLogin ?? null;
      setEmail(resolvedEmail);
      // ✅ passe resolvedEmail
      if (resolvedEmail) fetchEntries(0, resolvedEmail);
    });
    return () => unsubscribe();
  }, [localLogin]);
  // const firebaseEmail = getAuth().currentUser?.email;
  // const email = firebaseEmail ?? localLogin;

  useEffect(() => {
    if (!email) return;

    fetchCount();
    fetchEntries(0);
    setPage(0);
  }, [email]);

  console.log("authhhh");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [feeling, setFeeling] = useState(3);

  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [totalNbOfEntries, setTotalNbOfEntries] = useState(0);

  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  // const auth = getAuth();
  // const email = auth.currentUser?.email ??
  // ;
  console.log();

  const fetchEntries = async (
    pageNumber = 0,
    resolvedEmail?: string | null,
  ) => {
    const emailToUse = resolvedEmail ?? email;
    if (!emailToUse) return;

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(emailToUse)}?page=${pageNumber}`,
      );
      const data = await res.json();
      if (!res.ok) return;

      const list: Entry[] = data.entries ?? [];
      setEntries(list);
    } catch (err) {
      console.error("❌ Error fetching entries:", err);
    }
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
      );
      const data = await res.json();
      console.log("📊 stats:", data);
      setStats(data.stats ?? {});
      console.log("stats", stats);
    } catch (err) {
      console.error("❌ fetchStats:", err);
    }
  };

  const fetchCount = async () => {
    if (!login) return;

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(login)}/count`,
      );

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("❌ count not JSON:", text);
        return;
      }

      setTotalNbOfEntries(data.count ?? 0);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateFR = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "2-digit",
    });
  };

  const logout = async () => {
    try {
      await getAuth().signOut();
    } catch (_) {}
    await setLocalLogin(null);
    router.replace("/");
  };

  useEffect(() => {
    setType("");
    if (!login) return;

    fetchCount();
    fetchEntries(0);
    fetchStats();
    setPage(0);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [entries]);

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
          <Text style={{ padding: 20, color: "#353172" }}>{email}</Text>
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
            style={{ width: "100%", display: "flex", flexDirection: "column" }}
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
                        {formatDateFR(new Date(e.date))}
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
                          onSurfaceDisabled: "white", // ← couleur de l'icône quand disabled
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
                    width: "100%", // ← pas de flex: 1 ici
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
    </View>
  );
};

export default Profile;
