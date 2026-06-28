import type { AppState } from '../store/AppContext';

export function exportRules(state: AppState) {
  const data = {
    exported: new Date().toISOString(),
    vlans: state.vlans.map(({ id, name, subnet, type }) => ({ id, name, subnet, type })),
    rules: state.rules.map((r, i) => ({
      order: i + 1,
      name: r.name,
      enabled: r.enabled,
      action: r.action,
      srcZone: r.srcZone,
      srcType: r.srcType,
      srcPort: r.srcPort,
      dstZone: r.dstZone,
      dstType: r.dstType,
      dstPort: r.dstPort,
      protocol: r.proto,
      ipVersion: r.ipVer,
      schedule: r.schedule,
      description: r.desc,
    })),
    switchPorts: state.switches.map((sw) => ({
      switch: sw.name,
      ports: sw.ports.map(({ num, mode, vlan, speed, blocked }) => ({ port: num, mode, vlan, speed, blocked })),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'firewall-rules.json';
  a.click();
  URL.revokeObjectURL(url);
}
