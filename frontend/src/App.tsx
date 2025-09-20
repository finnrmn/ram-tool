import { useEffect, useMemo, useState } from "react";
import Home from "./pages/Home";
import { health, type ApiResponse } from "./api/client";

type ApiStatus = "unknown" | "ok" | "off";

type HealthPayload = {
  status: string;
};

const App = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("unknown");

  useEffect(() => {
    let cancelled = false;

    const fetchHealth = async () => {
      const result: ApiResponse<HealthPayload> = await health();
      if (cancelled) {
        return;
      }
      if (result.error || result.data?.status?.toLowerCase() !== "ok") {
        setApiStatus("off");
      } else {
        setApiStatus("ok");
      }
    };

    fetchHealth();
    const intervalId = window.setInterval(fetchHealth, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const apiOffline = useMemo(() => apiStatus === "off", [apiStatus]);

  return <Home apiStatus={apiStatus} apiOffline={apiOffline} onRetryHealth={async () => {
    const result = await health();
    if (result.error || result.data?.status?.toLowerCase() !== "ok") {
      setApiStatus("off");
    } else {
      setApiStatus("ok");
    }
  }} />;
};

export type { ApiStatus };
export default App;
