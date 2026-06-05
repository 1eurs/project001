// EventSource hook for the backend's named order.* events. The browser auto-
// reconnects on error; we just (de)register listeners and clean up.
import { useEffect, useRef } from 'react';

export const ORDER_EVENTS = [
  'connected', 'order.created', 'order.accepted', 'order.declined',
  'order.preparing', 'order.ready', 'order.completed', 'order.cancelled',
] as const;
export type OrderEventName = (typeof ORDER_EVENTS)[number];

export function useOrderStream(url: string | null, onEvent: (name: OrderEventName, data: any) => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    if (!url) return;
    const es = new EventSource(url);
    const handlers = ORDER_EVENTS.map((name) => {
      const fn = (e: MessageEvent) => {
        let data: any = null;
        try { data = e.data ? JSON.parse(e.data) : null; } catch { data = e.data; }
        cb.current(name, data);
      };
      es.addEventListener(name, fn as EventListener);
      return [name, fn] as const;
    });
    return () => {
      handlers.forEach(([name, fn]) => es.removeEventListener(name, fn as EventListener));
      es.close();
    };
  }, [url]);
}
