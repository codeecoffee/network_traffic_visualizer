import React, { useEffect } from 'react';
import { useApp } from '../store/AppContext';
import type { SwitchPort } from '../types';
import s from './SwitchView.module.css';

interface Props {
  onPortClick: (switchId: string, port: SwitchPort) => void;
}

export default function SwitchView({ onPortClick }: Props) {
  const { state, dispatch } = useApp();

  // Simulate live traffic
  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'TICK_PORTS' }), 1800);
    return () => clearInterval(timer);
  }, [dispatch]);

  return (
    <div className={s.container}>
      {state.switches.map((sw) => {
        const activePorts  = sw.ports.filter((p) => p.active && !p.blocked).length;
        const blockedPorts = sw.ports.filter((p) => p.blocked).length;
        const trunkPorts   = sw.ports.filter((p) => p.mode === 'trunk').length;

        return (
          <div key={sw.id} className={s.card}>
            <div className={s.cardHeader}>
              <span className={s.cardTitle}>🔲 {sw.name}</span>
              <div className={s.stats}>
                <span className={s.statChip} style={{ color: 'var(--accent2)' }}>
                  ▲ {activePorts} active
                </span>
                {blockedPorts > 0 && (
                  <span className={s.statChip} style={{ color: 'var(--danger)' }}>
                    ✕ {blockedPorts} blocked
                  </span>
                )}
                {trunkPorts > 0 && (
                  <span className={s.statChip} style={{ color: 'var(--warn)' }}>
                    ⇌ {trunkPorts} trunk
                  </span>
                )}
              </div>
            </div>

            <div className={s.portsGrid}>
              {sw.ports.map((p) => {
                const vlan = state.vlans.find((v) => v.id === p.vlan);
                const pct  = Math.min(100, (p.traffic / 1000) * 100);
                const cls  = [
                  s.port,
                  p.blocked         ? s.blocked
                  : p.mode === 'trunk' ? s.trunk
                  : p.active          ? s.active
                  : '',
                ].join(' ');

                return (
                  <div
                    key={p.num}
                    className={cls}
                    onClick={() => onPortClick(sw.id, p)}
                    title={`Port ${p.num} · ${vlan?.name ?? 'Unassigned'} · ${p.mode} · ${p.speed}`}
                  >
                    {/* Traffic bar */}
                    <div
                      className={s.trafficBar}
                      style={{
                        height: `${pct}%`,
                        background: p.blocked ? 'transparent' : (vlan?.color ?? '#388bfd') + '88',
                      }}
                    />
                    <span className={s.portNum}>{p.num}</span>
                    {p.active && !p.blocked && (
                      <span
                        className={s.activityDot}
                        style={{ background: vlan?.color ?? '#56d364' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className={s.legend}>
              <span style={{ color: 'var(--accent)' }}>■</span> Active &nbsp;
              <span style={{ color: 'var(--danger)' }}>■</span> Blocked &nbsp;
              <span style={{ color: 'var(--warn)' }}>■</span> Trunk &nbsp;
              — Click any port to configure
            </div>

            {/* VLAN legend */}
            <div className={s.vlanLegend}>
              {state.vlans.filter((v) => sw.ports.some((p) => p.vlan === v.id)).map((v) => (
                <span key={v.id} className={s.vlanChip} style={{ borderColor: v.color + '88', color: v.color }}>
                  <span style={{ background: v.color, width: 7, height: 7, borderRadius: '50%', display: 'inline-block', marginRight: 4 }} />
                  VLAN {v.id} · {v.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
