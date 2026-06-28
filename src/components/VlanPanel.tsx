import React from 'react';
import { useApp } from '../store/AppContext';
import s from './VlanPanel.module.css';

interface Props {
  onAddVlan: () => void;
}

export default function VlanPanel({ onAddVlan }: Props) {
  const { state, dispatch } = useApp();

  return (
    <aside className={s.panel}>
      <div className={s.header}>
        <span>Networks</span>
        <button className={s.addBtn} onClick={onAddVlan}>＋</button>
      </div>
      <div className={s.body}>
        <div className={s.sectionLabel}>VLANs</div>
        {state.vlans.map((v) => (
          <div
            key={v.id}
            className={`${s.vlanItem} ${state.selectedVlanId === v.id ? s.selected : ''}`}
            onClick={() => dispatch({ type: 'SELECT_VLAN', id: v.id === state.selectedVlanId ? null : v.id })}
          >
            <span className={s.dot} style={{ background: v.color }} />
            <span className={s.name}>{v.name}</span>
            <span className={s.badge}>VLAN {v.id}</span>
          </div>
        ))}

        <div className={s.sectionLabel} style={{ marginTop: 14 }}>Devices</div>
        <div className={s.chips}>
          {state.devices.map((d) => {
            const vlan = state.vlans.find((v) => v.id === d.vlan);
            return (
              <span
                key={d.id}
                className={s.chip}
                style={{ borderColor: vlan ? vlan.color + '66' : undefined }}
                title={vlan ? `VLAN ${vlan.id} · ${vlan.name} · ${vlan.subnet}` : d.type}
              >
                {d.icon} {d.label}
              </span>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
