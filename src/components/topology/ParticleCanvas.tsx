import React, { useRef, useEffect, useCallback } from 'react';
import type { Device, Vlan, TooltipData } from '../../types';

interface Props {
  devices: Device[];
  vlans: Vlan[];
  isFlowAllowed: (src: string, dst: string) => string;
  onTooltip: (t: TooltipData | null) => void;
}

interface FlowPulse {
  // The two endpoints of this edge
  ax: number; ay: number;
  bx: number; by: number;
  // 0..1 progress along the edge
  t: number;
  speed: number;
  color: string;
  glowColor: string;
  width: number;
  // metadata for tooltip
  srcVlan: string;
  dstVlan: string;
  srcDevice: string;
  dstDevice: string;
  proto: string;
  bytes: number;
  // screen position this frame (for hit-test)
  px: number; py: number;
}

interface GlowEdge {
  ax: number; ay: number;
  bx: number; by: number;
  color: string;
  alpha: number;
}

const PROTOS = ['TCP', 'UDP', 'ICMP'];
const MAX_PULSES = 180;

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default function ParticleCanvas({ devices, vlans, isFlowAllowed, onTooltip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulsesRef = useRef<FlowPulse[]>([]);
  const edgesRef  = useRef<GlowEdge[]>([]);
  const rafRef    = useRef<number>(0);

  const getVlan = useCallback(
    (id: number | null) => vlans.find((v) => v.id === id),
    [vlans]
  );

  // Rebuild edge list whenever devices/vlans/rules change
  const rebuildEdges = useCallback(() => {
    const sw    = devices.find((d) => d.id === 'd2');
    const router = devices.find((d) => d.id === 'd1');
    const cloud = devices.find((d) => d.id === 'd11');
    if (!sw || !router || !cloud) { edgesRef.current = []; return; }

    const edges: GlowEdge[] = [];

    // Infrastructure backbone
    edges.push({ ax: router.x, ay: router.y, bx: cloud.x, by: cloud.y, color: '#8b949e', alpha: 0.18 });
    edges.push({ ax: router.x, ay: router.y, bx: sw.x,    by: sw.y,    color: '#388bfd', alpha: 0.22 });

    // VLAN device edges (switch → device)
    devices.forEach((d) => {
      if (d.vlan === null) return;
      const vlan = getVlan(d.vlan);
      edges.push({
        ax: sw.x, ay: sw.y,
        bx: d.x,  by: d.y,
        color: vlan?.color ?? '#8b949e',
        alpha: 0.14,
      });
    });

    edgesRef.current = edges;
  }, [devices, getVlan]);

  // Spawn a new pulse on an allowed flow
  const spawnPulse = useCallback(() => {
    if (pulsesRef.current.length >= MAX_PULSES) return;
    const sw    = devices.find((d) => d.id === 'd2');
    const router = devices.find((d) => d.id === 'd1');
    const cloud = devices.find((d) => d.id === 'd11');
    if (!sw || !router || !cloud) return;

    // Build allowed flows
    type Flow = { src: Device; dst: Device; color: string; viaRouter: boolean };
    const flows: Flow[] = [];

    vlans.forEach((srcV) => {
      vlans.forEach((dstV) => {
        if (srcV.id === dstV.id) return;
        if (isFlowAllowed(srcV.name, dstV.name) === 'block') return;
        devices.filter((d) => d.vlan === srcV.id).forEach((src) => {
          devices.filter((d) => d.vlan === dstV.id).forEach((dst) => {
            flows.push({ src, dst, color: srcV.color, viaRouter: true });
          });
        });
      });
    });

    vlans.filter((v) => v.type !== 'WAN').forEach((v) => {
      if (isFlowAllowed(v.name, 'WAN') === 'block') return;
      devices.filter((d) => d.vlan === v.id).forEach((src) => {
        flows.push({ src, dst: cloud, color: v.color, viaRouter: true });
      });
    });

    if (!flows.length) return;
    const flow = flows[Math.floor(Math.random() * flows.length)];

    // Choose a random segment of the path: src→sw, sw→router, or router→dst
    const segments: [Device, Device][] = [
      [flow.src, sw],
      [sw, router],
      [router, flow.dst],
    ];
    const [a, b] = segments[Math.floor(Math.random() * segments.length)];

    const srcVlan = getVlan(flow.src.vlan);
    const dstVlan = getVlan(flow.dst.vlan);

    pulsesRef.current.push({
      ax: a.x, ay: a.y,
      bx: b.x, by: b.y,
      t: 0,
      speed: 0.004 + Math.random() * 0.006,
      color: flow.color,
      glowColor: flow.color,
      width: 1.5 + Math.random() * 1.5,
      srcVlan: srcVlan?.name ?? 'Unknown',
      dstVlan: dstVlan?.name ?? 'Unknown',
      srcDevice: flow.src.label,
      dstDevice: flow.dst.label,
      proto: PROTOS[Math.floor(Math.random() * PROTOS.length)],
      bytes: Math.floor(Math.random() * 9000) + 64,
      px: a.x, py: a.y,
    });
  }, [devices, vlans, isFlowAllowed, getVlan]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ── Draw base glow edges ─────────────────────────────────────────────────
    edgesRef.current.forEach((e) => {
      const rgb = hexToRgb(e.color);
      // Outer soft glow
      ctx.beginPath();
      ctx.moveTo(e.ax, e.ay);
      ctx.lineTo(e.bx, e.by);
      ctx.strokeStyle = `rgba(${rgb},${e.alpha * 0.5})`;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Inner core line
      ctx.beginPath();
      ctx.moveTo(e.ax, e.ay);
      ctx.lineTo(e.bx, e.by);
      ctx.strokeStyle = `rgba(${rgb},${e.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // ── Spawn + tick pulses ──────────────────────────────────────────────────
    if (Math.random() < 0.25) spawnPulse();

    pulsesRef.current = pulsesRef.current.filter((p) => {
      p.t += p.speed;
      if (p.t > 1) return false;

      const x = p.ax + (p.bx - p.ax) * p.t;
      const y = p.ay + (p.by - p.ay) * p.t;
      p.px = x; p.py = y;

      const rgb = hexToRgb(p.glowColor);

      // Outer halo (large, very soft)
      const halo = ctx.createRadialGradient(x, y, 0, x, y, 14);
      halo.addColorStop(0, `rgba(${rgb},0.28)`);
      halo.addColorStop(1, `rgba(${rgb},0)`);
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // Mid glow
      const mid = ctx.createRadialGradient(x, y, 0, x, y, 5);
      mid.addColorStop(0, `rgba(${rgb},0.7)`);
      mid.addColorStop(1, `rgba(${rgb},0)`);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = mid;
      ctx.fill();

      // Bright core dot
      ctx.beginPath();
      ctx.arc(x, y, p.width, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},1)`;
      ctx.fill();

      // Tail trail — draw a short glowing segment behind the pulse
      const TAIL = 0.06;
      const t0 = Math.max(0, p.t - TAIL);
      const x0 = p.ax + (p.bx - p.ax) * t0;
      const y0 = p.ay + (p.by - p.ay) * t0;

      const tailGrad = ctx.createLinearGradient(x0, y0, x, y);
      tailGrad.addColorStop(0, `rgba(${rgb},0)`);
      tailGrad.addColorStop(1, `rgba(${rgb},0.9)`);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = p.width + 1;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Secondary wider soft tail
      const tailGrad2 = ctx.createLinearGradient(x0, y0, x, y);
      tailGrad2.addColorStop(0, `rgba(${rgb},0)`);
      tailGrad2.addColorStop(1, `rgba(${rgb},0.3)`);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x, y);
      ctx.strokeStyle = tailGrad2;
      ctx.lineWidth = (p.width + 1) * 4;
      ctx.stroke();

      return true;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [spawnPulse]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas.parentElement!);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => observer.disconnect();
  }, []);

  // Rebuild edges when devices change
  useEffect(() => { rebuildEdges(); }, [rebuildEdges]);

  // Animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Hover tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = pulsesRef.current.find((p) => {
        const dx = p.px - mx, dy = p.py - my;
        return Math.sqrt(dx * dx + dy * dy) < 12;
      });
      if (hit) {
        let html = `<div style="font-weight:700;margin-bottom:4px;font-size:13px;color:${hit.color}">⟶ Flow Packet</div>`;
        html += row('From', hit.srcDevice);
        html += row('To', hit.dstDevice);
        html += row('Src VLAN', hit.srcVlan);
        html += row('Dst VLAN', hit.dstVlan);
        html += row('Protocol', hit.proto);
        html += row('Size', `${hit.bytes} B`);
        onTooltip({ x: e.clientX, y: e.clientY, html });
      } else {
        onTooltip(null);
      }
    },
    [onTooltip]
  );

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onTooltip(null)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

function row(key: string, val: string) {
  return `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#8b949e">${key}</span><span style="font-weight:600">${val}</span></div>`;
}
