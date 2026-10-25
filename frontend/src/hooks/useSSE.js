// hooks/useSSE.js — Real-time Server-Sent Events hook
import { useEffect, useRef, useCallback } from 'react';

const API_BASE = 'http://localhost:3001';

export function useSSE(onMessage) {
  const esRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
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
      // Reconnect after 3s
      setTimeout(() => {
        if (esRef.current === es) {
          esRef.current = null;
        }
      }, 3000);
    };

    return () => {
      es.close();
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
