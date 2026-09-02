import { Redirect } from "expo-router";
import CLoading from "../components/CLoading";
import { useAuthContext } from "../context/AuthContext";

export default function Index() {
  const { token, loading } = useAuthContext();
  console.log("INDEX RENDER:", { hasToken: !!token, loading });

  if (loading) return <CLoading />;

  return <Redirect href={token ? "/home" : "/signin"} />;
}
