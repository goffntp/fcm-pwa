"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { onForegroundMessage, subscribeAndGetToken } from "@/lib/firebase";

type LogItem = { ts: string; text: string };

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    (async () => {
      const unsub = await onForegroundMessage((payload) => {
        setLogs((l) => [
          {
            ts: new Date().toLocaleTimeString(),
            text: JSON.stringify(payload),
          },
          ...l,
        ]);
      });
      cleanup = typeof unsub === "function" ? unsub : undefined;
    })();
    
    return () => cleanup?.();
  }, []);

  const handleSubscribe = async () => {
    try {
      const t = await subscribeAndGetToken();
      if (!t) throw new Error("No token");
      setToken(t);

      // ส่ง token ไป server
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });

      setLogs((l) => [
        {
          ts: new Date().toLocaleTimeString(),
          text: "Subscribed with token ✅",
        },
        ...l,
      ]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setLogs((l) => [
        { ts: new Date().toLocaleTimeString(), text: `❌ ${errorMessage}` },
        ...l,
      ]);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Android Web Push (FCM)</h1>
      <Button onClick={handleSubscribe}>🔔 Subscribe Notification</Button>

      {token && (
        <div className="w-full max-w-2xl text-xs break-all border rounded p-3">
          <div className="font-medium mb-1">FCM Token</div>
          <div>{token}</div>
        </div>
      )}

      <div className="w-full max-w-2xl text-xs border rounded p-3">
        <div className="font-medium mb-1">Logs</div>
        <ul className="space-y-1">
          {logs.map((item, idx) => (
            <li key={idx}>
              <span className="opacity-60">{item.ts} — </span>
              <span className="font-mono">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
