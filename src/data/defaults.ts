import type { Vlan, FirewallRule, NetworkSwitch, Device } from '../types';

export const DEFAULT_VLANS: Vlan[] = [
  { id: 1,  name: 'Management',  subnet: '10.0.1.0/24',      type: 'LAN',   color: '#388bfd' },
  { id: 10, name: 'Trusted LAN', subnet: '192.168.10.0/24',  type: 'LAN',   color: '#56d364' },
  { id: 20, name: 'IoT',         subnet: '192.168.20.0/24',  type: 'IoT',   color: '#e3b341' },
  { id: 30, name: 'Guest',       subnet: '192.168.30.0/24',  type: 'Guest', color: '#bc8cff' },
  { id: 40, name: 'DMZ',         subnet: '10.0.40.0/24',     type: 'DMZ',   color: '#ff7b72' },
  { id: 0,  name: 'WAN',         subnet: '203.0.113.0/24',   type: 'WAN',   color: '#8b949e' },
];

export const DEFAULT_RULES: Omit<FirewallRule, 'id'>[] = [
  { name: 'Allow Established/Related', action: 'allow', srcZone: 'Any',         dstZone: 'Any',         srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'Allow return traffic for established connections', enabled: true  },
  { name: 'Block IoT to LAN',          action: 'block', srcZone: 'IoT',         dstZone: 'Trusted LAN', srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'Prevent IoT devices from accessing trusted LAN',   enabled: true  },
  { name: 'Allow LAN to WAN',          action: 'allow', srcZone: 'Trusted LAN', dstZone: 'WAN',         srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'Allow trusted LAN to reach the internet',          enabled: true  },
  { name: 'Block Guest to LAN',        action: 'block', srcZone: 'Guest',       dstZone: 'Trusted LAN', srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'Isolate guest network from internal LAN',           enabled: true  },
  { name: 'Allow Guest to WAN',        action: 'allow', srcZone: 'Guest',       dstZone: 'WAN',         srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'Guest internet access only',                        enabled: true  },
  { name: 'Block DMZ to Internal',     action: 'block', srcZone: 'DMZ',         dstZone: 'Trusted LAN', srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'DMZ cannot initiate connections to LAN',            enabled: true  },
  { name: 'Allow ICMP Everywhere',     action: 'allow', srcZone: 'Any',         dstZone: 'Any',         srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'ICMP', ipVer: 'Both', schedule: 'Always', desc: 'Allow ping/traceroute for diagnostics',             enabled: true  },
  { name: 'Block IoT to WAN (Night)',  action: 'block', srcZone: 'IoT',         dstZone: 'WAN',         srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Daily',  desc: 'Restrict IoT internet access at night',            enabled: false },
  { name: 'Default Drop All',          action: 'block', srcZone: 'Any',         dstZone: 'Any',         srcType: 'Any', dstType: 'Any', srcPort: 'Any', dstPort: 'Any', proto: 'All',  ipVer: 'Both', schedule: 'Always', desc: 'Implicit deny at end of rule chain',                enabled: true  },
];

function makePorts(count: number): NetworkSwitch['ports'] {
  return Array.from({ length: count }, (_, i) => ({
    num: i + 1,
    mode: 'access' as const,
    vlan: 10,
    speed: '1G' as const,
    blocked: false,
    active: Math.random() > 0.3,
    traffic: Math.random() * 800,
  }));
}

export const DEFAULT_SWITCHES: NetworkSwitch[] = [
  { id: 'sw1', name: 'Core Switch (24-port)',  portCount: 24, ports: makePorts(24) },
  { id: 'sw2', name: 'Access Switch (8-port)', portCount: 8,  ports: makePorts(8)  },
];

export const DEFAULT_DEVICES: Device[] = [
  { id: 'd1',  type: 'router', label: 'Router/FW',     vlan: null, icon: '🔀', x: 0, y: 0 },
  { id: 'd2',  type: 'switch', label: 'Core Switch',   vlan: null, icon: '🔲', x: 0, y: 0 },
  { id: 'd3',  type: 'pc',     label: 'Workstation 1', vlan: 10,   icon: '🖥',  x: 0, y: 0 },
  { id: 'd4',  type: 'pc',     label: 'Workstation 2', vlan: 10,   icon: '🖥',  x: 0, y: 0 },
  { id: 'd5',  type: 'server', label: 'File Server',   vlan: 10,   icon: '🗄',  x: 0, y: 0 },
  { id: 'd6',  type: 'server', label: 'Web Server',    vlan: 40,   icon: '🌐', x: 0, y: 0 },
  { id: 'd7',  type: 'iot',    label: 'Smart TV',      vlan: 20,   icon: '📺', x: 0, y: 0 },
  { id: 'd8',  type: 'iot',    label: 'IP Camera',     vlan: 20,   icon: '📷', x: 0, y: 0 },
  { id: 'd9',  type: 'laptop', label: 'Guest Laptop',  vlan: 30,   icon: '💻', x: 0, y: 0 },
  { id: 'd10', type: 'phone',  label: 'Guest Phone',   vlan: 30,   icon: '📱', x: 0, y: 0 },
  { id: 'd11', type: 'cloud',  label: 'Internet',      vlan: 0,    icon: '☁️', x: 0, y: 0 },
];
