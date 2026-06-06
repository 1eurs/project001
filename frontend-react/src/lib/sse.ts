// EventSource hook for the backend's named order.* events. The browser auto-
// reconnects on error; we just (de)register listeners and clean up.
import { useEffect, useRef } from 'react';

export const ORDER_EVENTS = [
  'connected', 'order.created', 'order.accepted', 'order.declined',
  'order.preparing', 'order.ready', 'order.completed', 'order.cancelled',
] as const;
export type OrderEventName = (typeof ORDER_EVENTS)[number];

export type StreamStatus = 'connecting' | 'open' | 'reconnecting';

export function useOrderStream(
  url: string | null,
  onEvent: (name: OrderEventName, data: any) => void,
  onStatus?: (status: StreamStatus) => void,
) {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  const statusCb = useRef(onStatus);
  statusCb.current = onStatus;

  useEffect(() => {
    if (!url) return;
    statusCb.current?.('connecting');
    const es = new EventSource(url);
    es.onopen = () => statusCb.current?.('open');
    // EventSource auto-reconnects on error; surface that so the UI can show it.
    es.onerror = () => statusCb.current?.('reconnecting');
    const handlers = ORDER_EVENTS.map((name) => {
      const fn = (e: MessageEvent) => {
        if (name === 'connected') statusCb.current?.('open');
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
