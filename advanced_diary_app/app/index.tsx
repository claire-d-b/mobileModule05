import { Redirect } from "expo-router";
import CLoading from "../components/CLoading";
import { useAuthContext } from "../context/AuthContext";

export default function Index() {
  const { token, loading, authenticating } = useAuthContext();

  if (loading) return <CLoading />;

  // Le deep link de retour OAuth (Android en particulier) peut ramener l'app
  // sur "/" avant que le backend n'ait fini de répondre. Dans ce cas, `token`
  // est encore null mais un login est en cours : on affiche un loader plutôt
  // que de rediriger vers /signin, ce qui causerait un flash incorrect.
  if (authenticating) return <CLoading />;

  return <Redirect href={token ? "/home" : "/signin"} />;
}
