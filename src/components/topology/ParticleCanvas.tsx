import React, { useRef, useEffect, useCallback } from 'react';
import type { Device, Vlan, Particle, TooltipData } from '../../types';

interface Props {
  devices: Device[];
  vlans: Vlan[];
  isFlowAllowed: (src: string, dst: string) => string;
  onTooltip: (t: TooltipData | null) => void;
}

const MAX_PARTICLES = 120;
const PROTOS = ['TCP', 'UDP', 'ICMP'];

export default function ParticleCanvas({ devices, vlans, isFlowAllowed, onTooltip }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const getVlan = useCallback((id: number | null) => vlans.find((v) => v.id === id), [vlans]);

  const computeFlows = useCallback(() => {
    const flows: { src: Device; dst: Device; color: string }[] = [];
    const sw    = devices.find((d) => d.id === 'd2');
    const router = devices.find((d) => d.id === 'd1');
    const cloud = devices.find((d) => d.id === 'd11');
    if (!sw || !router || !cloud) return flows;

    vlans.forEach((srcVlan) => {
      vlans.forEach((dstVlan) => {
        if (srcVlan.id === dstVlan.id) return;
        if (isFlowAllowed(srcVlan.name, dstVlan.name) === 'block') return;
        const srcDevs = devices.filter((d) => d.vlan === srcVlan.id);
        const dstDevs = devices.filter((d) => d.vlan === dstVlan.id);
        srcDevs.forEach((src) => dstDevs.forEach((dst) => flows.push({ src, dst, color: srcVlan.color })));
      });
    });

    vlans.filter((v) => v.type !== 'WAN').forEach((v) => {
      if (isFlowAllowed(v.name, 'WAN') === 'block') return;
      devices.filter((d) => d.vlan === v.id).forEach((src) => flows.push({ src, dst: cloud, color: v.color }));
    });

    return flows;
  }, [devices, vlans, isFlowAllowed]);

  const spawnParticle = useCallback(() => {
    if (particlesRef.current.length >= MAX_PARTICLES) return;
    const flows = computeFlows();
    if (!flows.length) return;
    const sw    = devices.find((d) => d.id === 'd2');
    const router = devices.find((d) => d.id === 'd1');
    if (!sw || !router) return;

    const flow = flows[Math.floor(Math.random() * flows.length)];
    const path = [flow.src, sw, router, flow.dst];
    const srcVlan = getVlan(flow.src.vlan);
    const dstVlan = getVlan(flow.dst.vlan);

    particlesRef.current.push({
      path,
      pathIdx: 0,
      x: path[0].x,
      y: path[0].y,
      color: flow.color,
      size: Math.random() * 2.5 + 1.5,
      speed: Math.random() * 1.2 + 0.6,
      alpha: 1,
      srcVlan: srcVlan?.name ?? 'Unknown',
      dstVlan: dstVlan?.name ?? 'Unknown',
      srcDevice: flow.src.label,
      dstDevice: flow.dst.label,
      proto: PROTOS[Math.floor(Math.random() * PROTOS.length)],
      bytes: Math.floor(Math.random() * 9000) + 64,
    });
  }, [computeFlows, devices, getVlan]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (Math.random() < 0.15) spawnParticle();

    particlesRef.current = particlesRef.current.filter((p) => {
      if (p.pathIdx >= p.path.length - 1) {
        p.alpha -= 0.05;
        if (p.alpha <= 0) return false;
      } else {
        const target = p.path[p.pathIdx + 1];
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.speed) {
          p.pathIdx++;
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
        }
      }

      // Glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
      const hex = Math.round(p.alpha * 255).toString(16).padStart(2, '0');
      grad.addColorStop(0, p.color + hex);
      grad.addColorStop(1, p.color + '00');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, [spawnParticle]);

  // Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas.parentElement!);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = particlesRef.current.find((p) => {
        const dx = p.x - mx, dy = p.y - my;
        return Math.sqrt(dx * dx + dy * dy) < 9;
      });
      if (hit) {
        let html = `<div style="font-weight:700;margin-bottom:4px;font-size:13px;color:${hit.color}">● Network Packet</div>`;
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
