import { useEffect, useRef } from 'react';
import type { Device } from '../types';

export function layoutDevices(devices: Device[], w: number, h: number): Device[] {
  const cx = w / 2;
  const cy = h / 2;

  const updated = devices.map((d) => ({ ...d }));

  const byId = Object.fromEntries(updated.map((d) => [d.id, d]));

  byId['d1'].x = cx;       byId['d1'].y = cy * 0.28;
  byId['d2'].x = cx;       byId['d2'].y = cy * 0.55;
  byId['d11'].x = cx;      byId['d11'].y = cy * 0.08;

  const lan   = updated.filter((d) => d.vlan === 10);
  lan.forEach((d, i) => { d.x = cx * 0.28 + i * 85; d.y = cy * 0.88; });

  const iot   = updated.filter((d) => d.vlan === 20);
  iot.forEach((d, i) => { d.x = cx * 1.5 + i * 85; d.y = cy * 0.82; });

  const guest = updated.filter((d) => d.vlan === 30);
  guest.forEach((d, i) => { d.x = cx * 1.5 + i * 85; d.y = cy * 1.35; });

  const dmz   = updated.filter((d) => d.vlan === 40);
  dmz.forEach((d, i) => { d.x = cx * 0.28 + i * 85; d.y = cy * 1.35; });

  return updated;
}

export function useResizeObserver(ref: React.RefObject<HTMLElement | null>) {
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      sizeRef.current = {
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      };
    });
    observer.observe(ref.current);
    const el = ref.current;
    return () => observer.unobserve(el);
  }, [ref]);

  return sizeRef;
}
