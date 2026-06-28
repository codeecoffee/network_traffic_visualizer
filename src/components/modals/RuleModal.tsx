import React, { useEffect, useState } from 'react';
import RadioGroup from '../common/RadioGroup';
import { useApp } from '../../store/AppContext';
import type { FirewallRule, RuleAction, Protocol, IpVersion, Schedule } from '../../types';
import s from './Modal.module.css';

interface Props {
  editingRule: FirewallRule | null;
  onClose: () => void;
}

const blank = (): Omit<FirewallRule, 'id'> => ({
  name: '',
  action: 'block',
  srcZone: 'Any',
  srcType: 'Any',
  srcPort: 'Any',
  dstZone: 'Any',
  dstType: 'Any',
  dstPort: 'Any',
  proto: 'All',
  ipVer: 'Both',
  schedule: 'Always',
  desc: '',
  enabled: true,
});

export default function RuleModal({ editingRule, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState<Omit<FirewallRule, 'id'>>(blank());

  useEffect(() => {
    setForm(editingRule ? { ...editingRule } : blank());
  }, [editingRule]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const zoneOptions = [
    { value: 'Any', label: 'Any' },
    ...state.vlans.map((v) => ({ value: v.name, label: `${v.name} (VLAN ${v.id})` })),
  ];

  const save = () => {
    if (!form.name.trim()) return;
    if (editingRule) {
      dispatch({ type: 'UPDATE_RULE', rule: { ...form, id: editingRule.id } });
    } else {
      dispatch({ type: 'ADD_RULE', rule: form });
    }
    onClose();
  };

  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.header}>
          <span>{editingRule ? 'Edit Policy' : 'Create Policy'}</span>
          <button className={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={s.body}>
          <div className={s.group}>
            <label className={s.label}>Name</label>
            <input className={s.input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Rule name" />
          </div>

          <div className={s.group}>
            <label className={s.label}>Action</label>
            <RadioGroup name="action" value={form.action} onChange={(v) => set('action', v as RuleAction)}
              options={[{ value: 'block', label: 'Block' }, { value: 'allow', label: 'Allow' }, { value: 'reject', label: 'Reject' }]} />
          </div>

          <div className={s.row2}>
            <div className={s.group}>
              <label className={s.label}>Source Zone</label>
              <select className={s.select} value={form.srcZone} onChange={(e) => set('srcZone', e.target.value)}>
                {zoneOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className={s.group}>
              <label className={s.label}>Destination Zone</label>
              <select className={s.select} value={form.dstZone} onChange={(e) => set('dstZone', e.target.value)}>
                {zoneOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className={s.group}>
            <label className={s.label}>Source Type</label>
            <RadioGroup name="src-type" value={form.srcType} onChange={(v) => set('srcType', v)}
              options={['Any','Device','Network','IP','MAC'].map((v) => ({ value: v, label: v }))} />
          </div>

          <div className={s.group}>
            <label className={s.label}>Destination Type</label>
            <RadioGroup name="dst-type" value={form.dstType} onChange={(v) => set('dstType', v)}
              options={['Any','App','IP','Domain','Region'].map((v) => ({ value: v, label: v }))} />
          </div>

          <div className={s.row2}>
            <div className={s.group}>
              <label className={s.label}>Source Port</label>
              <RadioGroup name="src-port" value={form.srcPort} onChange={(v) => set('srcPort', v)}
                options={['Any','Specific','List'].map((v) => ({ value: v, label: v }))} />
            </div>
            <div className={s.group}>
              <label className={s.label}>Destination Port</label>
              <RadioGroup name="dst-port" value={form.dstPort} onChange={(v) => set('dstPort', v)}
                options={['Any','Specific','List'].map((v) => ({ value: v, label: v }))} />
            </div>
          </div>

          <div className={s.group}>
            <label className={s.label}>Protocol</label>
            <RadioGroup name="proto" value={form.proto} onChange={(v) => set('proto', v as Protocol)}
              options={['All','TCP/UDP','TCP','UDP','ICMP'].map((v) => ({ value: v, label: v }))} />
          </div>

          <div className={s.group}>
            <label className={s.label}>IP Version</label>
            <RadioGroup name="ipver" value={form.ipVer} onChange={(v) => set('ipVer', v as IpVersion)}
              options={['Both','IPv4','IPv6'].map((v) => ({ value: v, label: v }))} />
          </div>

          <div className={s.group}>
            <label className={s.label}>Schedule</label>
            <RadioGroup name="schedule" value={form.schedule} onChange={(v) => set('schedule', v as Schedule)}
              options={['Always','Daily','Weekly','One Time','Custom'].map((v) => ({ value: v, label: v }))} />
          </div>

          <div className={s.group}>
            <label className={s.label}>Description</label>
            <input className={s.input} value={form.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Optional description" />
          </div>
        </div>
        <div className={s.footer}>
          <button className={`${s.btn} ${s.secondary}`} onClick={onClose}>Cancel</button>
          <button className={`${s.btn} ${s.primary}`} onClick={save} disabled={!form.name.trim()}>Save Policy</button>
        </div>
      </div>
    </div>
  );
}
