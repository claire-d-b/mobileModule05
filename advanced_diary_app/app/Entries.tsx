import { View, useWindowDimensions, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { Text } from "react-native-paper";
import CIconButton from "./CIconButton";
import CChip from "./CChip";
import CAddEntry from "./CAddEntry";
import CDelete from "./CDelete";
import CViewEntry from "./CViewEntry";
import { formatDate } from "../utils/utils";
import CButton from "./CButton";

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
  page: number;
  setPage: (p: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  fetchEntries: (pageNumber?: number, email?: string | null) => Promise<void>;
}

export const getEllipsis = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

interface Props {
  login: string | null;
}

const _ = ({
  login,
  entries,
  page,
  setPage,
  hasNext,
  hasPrev,
  fetchEntries,
}: Props) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [feeling, setFeeling] = useState(1);

  const [visibleDialog, setVisibleDialog] = useState(false);
  const showDialog = () => setVisibleDialog(true);
  const hideDialog = () => setVisibleDialog(false);

  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const hideDetails = () => {
    setSelectedIndex(null);
    setDetails(false);
  };
  const showDetails = () => setDetails(true);

  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const containerStyle = {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
  };

  const auth = getAuth();
  const [email, setEmail] = useState<string | null>(login ?? null);

  const handleSubmit = async () => {
    setMessage("");
    if (!title || !content) {
      setMessage("Please provide a title and content.");
      setType("error");
      return;
    }
    console.log("auth.currentUser:", auth.currentUser?.email);
    console.log("email utilisé:", email);

    try {
      const res = await fetch(`${backendUrl}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          email,
          date: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD
          title,
          feeling,
          content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Failed to create entry:", data.error);
        return;
      }

      console.log("Entry created:", data);
      setMessage("Entry successfully created!");
      setType("success");

      // Reset
      setTitle("");
      setContent("");
      setFeeling(1);
      await fetchEntries(0, email);
    } catch (e) {
      console.error("Error creating entry:", e);
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

      // si c'était la dernière entrée de la page, revenir à la page précédente
      if (entries.length === 1 && page > 0) {
        const prevPage = page - 1;
        setPage(prevPage);
        await fetchEntries(prevPage, email);
      } else {
        await fetchEntries(page, email);
      }
    } catch (e) {
      console.error("Error deleting entry:", e);
    }
  };

  const loadMore = async () => {
    if (hasNext) {
      const nextPage = page + 1;
      await fetchEntries(nextPage, email);
      setPage(nextPage);
    }
  };

  const loadLess = async () => {
    if (hasPrev) {
      const nextPage = page - 1;
      await fetchEntries(nextPage, email);
      setPage(nextPage);
    }
  };

  useEffect(() => {
    if (!login) return;
    setEmail(login ?? null);
    fetchEntries(0, login);
    setPage(0);
  }, [login]);

  const selectedEntry = selectedIndex !== null ? entries[selectedIndex] : null;
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 10,
        }}
      >
        <Text style={{ color: "#353172", padding: isLandscape ? 0 : 20 }}>
          Add a new entry to your diary by clicking Add entry. You can click on
          a specific entry in the below list to get details.
        </Text>
        <CButton
          msg={"Add entry"}
          variant="contained"
          textColor="white"
          labelStyle=""
          style={{ margin: 20, alignSelf: "center" }}
          buttonColor="#534DB3"
          onPress={showModal}
        />
      </View>
      <CAddEntry
        isLandscape={isLandscape}
        type={type}
        message={message}
        visible={visible}
        hideModal={hideModal}
        showModal={showModal}
        style={{
          justifyContent: isLandscape ? "flex-start" : "center",
          marginTop: isLandscape ? 30 : 50,
          flex: 1,
        }}
        title={title}
        setTitle={setTitle}
        setFeeling={setFeeling}
        content={content}
        setContent={setContent}
        handleSubmit={handleSubmit}
      />
      <ScrollView
        horizontal={isLandscape ? true : false}
        style={{
          display: "flex",
          flexDirection: isLandscape ? "row" : "column",
          width: "100%",
          flex: 1,
          padding: 10,
        }}
        contentContainerStyle={{
          flexDirection: isLandscape ? "row" : "column",
          flexWrap: "nowrap",
          padding: 10,
        }}
      >
        {entries &&
          entries.length > 0 &&
          entries.map((e, i) => {
            return (
              <View
                key={`entry_${i}`}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginHorizontal: isLandscape ? 5 : 20,
                  marginVertical: isLandscape ? 1 : 2.5,
                  padding: isLandscape ? 3 : 5,
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
                    style={{ alignSelf: "flex-start" }} // ← add this}}
                    icon=""
                    disabled={true}
                  >
                    <Text style={{ color: "#534DB3" }}>
                      {formatDate(new Date(e.date))}
                    </Text>
                  </CChip>
                </View>
                <CIconButton
                  icon={emotions[(e.feeling ?? 1) - 1]}
                  iconColor="#534DB3"
                  containerColor=""
                  size={20}
                  onPress={() => {}}
                  disabled={true}
                  theme={{
                    colors: {
                      onSurfaceDisabled: "white",
                    },
                  }}
                />
                <Text
                  style={{
                    alignSelf: "center",
                    color: "#353172",
                  }}
                >
                  {(isLandscape && getEllipsis(e.title, 10)) ||
                    getEllipsis(e.title, 4)}
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
        {details && (
          <CViewEntry
            emotions={emotions}
            containerStyle={containerStyle}
            details={details}
            hideDetails={hideDetails}
            selectedEntry={selectedEntry}
          />
        )}
      </ScrollView>
      {isLandscape && (
        <Text
          style={{
            width: "100%",
            marginLeft: 20,
            marginTop: 10,
            paddingLeft: 30,
            color: "#534DB3",
          }}
        >
          {`Scroll on the right to see next 6 entries. Click below to get newer (>) or older (<) entries.`}
        </Text>
      )}
      {isLandscape && (
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
              style={{ alignSelf: "center", marginBottom: 5 }}
              icon="chevron-left"
              iconColor="#534DB3"
              containerColor=""
              size={25}
              onPress={loadLess}
            />
          )}
          {hasNext && (
            <CIconButton
              style={{ alignSelf: "center", marginBottom: 5 }}
              icon="chevron-right"
              iconColor="#534DB3"
              containerColor=""
              size={25}
              onPress={loadMore}
            />
          )}
        </View>
      )}
      {!isLandscape && (
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
              icon="chevron-left"
              iconColor="#534DB3"
              containerColor=""
              size={25}
              onPress={loadLess}
            />
          )}
          {hasNext && (
            <CIconButton
              icon="chevron-right"
              iconColor="#534DB3"
              containerColor=""
              size={25}
              onPress={loadMore}
            />
          )}
        </View>
      )}
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      ></View>
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
