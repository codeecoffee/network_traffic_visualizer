import React from 'react';
import { useApp } from '../store/AppContext';
import { exportRules } from '../utils/export';
import s from './TopNav.module.css';

interface Props {
  onAddRule: () => void;
  onAddVlan: () => void;
}

export default function TopNav({ onAddRule, onAddVlan }: Props) {
  const { state, dispatch } = useApp();

  return (
    <nav className={s.nav}>
      <span className={s.logo}>⚡ NetViz</span>

      <button
        className={`${s.tab} ${state.activeTab === 'topology' ? s.active : ''}`}
        onClick={() => dispatch({ type: 'SET_TAB', tab: 'topology' })}
      >
        Topology
      </button>
      <button
        className={`${s.tab} ${state.activeTab === 'switch' ? s.active : ''}`}
        onClick={() => dispatch({ type: 'SET_TAB', tab: 'switch' })}
      >
        Switch Ports
      </button>

      <span className={s.spacer} />

      <button className={s.iconBtn} onClick={onAddVlan}>＋ VLAN</button>
      <button className={s.iconBtn} onClick={() => exportRules(state)}>⬇ Export</button>
      <button className={s.iconBtn} style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={onAddRule}>
        ＋ Add Rule
      </button>
    </nav>
  );
}
