import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { Vlan, FirewallRule, NetworkSwitch, Device, SwitchPort } from '../types';
import { DEFAULT_VLANS, DEFAULT_RULES, DEFAULT_SWITCHES, DEFAULT_DEVICES } from '../data/defaults';

// ── State ────────────────────────────────────────────────────────────────────
export interface AppState {
  vlans: Vlan[];
  rules: FirewallRule[];
  switches: NetworkSwitch[];
  devices: Device[];
  activeTab: 'topology' | 'switch';
  selectedVlanId: number | null;
}

let _idCounter = Date.now();
const nextId = () => ++_idCounter;

function initState(): AppState {
  return {
    vlans: DEFAULT_VLANS,
    rules: DEFAULT_RULES.map((r) => ({ ...r, id: nextId() })),
    switches: DEFAULT_SWITCHES,
    devices: DEFAULT_DEVICES,
    activeTab: 'topology',
    selectedVlanId: null,
  };
}

// ── Actions ──────────────────────────────────────────────────────────────────
type Action =
  | { type: 'SET_TAB'; tab: AppState['activeTab'] }
  | { type: 'SELECT_VLAN'; id: number | null }
  | { type: 'ADD_VLAN'; vlan: Omit<Vlan, 'id'> & { id: number } }
  | { type: 'ADD_RULE'; rule: Omit<FirewallRule, 'id'> }
  | { type: 'UPDATE_RULE'; rule: FirewallRule }
  | { type: 'DELETE_RULE'; id: number }
  | { type: 'TOGGLE_RULE'; id: number }
  | { type: 'MOVE_RULE'; from: number; to: number }
  | { type: 'UPDATE_PORT'; switchId: string; portNum: number; patch: Partial<SwitchPort> }
  | { type: 'TICK_PORTS' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };

    case 'SELECT_VLAN':
      return { ...state, selectedVlanId: action.id };

    case 'ADD_VLAN':
      return { ...state, vlans: [...state.vlans, action.vlan] };

    case 'ADD_RULE': {
      const newRule: FirewallRule = { ...action.rule, id: nextId() };
      // Insert before implicit "Default Drop All" if present
      const dropIdx = state.rules.findIndex((r) => r.name.toLowerCase().includes('drop all'));
      const rules =
        dropIdx > 0
          ? [...state.rules.slice(0, dropIdx), newRule, ...state.rules.slice(dropIdx)]
          : [...state.rules, newRule];
      return { ...state, rules };
    }

    case 'UPDATE_RULE':
      return {
        ...state,
        rules: state.rules.map((r) => (r.id === action.rule.id ? action.rule : r)),
      };

    case 'DELETE_RULE':
      return { ...state, rules: state.rules.filter((r) => r.id !== action.id) };

    case 'TOGGLE_RULE':
      return {
        ...state,
        rules: state.rules.map((r) =>
          r.id === action.id ? { ...r, enabled: !r.enabled } : r
        ),
      };

    case 'MOVE_RULE': {
      const rules = [...state.rules];
      const [moved] = rules.splice(action.from, 1);
      rules.splice(action.to, 0, moved);
      return { ...state, rules };
    }

    case 'UPDATE_PORT':
      return {
        ...state,
        switches: state.switches.map((sw) =>
          sw.id !== action.switchId
            ? sw
            : {
                ...sw,
                ports: sw.ports.map((p) =>
                  p.num === action.portNum ? { ...p, ...action.patch } : p
                ),
              }
        ),
      };

    case 'TICK_PORTS':
      return {
        ...state,
        switches: state.switches.map((sw) => ({
          ...sw,
          ports: sw.ports.map((p) =>
            p.blocked || !p.active
              ? p
              : { ...p, traffic: Math.max(0, Math.min(1000, p.traffic + (Math.random() - 0.48) * 50)) }
          ),
        })),
      };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getVlanColor: (vlanId: number | null) => string;
  isFlowAllowed: (srcZone: string, dstZone: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const getVlanColor = useCallback(
    (vlanId: number | null) => {
      const v = state.vlans.find((x) => x.id === vlanId);
      return v ? v.color : '#8b949e';
    },
    [state.vlans]
  );

  const isFlowAllowed = useCallback(
    (srcZone: string, dstZone: string) => {
      for (const r of state.rules) {
        if (!r.enabled) continue;
        const srcMatch = r.srcZone === 'Any' || r.srcZone === srcZone;
        const dstMatch = r.dstZone === 'Any' || r.dstZone === dstZone;
        if (srcMatch && dstMatch) return r.action;
      }
      return 'allow';
    },
    [state.rules]
  );

  return (
    <AppContext.Provider value={{ state, dispatch, getVlanColor, isFlowAllowed }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
