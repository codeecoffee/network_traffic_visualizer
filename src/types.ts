export type RuleAction = 'allow' | 'block' | 'reject';
export type IpVersion = 'Both' | 'IPv4' | 'IPv6';
export type Protocol = 'All' | 'TCP/UDP' | 'TCP' | 'UDP' | 'ICMP';
export type Schedule = 'Always' | 'Daily' | 'Weekly' | 'One Time' | 'Custom';
export type PortMode = 'access' | 'trunk' | 'blocked';
export type VlanType = 'LAN' | 'WAN' | 'DMZ' | 'Guest' | 'IoT';
export type DeviceType = 'router' | 'switch' | 'pc' | 'server' | 'iot' | 'laptop' | 'phone' | 'cloud';

export interface Vlan {
  id: number;
  name: string;
  subnet: string;
  type: VlanType;
  color: string;
}

export interface FirewallRule {
  id: number;
  name: string;
  action: RuleAction;
  srcZone: string;
  srcType: string;
  srcPort: string;
  dstZone: string;
  dstType: string;
  dstPort: string;
  proto: Protocol;
  ipVer: IpVersion;
  schedule: Schedule;
  desc: string;
  enabled: boolean;
}

export interface SwitchPort {
  num: number;
  mode: PortMode;
  vlan: number;
  speed: '100M' | '1G' | '10G';
  blocked: boolean;
  active: boolean;
  traffic: number;
}

export interface NetworkSwitch {
  id: string;
  name: string;
  portCount: number;
  ports: SwitchPort[];
}

export interface Device {
  id: string;
  type: DeviceType;
  label: string;
  vlan: number | null;
  icon: string;
  x: number;
  y: number;
}

export interface TooltipData {
  x: number;
  y: number;
  html: string;
}

export interface Particle {
  path: Device[];
  pathIdx: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
  alpha: number;
  srcVlan: string;
  dstVlan: string;
  srcDevice: string;
  dstDevice: string;
  proto: string;
  bytes: number;
}
