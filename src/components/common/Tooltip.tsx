import React from 'react';
import type { TooltipData } from '../../types';

interface Props {
  tooltip: TooltipData | null;
}

export default function Tooltip({ tooltip }: Props) {
  if (!tooltip) return null;

  const tw = 244;
  const th = 130; // estimate
  let tx = tooltip.x + 14;
  let ty = tooltip.y - 10;
  if (tx + tw > window.innerWidth - 10) tx = tooltip.x - tw - 14;
  if (ty + th > window.innerHeight - 10) ty = tooltip.y - th;

  return (
    <div
      style={{
        position: 'fixed',
        left: tx,
        top: ty,
        background: '#1c2128',
        border: '1px solid #30363d',
        borderRadius: 8,
        padding: '10px 13px',
        fontSize: 12,
        pointerEvents: 'none',
        zIndex: 9999,
        maxWidth: tw,
        boxShadow: '0 8px 24px rgba(0,0,0,.4)',
        lineHeight: 1.65,
      }}
      dangerouslySetInnerHTML={{ __html: tooltip.html }}
    />
  );
}
