import React, { useState } from 'react';
import {
  GitFork,
  UserCheck,
  Plus,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Sparkles,
  Layers,
  Cpu,
  Clock,
  Globe
} from 'lucide-react';
import { store } from '../../lib/storage';
import { Agent, AgentStatus, IntentType, Priority, Region, RoutingRule } from '../../types';
import { getCurrentISTTime, isTimeInWindow } from '../../lib/routingEngine';

export const RoutingView: React.FC = () => {
  const rules = store.getRoutingRules();
  const agents = store.getAgents();
  const teams = store.getTeams();
  const simulatedTime = store.getSimulatedTimeIST();
  const currentIST = simulatedTime || getCurrentISTTime();

  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleRegion, setNewRuleRegion] = useState<Region | ''>('');
  const [newRuleIntent, setNewRuleIntent] = useState<IntentType | ''>('');
  const [newRulePriority, setNewRulePriority] = useState<Priority | ''>('');
  const [newRuleTeamId, setNewRuleTeamId] = useState(teams[0]?.id || '');

  const handleToggleRule = (ruleId: string) => {
    store.toggleRoutingRule(ruleId);
  };

  const handleAgentStatusChange = (agentId: string, status: AgentStatus) => {
    store.updateAgentStatus(agentId, status);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: RoutingRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      priorityOrder: rules.length + 1,
      active: true,
      criteria: {
        region: newRuleRegion || undefined,
        intent: newRuleIntent || undefined,
        priority: newRulePriority || undefined,
      },
      targetTeamId: newRuleTeamId,
      description: `Custom configured rule routing to ${
        teams.find(t => t.id === newRuleTeamId)?.name
      }`,
    };

    store.addRoutingRule(newRule);
    setShowAddRule(false);
    setNewRuleName('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 space-y-6">
      {/* Title & Architecture Note */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Intelligent Routing &amp; Ownership Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic, explainable routing evaluating Region, Priority, Agency Tier, Intent,
            and live Agent Availability.
          </p>
        </div>

        <button
          onClick={() => setShowAddRule(!showAddRule)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-sm shadow-sky-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* Time-Based Operating Windows & Simulated Clock Control (Part A Problem 2) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-semibold text-white">Time-Aware Operating Coverage (IST Routing)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                Clock: {currentIST} IST {simulatedTime ? '(Simulated)' : '(Live System)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Evaluates regional coverage windows. If a regional desk is outside operating hours, cases automatically route to the Global 24/7 Operations Desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Simulated Shift:</span>
            <select
              value={simulatedTime || 'live'}
              onChange={e => {
                const val = e.target.value === 'live' ? undefined : e.target.value;
                store.setSimulatedTimeIST(val);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            >
              <option value="live">Live System Time ({getCurrentISTTime()} IST)</option>
              <option value="11:00">11:00 IST — India Core Day Shift</option>
              <option value="15:30">15:30 IST — EMEA &amp; India Overlap</option>
              <option value="20:00">20:00 IST — APAC Evening Shift</option>
              <option value="03:30">03:30 IST — Overnight (Global 24/7 Desk)</option>
            </select>
          </div>
        </div>

        {/* Coverage Windows Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {teams.map(team => {
            const window = team.coverageWindow;
            const inCoverage = window ? isTimeInWindow(currentIST, window.startTimeIST, window.endTimeIST) : true;
            return (
              <div
                key={team.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  inCoverage
                    ? 'bg-slate-950 border-emerald-800/60 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{team.name}</span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      inCoverage
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {inCoverage ? 'ACTIVE SHIFT' : 'OFF SHIFT'}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] font-mono">
                  <div className="text-slate-400">
                    Window: <span className="text-slate-200">{window ? `${window.startTimeIST} – ${window.endTimeIST} IST` : '24/7 Continuous'}</span>
                  </div>
                  <div className="text-slate-500 text-[10px] truncate">
                    {window?.shiftName || 'All-Hours Support'} · {team.region}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated Availability Notice per Requirement #49 */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Agent availability &amp; capacity: <strong>Simulated for demo</strong>. You can toggle any
            agent&apos;s status below to observe how the routing engine reallocates incoming tickets.
          </span>
        </div>
      </div>

      {/* Add Rule Form */}
      {showAddRule && (
        <form onSubmit={handleCreateRule} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-xs font-semibold text-white">Create New Configurable Routing Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Rule Name</label>
              <input
                required
                type="text"
                placeholder="e.g. VIP Flight Disruption Fast-Track"
                value={newRuleName}
                onChange={e => setNewRuleName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Region Condition</label>
              <select
                value={newRuleRegion}
                onChange={e => setNewRuleRegion(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">Any Region</option>
                <option value="APAC">APAC</option>
                <option value="India">India</option>
                <option value="Europe">Europe</option>
                <option value="Middle East">Middle East</option>
                <option value="Americas">Americas</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Intent Condition</label>
              <select
                value={newRuleIntent}
                onChange={e => setNewRuleIntent(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="">Any Intent</option>
                <option value="Refund">Refund</option>
                <option value="Cancellation">Cancellation</option>
                <option value="Hotel Issue">Hotel Issue</option>
                <option value="Flight Issue">Flight Issue</option>
                <option value="Emergency Travel Issue">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target Team</label>
              <select
                value={newRuleTeamId}
                onChange={e => setNewRuleTeamId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddRule(false)}
              className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded hover:bg-sky-500"
            >
              Save Rule
            </button>
          </div>
        </form>
      )}

      {/* Rules Evaluation Hierarchy (Section 18) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white">Active Rule Evaluation Order</h3>
            <p className="text-[11px] text-slate-400">
              Evaluated sequentially: 1. Emergency → 2. Critical VIP → 3. Region → 4. Intent → 5. Availability → 6. Default
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-6 h-6 rounded-md bg-slate-950 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0 border border-slate-800">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-200">{rule.name}</h4>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        rule.active
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rule.active ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                  {teams.find(t => t.id === rule.targetTeamId)?.name}
                </span>
                <button
                  onClick={() => handleToggleRule(rule.id)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  {rule.active ? (
                    <ToggleRight className="w-6 h-6 text-sky-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Workload & Simulated Availability Matrix (Section 17) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white">Agent Live Availability &amp; Workload Matrix</h3>
            <p className="text-[11px] text-slate-400">
              Routing engine automatically balances load to the lowest workload eligible specialist
            </p>
          </div>
          <UserCheck className="w-4 h-4 text-sky-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map(agent => {
            const team = teams.find(t => t.id === agent.teamId);
            const loadPercent = Math.round((agent.currentWorkload / agent.maxWorkload) * 100);

            return (
              <div
                key={agent.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                    <p className="text-[10px] text-slate-400">
                      {agent.role} · {agent.region}
                    </p>
                  </div>

                  <select
                    value={agent.status}
                    onChange={e => handleAgentStatusChange(agent.id, e.target.value as AgentStatus)}
                    className={`text-[11px] font-medium rounded px-2 py-0.5 border focus:outline-none ${
                      agent.status === 'Available'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : agent.status === 'Busy'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : agent.status === 'Away'
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Away">Away</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Active Load:</span>
                    <span className="text-slate-200">
                      {agent.currentWorkload} / {agent.maxWorkload} cases ({loadPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        loadPercent >= 80 ? 'bg-rose-500' : loadPercent >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex flex-wrap gap-1">
                  {agent.skills.map(sk => (
                    <span
                      key={sk}
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
