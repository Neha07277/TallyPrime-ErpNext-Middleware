import { useState, useEffect, useRef } from "react";
import { tallyAPI } from "../api/tallyAPI";

export function useLogs(active = true, intervalMs = 2500) {
  const [logs, setLogs] = useState([]);
  const timerRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const res = await tallyAPI.logs(150);
      setLogs(res.logs || []);
    } catch (_) {}
  };

  useEffect(() => {
    if (!active) return;
    fetchLogs();
    timerRef.current = setInterval(fetchLogs, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [active, intervalMs]);

  return logs;
}
