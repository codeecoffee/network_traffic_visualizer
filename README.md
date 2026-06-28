# ⚡ NetViz — Network Traffic Visualizer

A browser-based firewall rule builder and network topology visualizer inspired by UniFi's policy interface. Build firewall rules, watch live traffic particles flow between VLANs, configure switch ports, and export your ruleset — all without leaving the browser.

---

## Features

| # | Feature |
|---|---------|
| 1 | **UniFi-style firewall rule builder** — Create policies with action (Block / Allow / Reject), source & destination zones, port selection, protocol, IP version, and schedule |
| 2 | **VLAN / WAN topology view** — Visual network map showing VLANs as color-coded zones with devices grouped inside them |
| 3 | **Switch port management** — 24-port and 8-port switches; configure each port's mode (Access / Trunk / Blocked), VLAN assignment, and speed |
| 4 | **Live traffic particles** — Animated glowing dots flow between devices in real time; blocked flows (per active rules) stop immediately |
| 5 | **Device inventory** — PCs, Servers, IoT devices, Laptops, Phones, Router, and Cloud node illustrate inter-network communication |
| 6 | **Per-VLAN particle colors** — Each VLAN has a distinct color; particles inherit the source VLAN's color |
| 7 | **JSON export** — Download all firewall rules, VLAN definitions, and switch port configs as `firewall-rules.json` |
| 8 | **9 pre-loaded default rules** — Mirrors typical UniFi default policies (block IoT→LAN, allow LAN→WAN, guest isolation, ICMP, etc.) |
| 9 | **Port traffic visualization** — Animated traffic-level bars on each switch port, updated every 1.8 s |
| 10 | **Hover tooltips** — Hover any device node or flying particle for rich contextual info (VLAN, subnet, protocol, packet size, device name) |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| State | `useReducer` + React Context |
| Rendering | HTML5 Canvas (topology + particles) |
| Styling | CSS Modules + CSS custom properties |
| External runtime deps | None beyond React |

---

## Project Structure

```
src/
├── types.ts                    # Shared TypeScript interfaces
├── data/
│   └── defaults.ts             # Seed data: VLANs, rules, switches, devices
├── store/
│   └── AppContext.tsx           # Global state (useReducer) + context
├── utils/
│   └── export.ts               # JSON export helper
├── hooks/
│   └── useTopologyLayout.ts    # Node positioning algorithm
├── components/
│   ├── TopNav.tsx              # Tab bar + action buttons
│   ├── VlanPanel.tsx           # Left sidebar: VLAN list + device chips
│   ├── RulesPanel.tsx          # Right sidebar: rule cards + drag-reorder
│   ├── SwitchView.tsx          # Switch Ports tab
│   ├── topology/
│   │   ├── TopologyCanvas.tsx  # Static node/zone canvas layer
│   │   └── ParticleCanvas.tsx  # Animated particle layer (rAF loop)
│   ├── modals/
│   │   ├── RuleModal.tsx       # Create / edit firewall policy
│   │   ├── VlanModal.tsx       # Add new VLAN / network
│   │   └── PortModal.tsx       # Configure individual switch port
│   └── common/
│       ├── Tooltip.tsx         # Hover tooltip overlay
│       └── RadioGroup.tsx      # Reusable radio button group
└── App.tsx                     # Root layout + modal orchestration
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Production Build

```bash
npm run build       # outputs to dist/
npm run preview     # serve the production build locally
```

---

## Usage Guide

### Topology View

- **VLAN zones** — Color-coded bubbles group devices by VLAN. Hover any node to see its VLAN, subnet, and active rule count.
- **Particles** — Glowing dots travel between devices along network paths. Each VLAN has its own color. Hover a particle for protocol, size, source/destination.
- **Rules affect traffic live** — Toggle a rule off and the corresponding flows disappear immediately.

### Firewall Rules (right panel)

- Click **＋ Add Rule** in the top bar to open the policy builder.
- **Drag** rule cards to reorder, or use the ↑ / ↓ buttons.
- Toggle the pill switch on each card to enable/disable a rule without deleting it.
- Click ✏ Edit or 🗑 Delete inline on any rule.

### Switch Ports Tab

- Each port shows a **live traffic bar** indicating utilization.
- Click any port to configure its **mode** (Access / Trunk / Blocked), **VLAN**, and **link speed**.
- Blocked ports turn red; trunk ports turn amber.

### Adding a VLAN

Click **＋ VLAN** in the top bar. Set a name, VLAN ID, subnet, type, and pick a color. The new VLAN appears in the topology and is immediately available in rule zone selectors.

### Exporting

Click **⬇ Export** to download `firewall-rules.json`:

```json
{
  "exported": "2026-06-28T...",
  "vlans": [ { "id": 10, "name": "Trusted LAN", "subnet": "192.168.10.0/24", "type": "LAN" } ],
  "rules": [
    { "order": 1, "name": "Allow LAN to WAN", "action": "allow", "srcZone": "Trusted LAN", "dstZone": "WAN", ... }
  ],
  "switchPorts": [
    { "switch": "Core Switch (24-port)", "ports": [ { "port": 1, "mode": "access", "vlan": 10, "speed": "1G" } ] }
  ]
}
```

---

## Default Firewall Rules

Rules are evaluated top-to-bottom; the first matching enabled rule wins.

| # | Name | Action | Src → Dst |
|---|------|--------|-----------|
| 1 | Allow Established/Related | Allow | Any → Any |
| 2 | Block IoT to LAN | Block | IoT → Trusted LAN |
| 3 | Allow LAN to WAN | Allow | Trusted LAN → WAN |
| 4 | Block Guest to LAN | Block | Guest → Trusted LAN |
| 5 | Allow Guest to WAN | Allow | Guest → WAN |
| 6 | Block DMZ to Internal | Block | DMZ → Trusted LAN |
| 7 | Allow ICMP Everywhere | Allow | Any → Any (ICMP) |
| 8 | Block IoT to WAN (Night) | Block | IoT → WAN (Daily, off by default) |
| 9 | Default Drop All | Block | Any → Any |

---

## License

MIT
