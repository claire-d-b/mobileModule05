import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import CBottomNav from "./CBottomNav";
import * as React from "react";
import Profile from "./Profile";
import Agenda from "./Agenda";
import Entries from "./Entries";

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Entry {
  id: number;
  date: string;
  title: string;
  feeling: number;
  content: string;
  created_at: string;
}

const _ = () => {
  const { localLogin, token } = useAuthContext();
  const [email, setEmail] = useState<string | null>(localLogin ?? null);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const fetchEntries = async (
    pageNumber = 0,
    resolvedEmail?: string | null,
  ) => {
    const emailToUse = resolvedEmail ?? email;
    if (!emailToUse || !token) return;

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(emailToUse)}?page=${pageNumber}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) return;

      const list: Entry[] = data.entries ?? [];
      setEntries(list);
      setHasNext(data.hasNext);
      setHasPrev(data.hasPrev);
    } catch (e) {
      console.error("Error fetching entries:", e);
    }
  };

  // L'email affiché suit désormais uniquement le login local (issu du JWT/backend custom), plus de source Firebase
  useEffect(() => {
    setEmail(localLogin ?? null);
  }, [localLogin]);

  useEffect(() => {
    if (email && token) fetchEntries(page, email);
  }, [email, token]);

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    {
      key: "home",
      title: "Home",
      focusedIcon: "home",
      unfocusedIcon: "home-outline",
    },
    {
      key: "profile",
      title: "Profile",
      focusedIcon: "account",
      unfocusedIcon: "account-outline",
    },
    {
      key: "agenda",
      title: "Agenda",
      focusedIcon: "calendar",
      unfocusedIcon: "calendar-outline",
    },
  ]);

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case "home":
        return (
          <Entries
            login={email}
            entries={entries}
            page={page}
            setPage={setPage}
            hasNext={hasNext}
            hasPrev={hasPrev}
            fetchEntries={fetchEntries}
          />
        );
      case "profile":
        return (
          <Profile
            login={email}
            entries={entries}
            fetchEntries={fetchEntries}
          />
        );
      case "agenda":
        return (
          <Agenda login={email} entries={entries} fetchEntries={fetchEntries} />
        );
      default:
        return null;
    }
  };

  return (
    <CBottomNav
      style={{ backgroundColor: "white" }}
      index={index}
      setIndex={setIndex}
      routes={routes}
      renderScene={renderScene}
    />
  );
};

export default _;
