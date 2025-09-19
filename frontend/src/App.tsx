import { useEffect, useState } from "react";
import Home from "./pages/Home";
import { health } from "./api/client";

const App = () => {
  const [apiOffline, setApiOffline] = useState(false);

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

  return <Home apiOffline={apiOffline} />;
};

export default App;
