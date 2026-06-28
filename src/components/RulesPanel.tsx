import React, { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import type { FirewallRule } from '../types';
import s from './RulesPanel.module.css';

interface Props {
  onAdd: () => void;
  onEdit: (rule: FirewallRule) => void;
}

export default function RulesPanel({ onAdd, onEdit }: Props) {
  const { state, dispatch } = useApp();
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const enabledCount = state.rules.filter((r) => r.enabled).length;

  return (
    <aside className={s.panel}>
      <div className={s.header}>
        <span>Firewall Rules</span>
        <span className={s.badge}>{enabledCount}</span>
      </div>
      <div className={s.body}>
        {state.rules.length === 0 ? (
          <p className={s.empty}>No rules yet — click ＋ Add Rule above.</p>
        ) : (
          state.rules.map((r, i) => (
            <div
              key={r.id}
              className={`${s.rule} ${dragOver === i ? s.dragOver : ''}`}
              draggable
              onDragStart={() => { dragIdx.current = i; }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => {
                setDragOver(null);
                if (dragIdx.current !== null && dragIdx.current !== i) {
                  dispatch({ type: 'MOVE_RULE', from: dragIdx.current, to: i });
                }
                dragIdx.current = null;
              }}
              onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            >
              <div className={s.ruleTop}>
                <span className={s.handle}>⠿</span>
                <span className={`${s.action} ${s[r.action]}`}>{r.action}</span>
                <span className={s.ruleName}>{r.name}</span>
                <button
                  className={`${s.toggle} ${r.enabled ? s.on : s.off}`}
                  onClick={() => dispatch({ type: 'TOGGLE_RULE', id: r.id })}
                  title={r.enabled ? 'Enabled' : 'Disabled'}
                />
              </div>
              <div className={s.detail}>
                {r.srcZone} → {r.dstZone} · {r.proto} · {r.schedule}
                {r.desc && <><br /><span className={s.desc}>{r.desc}</span></>}
              </div>
              <div className={s.ruleBtns}>
                <button className={s.ruleBtn} onClick={() => onEdit(r)}>✏ Edit</button>
                <button className={`${s.ruleBtn} ${s.danger}`} onClick={() => dispatch({ type: 'DELETE_RULE', id: r.id })}>🗑</button>
                {i > 0 && (
                  <button className={s.ruleBtn} onClick={() => dispatch({ type: 'MOVE_RULE', from: i, to: i - 1 })}>↑</button>
                )}
                {i < state.rules.length - 1 && (
                  <button className={s.ruleBtn} onClick={() => dispatch({ type: 'MOVE_RULE', from: i, to: i + 1 })}>↓</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
