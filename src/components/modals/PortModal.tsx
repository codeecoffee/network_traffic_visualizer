import React, { useEffect, useState } from 'react';
import RadioGroup from '../common/RadioGroup';
import { useApp } from '../../store/AppContext';
import type { SwitchPort, PortMode } from '../../types';
import s from './Modal.module.css';

interface Props {
  switchId: string;
  port: SwitchPort;
  onClose: () => void;
}

export default function PortModal({ switchId, port, onClose }: Props) {
  const { state, dispatch } = useApp();
  const sw = state.switches.find((x) => x.id === switchId);
  const [mode, setMode] = useState<PortMode | 'blocked'>('access');
  const [vlanId, setVlanId] = useState(port.vlan);
  const [speed, setSpeed] = useState<'100M' | '1G' | '10G'>('1G');

  useEffect(() => {
    setMode(port.blocked ? 'blocked' : port.mode);
    setVlanId(port.vlan);
    setSpeed(port.speed);
  }, [port]);

  const save = () => {
    dispatch({
      type: 'UPDATE_PORT',
      switchId,
      portNum: port.num,
      patch: {
        blocked: mode === 'blocked',
        mode: mode === 'blocked' ? 'access' : (mode as PortMode),
        vlan: vlanId,
        speed,
      },
    });
    onClose();
  };

  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ width: 360 }}>
        <div className={s.header}>
          <span>{sw?.name ?? 'Switch'} · Port {port.num}</span>
          <button className={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={s.body}>
          <div className={s.group}>
            <label className={s.label}>Mode</label>
            <RadioGroup name="port-mode" value={mode} onChange={(v) => setMode(v as PortMode | 'blocked')}
              options={[
                { value: 'access', label: 'Access' },
                { value: 'trunk', label: 'Trunk' },
                { value: 'blocked', label: 'Blocked' },
              ]} />
          </div>
          <div className={s.group}>
            <label className={s.label}>VLAN Assignment</label>
            <select className={s.select} value={vlanId} onChange={(e) => setVlanId(Number(e.target.value))}>
              {state.vlans.map((v) => (
                <option key={v.id} value={v.id}>{v.name} (VLAN {v.id})</option>
              ))}
            </select>
          </div>
          <div className={s.group}>
            <label className={s.label}>Speed</label>
            <RadioGroup name="port-speed" value={speed} onChange={(v) => setSpeed(v as '100M' | '1G' | '10G')}
              options={[{ value: '100M', label: '100M' }, { value: '1G', label: '1G' }, { value: '10G', label: '10G' }]} />
          </div>

          {/* Live traffic indicator */}
          <div className={s.group}>
            <label className={s.label}>Current Traffic</label>
            <div style={{ background: 'var(--surface3)', borderRadius: 6, height: 10, overflow: 'hidden', marginTop: 4 }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, (port.traffic / 1000) * 100)}%`,
                background: state.vlans.find((v) => v.id === port.vlan)?.color ?? '#388bfd',
                transition: 'width 1s',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
              {Math.round(port.traffic)} Mbps
            </div>
          </div>
        </div>
        <div className={s.footer}>
          <button className={`${s.btn} ${s.secondary}`} onClick={onClose}>Cancel</button>
          <button className={`${s.btn} ${s.primary}`} onClick={save}>Apply</button>
        </div>
      </div>
    </div>
  );
}
