import React, { useRef, useEffect, useCallback } from 'react';
import type { Device, Vlan, TooltipData } from '../../types';
import { layoutDevices } from '../../hooks/useTopologyLayout';

interface Props {
  devices: Device[];
  vlans: Vlan[];
  onLayoutChange: (devices: Device[]) => void;
  onTooltip: (t: TooltipData | null) => void;
  rules: { srcZone: string; dstZone: string; enabled: boolean }[];
}

export default function TopologyCanvas({ devices, vlans, onLayoutChange, onTooltip, rules }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laidOutRef = useRef<Device[]>(devices);
  const hoveredRef = useRef<Device | null>(null);

  const getVlanColor = useCallback(
    (vlanId: number | null) => vlans.find((v) => v.id === vlanId)?.color ?? '#8b949e',
    [vlans]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const devs = laidOutRef.current;
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);

    // VLAN zone bubbles
    const groups: Record<number, Device[]> = {};
    devs.forEach((d) => {
      if (d.vlan !== null) {
        groups[d.vlan] = groups[d.vlan] ?? [];
        groups[d.vlan].push(d);
      }
    });
    Object.entries(groups).forEach(([vlanIdStr, ds]) => {
      if (!ds.length) return;
      const color = getVlanColor(Number(vlanIdStr));
      const xs = ds.map((d) => d.x);
      const ys = ds.map((d) => d.y);
      const minX = Math.min(...xs) - 55;
      const maxX = Math.max(...xs) + 55;
      const minY = Math.min(...ys) - 45;
      const maxY = Math.max(...ys) + 45;
      ctx.beginPath();
      ctx.roundRect(minX, minY, maxX - minX, maxY - minY, 16);
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color + '12';
      ctx.fill();
      const vlan = vlans.find((v) => v.id === Number(vlanIdStr));
      if (vlan) {
        ctx.font = '10px Segoe UI, system-ui, sans-serif';
        ctx.fillStyle = color + 'bb';
        ctx.fillText(`VLAN ${vlan.id} · ${vlan.name}`, minX + 8, minY + 14);
      }
    });

    // Connections
    const router = devs.find((d) => d.id === 'd1');
    const sw = devs.find((d) => d.id === 'd2');
    const cloud = devs.find((d) => d.id === 'd11');
    if (router && cloud) drawLine(ctx, router, cloud, '#8b949e33', 1.5);
    if (router && sw)    drawLine(ctx, router, sw,    '#388bfd55', 2);
    if (sw) {
      devs.forEach((d) => {
        if (d.vlan !== null) {
          drawLine(ctx, sw, d, getVlanColor(d.vlan) + '44', 1.2);
        }
      });
    }

    // Nodes
    devs.forEach((d) => {
      const isHovered = hoveredRef.current?.id === d.id;
      const r = isHovered ? 26 : 22;
      const color =
        d.vlan !== null
          ? getVlanColor(d.vlan)
          : d.id === 'd1'
          ? '#388bfd'
          : '#30363d';

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1c2128';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isHovered ? 2.5 : 1.5;
      ctx.stroke();

      ctx.font = `${isHovered ? 18 : 15}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.icon, d.x, d.y);

      ctx.font = `${isHovered ? 11 : 10}px Segoe UI, system-ui, sans-serif`;
      ctx.fillStyle = isHovered ? '#e6edf3' : '#8b949e';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(d.label, d.x, d.y + r + 4);
      ctx.textBaseline = 'middle';
    });
  }, [getVlanColor, vlans]);

  // Resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const laid = layoutDevices(devices, canvas.width, canvas.height);
      laidOutRef.current = laid;
      onLayoutChange(laid);
      draw();
    });
    observer.observe(canvas.parentElement!);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const laid = layoutDevices(devices, canvas.width, canvas.height);
    laidOutRef.current = laid;
    onLayoutChange(laid);
    draw();
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw(); }, [draw, devices, vlans, rules]);

  // Mouse hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = laidOutRef.current.find((d) => {
        const dx = d.x - mx, dy = d.y - my;
        return Math.sqrt(dx * dx + dy * dy) < 28;
      }) ?? null;
      if (hit?.id !== hoveredRef.current?.id) {
        hoveredRef.current = hit;
        draw();
      }
      if (hit) {
        const vlan = vlans.find((v) => v.id === hit.vlan);
        const activeRuleCount = rules.filter(
          (r) => r.enabled && (r.srcZone === vlan?.name || r.dstZone === vlan?.name)
        ).length;
        let html = `<div style="font-weight:700;margin-bottom:4px;font-size:13px">${hit.icon} ${hit.label}</div>`;
        html += `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#8b949e">Type</span><span style="font-weight:600">${hit.type}</span></div>`;
        if (vlan) {
          html += `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#8b949e">VLAN</span><span style="font-weight:600;color:${vlan.color}">${vlan.id} · ${vlan.name}</span></div>`;
          html += `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#8b949e">Subnet</span><span style="font-weight:600">${vlan.subnet}</span></div>`;
        }
        html += `<div style="display:flex;justify-content:space-between;gap:12px"><span style="color:#8b949e">Active rules</span><span style="font-weight:600">${activeRuleCount}</span></div>`;
        onTooltip({ x: e.clientX, y: e.clientY, html });
      } else {
        onTooltip(null);
      }
    },
    [vlans, rules, draw, onTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    draw();
    onTooltip(null);
  }, [draw, onTooltip]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  a: Device,
  b: Device,
  color: string,
  width: number
) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
