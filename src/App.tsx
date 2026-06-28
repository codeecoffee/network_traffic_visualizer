import React, { useState, useCallback } from 'react';
import { useApp } from './store/AppContext';
import TopNav from './components/TopNav';
import VlanPanel from './components/VlanPanel';
import RulesPanel from './components/RulesPanel';
import SwitchView from './components/SwitchView';
import TopologyCanvas from './components/topology/TopologyCanvas';
import ParticleCanvas from './components/topology/ParticleCanvas';
import Tooltip from './components/common/Tooltip';
import RuleModal from './components/modals/RuleModal';
import VlanModal from './components/modals/VlanModal';
import PortModal from './components/modals/PortModal';
import type { FirewallRule, Device, SwitchPort, TooltipData } from './types';

export default function App() {
  const { state, isFlowAllowed } = useApp();

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule]     = useState<FirewallRule | null>(null);
  const [vlanModalOpen, setVlanModalOpen] = useState(false);
  const [portModal, setPortModal]         = useState<{ switchId: string; port: SwitchPort } | null>(null);
  const [tooltip, setTooltip]             = useState<TooltipData | null>(null);
  const [laidOutDevices, setLaidOutDevices] = useState<Device[]>(state.devices);

  const handleLayoutChange = useCallback((devices: Device[]) => setLaidOutDevices(devices), []);
  const openAddRule  = () => { setEditingRule(null); setRuleModalOpen(true); };
  const openEditRule = (r: FirewallRule) => { setEditingRule(r); setRuleModalOpen(true); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav onAddRule={openAddRule} onAddVlan={() => setVlanModalOpen(true)} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {state.activeTab === 'topology' && (
          <>
            <VlanPanel onAddVlan={() => setVlanModalOpen(true)} />

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <TopologyCanvas
                devices={state.devices}
                vlans={state.vlans}
                rules={state.rules}
                onLayoutChange={handleLayoutChange}
                onTooltip={setTooltip}
              />
              <ParticleCanvas
                devices={laidOutDevices}
                vlans={state.vlans}
                isFlowAllowed={isFlowAllowed}
                onTooltip={setTooltip}
              />
            </div>

            <RulesPanel onAdd={openAddRule} onEdit={openEditRule} />
          </>
        )}

        {state.activeTab === 'switch' && (
          <SwitchView onPortClick={(swId, port) => setPortModal({ switchId: swId, port })} />
        )}
      </div>

      {ruleModalOpen && <RuleModal editingRule={editingRule} onClose={() => setRuleModalOpen(false)} />}
      {vlanModalOpen && <VlanModal onClose={() => setVlanModalOpen(false)} />}
      {portModal && (
        <PortModal switchId={portModal.switchId} port={portModal.port} onClose={() => setPortModal(null)} />
      )}

      <Tooltip tooltip={tooltip} />
    </div>
  );
}
