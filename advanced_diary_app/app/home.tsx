import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useAuthContext } from "../context/AuthContext";
import CBottomNav from "./CBottomNav";
import * as React from "react";
import Profile from "./Profile";
import Agenda from "./Agenda";
import Entries from "./Entries";

const backendUrl = "https://wooing-lurch-sift.ngrok-free.dev";

interface Entry {
  id: number;
  date: string;
  title: string;
  feeling: number;
  content: string;
  created_at: string;
}

const _ = () => {
  const { localLogin } = useAuthContext();
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
    if (!emailToUse) return;

    try {
      const res = await fetch(
        `${backendUrl}/entries/${encodeURIComponent(emailToUse)}?page=${pageNumber}`,
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const resolvedEmail = user?.email ?? localLogin ?? null;
      setEmail(resolvedEmail);
    });
    return () => unsubscribe();
  }, [localLogin]);

  useEffect(() => {
    if (email) fetchEntries(page, email);
  }, [email]);

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
