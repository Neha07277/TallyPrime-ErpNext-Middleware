import { useState, useEffect, useCallback } from "react";
import { tallyAPI } from "../api/tallyAPI";

export function useConnection() {
  const [state, setState] = useState({ loading: true, connected: false, error: null, data: null });

  const check = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [health, ping] = await Promise.all([
        tallyAPI.health().catch(() => null),
        tallyAPI.ping().catch((e) => ({ connected: false, error: e.message })),
      ]);
      setState({
        loading: false,
        backendOk: !!health?.ok,
        tallyConnected: ping?.connected ?? false,
        tallyLatency: ping?.latencyMs ?? null,
        tallyError: ping?.error ?? null,
        tallyUrl: ping?.url ?? "http://localhost:9000",
        error: !health ? "Backend not running (port 4000)" : null,
      });
    } catch (e) {
      setState({ loading: false, backendOk: false, tallyConnected: false, error: e.message });
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return { ...state, refresh: check };
}
