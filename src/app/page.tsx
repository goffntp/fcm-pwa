"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { onForegroundMessage, subscribeAndGetToken } from "@/lib/firebase";
import { isSupported } from "firebase/messaging";

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
      <Button 
        onClick={() => {
          new Notification("ทดสอบ Local", {
            body: "Notification API ทำงานหรือไม่",
            icon: "/icons/icon-192.png"
          });
        }}
        className="bg-green-600 hover:bg-green-700"
      >
        🧪 Test Local Notification
      </Button>
      <Button 
        onClick={async () => {
          const supported = await isSupported();
          const permission = Notification.permission;
          const userAgent = navigator.userAgent;
          
          setLogs((l) => [
            {
              ts: new Date().toLocaleTimeString(),
              text: `FCM Supported: ${supported}, Permission: ${permission}, UA: ${userAgent.substring(0, 50)}...`,
            },
            ...l,
          ]);
        }}
        className="bg-blue-600 hover:bg-blue-700"
      >
        🔍 Check FCM Support
      </Button>

      {token && (
        <div className="w-full max-w-2xl text-xs break-all border rounded p-3">
          <div className="font-medium mb-1">FCM Token</div>
          <div className="mb-2">{token}</div>
          <button 
            className="text-blue-500 underline text-sm"
            onClick={() => navigator.clipboard.writeText(token)}
          >
            Copy Token
          </button>
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
