import { useEffect, useState } from "react";
import Home from "./pages/Home";
import { health } from "./api/client";
import { useTheme } from "./theme/useTheme";

const App = () => {
  const [apiOffline, setApiOffline] = useState(false);
  const { ready } = useTheme();

  useEffect(() => {
    let isMounted = true;
    health()
      .then(() => {
        if (isMounted) {
          setApiOffline(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiOffline(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <Home apiOffline={apiOffline} />;
};

export default App;
