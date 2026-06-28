import React from 'react';

interface Option { value: string; label: string }

interface Props {
  name: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}

export default function RadioGroup({ name, options, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            background: value === opt.value ? 'rgba(56,139,253,.1)' : 'var(--surface3)',
            border: `1px solid ${value === opt.value ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            transition: 'all .15s',
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ accentColor: 'var(--accent)' }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}
