// hooks/useSSE.js — Real-time Server-Sent Events hook
// API_BASE: empty string = same-origin (works in both dev via Vite proxy and production via Express)
import { useEffect, useRef } from 'react';

const API_BASE = '';

export function useSSE(onMessage) {
  const esRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let retryTimer = null;

    function connect() {
      const es = new EventSource(`${API_BASE}/api/events`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          onMessageRef.current(data);
        } catch {}
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;
        // Reconnect after 3s
        retryTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimer);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, []);
}

export const api = {
  get: (path) => fetch(`${API_BASE}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json()),
  delete: (path) => fetch(`${API_BASE}${path}`, { method: 'DELETE' }).then(r => r.json()),
};
