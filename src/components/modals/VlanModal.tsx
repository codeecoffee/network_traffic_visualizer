import React, { useState } from 'react';
import RadioGroup from '../common/RadioGroup';
import { useApp } from '../../store/AppContext';
import type { VlanType } from '../../types';
import s from './Modal.module.css';

interface Props { onClose: () => void }

export default function VlanModal({ onClose }: Props) {
  const { state, dispatch } = useApp();
  const [name, setName] = useState('');
  const [vlanId, setVlanId] = useState('');
  const [subnet, setSubnet] = useState('');
  const [type, setType] = useState<VlanType>('LAN');
  const [color, setColor] = useState('#388bfd');

  const save = () => {
    if (!name.trim()) return;
    const id = parseInt(vlanId) || Math.max(...state.vlans.map((v) => v.id)) + 10;
    dispatch({ type: 'ADD_VLAN', vlan: { id, name: name.trim(), subnet: subnet || '192.168.0.0/24', type, color } });
    onClose();
  };

  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ width: 380 }}>
        <div className={s.header}>
          <span>Add Network / VLAN</span>
          <button className={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={s.body}>
          <div className={s.group}>
            <label className={s.label}>Name</label>
            <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. IoT" />
          </div>
          <div className={s.row2}>
            <div className={s.group}>
              <label className={s.label}>VLAN ID</label>
              <input className={s.input} type="number" value={vlanId} onChange={(e) => setVlanId(e.target.value)} placeholder="e.g. 50" />
            </div>
            <div className={s.group}>
              <label className={s.label}>Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                style={{ width: 48, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 6 }} />
            </div>
          </div>
          <div className={s.group}>
            <label className={s.label}>Subnet</label>
            <input className={s.input} value={subnet} onChange={(e) => setSubnet(e.target.value)} placeholder="e.g. 192.168.50.0/24" />
          </div>
          <div className={s.group}>
            <label className={s.label}>Type</label>
            <RadioGroup name="vlan-type" value={type} onChange={(v) => setType(v as VlanType)}
              options={['LAN','WAN','DMZ','Guest','IoT'].map((v) => ({ value: v, label: v }))} />
          </div>
        </div>
        <div className={s.footer}>
          <button className={`${s.btn} ${s.secondary}`} onClick={onClose}>Cancel</button>
          <button className={`${s.btn} ${s.primary}`} onClick={save} disabled={!name.trim()}>Add Network</button>
        </div>
      </div>
    </div>
  );
}
