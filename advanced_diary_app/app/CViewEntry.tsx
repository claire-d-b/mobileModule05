import { useRouter } from "expo-router";
import { useNavigation } from "expo-router";
import {
  View,
  Platform,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Modal, Portal, Text, Button, PaperProvider } from "react-native-paper";
import CTextInput from "./CTextInput";
import CIconButton from "./CIconButton";
import CRating from "./CRating";
import CChip from "./CChip";
import CModal from "./CAddEntry";
import CAvatar from "./CAvatar";
import CDelete from "./CDelete";
import { formatDate } from "../utils/utils";
import type { MD3Colors } from "react-native-paper";
import CButton from "./CButton";
import { Background } from "@react-navigation/elements";

interface Entry {
  id: number;
  date: string;
  title: string;
  feeling: number;
  content: string;
  created_at: string;
}

interface Props {
  emotions: string[];
  containerStyle: {};
  details: boolean;
  hideDetails: () => void;
  selectedEntry: Entry | null;
}

const _ = ({
  emotions,
  containerStyle,
  details,
  hideDetails,
  selectedEntry,
}: Props) => {
  return (
    <View>
      <Portal>
        <Modal
          style={{
            padding: 0,
            alignSelf: "center",
            margin: 0,
          }}
          visible={details}
          onDismiss={hideDetails}
          contentContainerStyle={containerStyle}
        >
          <CIconButton
            style={{ alignSelf: "flex-end" }}
            icon="close"
            iconColor="#534DB3"
            containerColor=""
            size={20}
            onPress={hideDetails}
          />
          {
            <View
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                paddingBottom: 10,
                paddingLeft: 20,
                paddingRight: 20,
              }}
            >
              <View
                style={{
                  display: "flex",
                  width: "100%",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      width: "100%",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <CChip
                      onPress={() => {}}
                      label=""
                      mode="outlined"
                      icon=""
                      disabled={true}
                      textStyle={{ color: "#534DB3" }}
                      style={{
                        borderColor: "#534DB3", // ← directement dans style
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ color: "#534DB3" }}>
                        {formatDate(
                          selectedEntry?.date
                            ? new Date(selectedEntry.date) // ← convertis en Date
                            : new Date(),
                        )}
                      </Text>
                    </CChip>
                    <CIconButton
                      icon={`${
                        emotions[(selectedEntry?.feeling ?? 1) - 1]
                      }-outline`}
                      iconColor="#534DB3"
                      containerColor=""
                      size={20}
                      style={{ alignSelf: "center" }}
                      onPress={() => {}}
                      disabled={true}
                      theme={{
                        colors: {
                          onSurfaceDisabled: "#534DB3", // ← couleur de l'icône quand disabled
                        },
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      color: "#353172",
                      backgroundColor: "#BBB0D1",
                      borderRadius: 8,
                      padding: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {selectedEntry?.title}
                  </Text>

                  <Text
                    style={{
                      color: "#534DB3",
                      paddingVertical: 20,
                      alignSelf: "flex-start",
                    }}
                  >
                    {selectedEntry?.content}
                  </Text>
                </View>
              </View>
            </View>
          }
        </Modal>
      </Portal>
    </View>
  );
};

export default _;
