import React from 'react';
import {
  StaffRole,
  DirectOverheadItem,
  VenueConfig,
  FinancialSummary,
} from '../types/budget';
import { formatAUD, formatPercent } from '../utils/calculations';
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';

interface Props {
  staffRoster: StaffRole[];
  overheads: DirectOverheadItem[];
  venueConfig: VenueConfig;
  summary: FinancialSummary;
  onChangeRoster: (roster: StaffRole[]) => void;
  onChangeOverheads: (overheads: DirectOverheadItem[]) => void;
}

export const ExpenseManager: React.FC<Props> = ({
  staffRoster,
  overheads,
  venueConfig,
  summary,
  onChangeRoster,
  onChangeOverheads,
}) => {
  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const superRate = (venueConfig.superGuaranteeRate || 11.5) / 100;

  const handleUpdateRole = <K extends keyof StaffRole>(
    id: string,
    key: K,
    value: StaffRole[K]
  ) => {
    onChangeRoster(
      staffRoster.map((r) => (r.id === id ? { ...r, [key]: value } : r))
    );
  };

  const handleAddRole = () => {
    const newRole: StaffRole = {
      id: `role-${Date.now()}`,
      roleName: 'Additional Support Staff',
      hourlyRate: 35.0,
      superEligible: true,
      headcount: 1,
      hours: 5.0,
      dutyScope: 'Floor & bar support',
    };
    onChangeRoster([...staffRoster, newRole]);
  };

  const handleDeleteRole = (id: string) => {
    if (staffRoster.length <= 1) return;
    onChangeRoster(staffRoster.filter((r) => r.id !== id));
  };

  const handleUpdateOverhead = <K extends keyof DirectOverheadItem>(
    id: string,
    key: K,
    value: DirectOverheadItem[K]
  ) => {
    onChangeOverheads(
      overheads.map((item) => (item.id === id ? { ...item, [key]: value } : item))
    );
  };

  const handleAddOverhead = () => {
    const newOverhead: DirectOverheadItem = {
      id: `ov-${Date.now()}`,
      category: 'staging_ops',
      name: 'Additional Event Overhead',
      amount: 250,
      appliesTo: 'both',
      paidBy: isHosted ? 'promoter' : 'venue',
      notes: 'Custom direct expense',
    };
    onChangeOverheads([...overheads, newOverhead]);
  };

  const handleDeleteOverhead = (id: string) => {
    onChangeOverheads(overheads.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Staffing Roster & IFA Wage Rates (BOOT Test Compliant) */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFCC00]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Staffing Roster & IFA Wage Rates (BOOT Test Compliant)
              </h2>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-300">
                11.5% Super Guarantee on Eligible Roles
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Slide shift hours or headcount per role. Security auto-scales at 1:100 ratio (2 guards &lt;250 pax, 3 guards at 250+ pax).
            </p>
          </div>

          {/* Wage Ratio Threshold Indicator */}
          <div className="flex items-center gap-4">
            <div className="text-right font-mono tabular-nums">
              <div className="flex items-center justify-end gap-1.5 text-xs font-bold">
                {summary.isWageRatioCompliant ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span
                  className={
                    summary.isWageRatioCompliant ? 'text-[#FFCC00]' : 'text-red-400'
                  }
                >
                  Wage Ratio: {formatPercent(summary.wageRatioPercent)} (Target &lt;
                  {summary.wageTargetThresholdPercent.toFixed(0)}%)
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Base Wages: {formatAUD(summary.baseWagesTotal, true)} + Super (11.5%):{' '}
                {formatAUD(summary.superannuationTotal, true)} ={' '}
                <strong className="text-white">{formatAUD(summary.totalStaffingCost, true)}</strong>
              </div>
            </div>

            <button
              onClick={handleAddRole}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-[#ffe066] rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Role</span>
            </button>
          </div>
        </div>

        {/* Visual Wage Ratio Thermometer & Role Cost Breakdown Graph */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-white font-bold uppercase">
              IFA Roster Share by Role & Wage Ratio Threshold (&lt;{summary.wageTargetThresholdPercent.toFixed(0)}% Max)
            </span>
            <span className="text-[#FFCC00] font-bold tabular-nums">
              Total Roster: {formatAUD(summary.totalStaffingCost, true)} ({formatPercent(summary.wageRatioPercent)} of Venue Gross Rev)
            </span>
          </div>

          <div className="w-full h-4 bg-slate-800 rounded-md overflow-hidden flex">
            {staffRoster.map((role, idx) => {
              const hc = role.autoScaleSecurity
                ? summary.securityGuardsRequired
                : role.headcount;
              const base = hc * (role.hours || 0) * (role.hourlyRate || 0);
              const sup = role.superEligible ? base * superRate : 0;
              const tot = base + sup;
              const pct =
                summary.totalStaffingCost > 0
                  ? (tot / summary.totalStaffingCost) * 100
                  : 0;
              if (pct <= 0) return null;

              const barPalette = [
                'bg-[#FFCC00]',
                'bg-white',
                'bg-slate-400',
                'bg-[#FFCC00]/75',
                'bg-slate-300',
                'bg-slate-500',
                'bg-[#FFCC00]/50',
                'bg-slate-600',
              ];

              return (
                <div
                  key={role.id}
                  style={{ width: `${pct}%` }}
                  title={`${role.roleName}: ${formatAUD(tot, true)} (${pct.toFixed(1)}% of payroll)`}
                  className={`${barPalette[idx % barPalette.length]} h-full border-r border-slate-950 transition-all`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-300">
            {staffRoster.map((role) => {
              const hc = role.autoScaleSecurity
                ? summary.securityGuardsRequired
                : role.headcount;
              const base = hc * (role.hours || 0) * (role.hourlyRate || 0);
              const tot = base + (role.superEligible ? base * superRate : 0);
              return (
                <span key={role.id}>
                  {role.roleName.split('/')[0].trim()}:{' '}
                  <strong className="text-white">{formatAUD(tot)}</strong>
                </span>
              );
            })}
          </div>
        </div>

        {/* Roster Table with Shift Hour Sliders */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-300 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Role / Position</th>
                <th className="py-2.5 px-3">IFA Rate ($/hr)</th>
                <th className="py-2.5 px-3">Super (11.5%)</th>
                <th className="py-2.5 px-3">Staff Count</th>
                <th className="py-2.5 px-3 min-w-[180px]">Shift Hours Slider</th>
                <th className="py-2.5 px-3 text-right">Base Wage</th>
                <th className="py-2.5 px-3 text-right">+11.5% Super</th>
                <th className="py-2.5 px-3 text-right">Total Cost</th>
                <th className="py-2.5 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staffRoster.map((role) => {
                const effectiveStaff = role.autoScaleSecurity
                  ? summary.securityGuardsRequired
                  : role.headcount;
                const baseWage = effectiveStaff * (role.hours || 0) * (role.hourlyRate || 0);
                const superAmt = role.superEligible ? baseWage * superRate : 0;
                const totalRoleCost = baseWage + superAmt;

                return (
                  <tr key={role.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Role Name & Scope */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={role.roleName}
                        onChange={(e) =>
                          handleUpdateRole(role.id, 'roleName', e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-[#FFCC00]"
                      />
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[260px]">
                        {role.dutyScope}
                      </div>
                    </td>

                    {/* IFA Hourly Rate */}
                    <td className="py-2.5 px-3">
                      <div className="relative">
                        <span className="absolute left-2 top-1 text-slate-400 font-mono">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={role.hourlyRate}
                          onChange={(e) =>
                            handleUpdateRole(
                              role.id,
                              'hourlyRate',
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="w-20 bg-slate-950 border border-slate-700/80 rounded pl-5 pr-2 py-1 text-white text-xs font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
                        />
                      </div>
                    </td>

                    {/* Super Eligible Toggle */}
                    <td className="py-2.5 px-3">
                      <select
                        value={role.superEligible ? 'eligible' : 'exempt'}
                        onChange={(e) =>
                          handleUpdateRole(
                            role.id,
                            'superEligible',
                            e.target.value === 'eligible'
                          )
                        }
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#FFCC00]"
                      >
                        <option value="eligible">+11.5% Super</option>
                        <option value="exempt">Exempt (Agency)</option>
                      </select>
                    </td>

                    {/* Staff Count */}
                    <td className="py-2.5 px-3">
                      {role.autoScaleSecurity ? (
                        <div className="flex items-center gap-1 font-mono tabular-nums text-[#FFCC00] font-bold">
                          <span>{effectiveStaff} Guards</span>
                          <span className="text-[10px] text-slate-400">
                            (1:100)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="1"
                            value={role.headcount}
                            onChange={(e) =>
                              handleUpdateRole(
                                role.id,
                                'headcount',
                                parseInt(e.target.value, 10)
                              )
                            }
                            className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-white"
                          />
                          <span className="font-mono tabular-nums text-white font-bold w-4">
                            {role.headcount}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Shift Hours Slider */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="range"
                          min="0"
                          max="12"
                          step="0.5"
                          value={role.hours}
                          onChange={(e) =>
                            handleUpdateRole(
                              role.id,
                              'hours',
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-24 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
                        />
                        <span className="font-mono tabular-nums text-[#FFCC00] font-bold w-12">
                          {role.hours.toFixed(1)}h
                        </span>
                      </div>
                    </td>

                    {/* Base Wage */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                      {formatAUD(baseWage, true)}
                    </td>

                    {/* Super */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-400">
                      {role.superEligible ? formatAUD(superAmt, true) : '—'}
                    </td>

                    {/* Total Cost */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#FFCC00]">
                      {formatAUD(totalRoleCost, true)}
                    </td>

                    {/* Delete */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={staffRoster.length <= 1}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Direct Event Overheads with Sliders */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Direct Event Overheads & Production Costs
              </h2>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-300">
                {isHosted
                  ? 'Venue Absorbs Waste Reinstatement; Promoter Pays DJs, Sound & Marketing'
                  : 'Trough Owned Party: Venue Covers DJs (~$900), AV (~$350), Marketing (~$400), Staging (~$250) & Waste'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right font-mono tabular-nums text-xs">
              <span className="text-slate-300">Venue Direct Overheads: </span>
              <strong className="text-[#FFCC00]">{formatAUD(summary.venueDirectOverheads, true)}</strong>
            </div>

            <button
              onClick={handleAddOverhead}
              className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-[#ffe066] rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Overhead</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-300 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Overhead Item</th>
                <th className="py-2.5 px-3">Model Applicability</th>
                <th className="py-2.5 px-3">Responsible Party</th>
                <th className="py-2.5 px-3 min-w-[200px]">Cost Slider ($ AUD)</th>
                <th className="py-2.5 px-3 text-right">Amount ($ AUD)</th>
                <th className="py-2.5 px-2 text-center w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {overheads.map((item) => {
                const isActive =
                  item.appliesTo === 'both' ||
                  item.appliesTo === venueConfig.operatingModel;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isActive ? 'hover:bg-slate-800/40' : 'opacity-40'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          handleUpdateOverhead(item.id, 'name', e.target.value)
                        }
                        className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-white text-xs font-medium focus:outline-none focus:border-[#FFCC00]"
                      />
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={item.appliesTo}
                        onChange={(e) =>
                          handleUpdateOverhead(
                            item.id,
                            'appliesTo',
                            e.target.value as DirectOverheadItem['appliesTo']
                          )
                        }
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#FFCC00]"
                      >
                        <option value="both">Both Models</option>
                        <option value="trough_owned">Trough Owned Only</option>
                        <option value="promoter_hosted">Promoter Hosted Only</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <select
                        value={item.paidBy}
                        onChange={(e) =>
                          handleUpdateOverhead(
                            item.id,
                            'paidBy',
                            e.target.value as 'venue' | 'promoter'
                          )
                        }
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#FFCC00]"
                      >
                        <option value="venue">Venue Absorbs</option>
                        <option value="promoter">External Promoter Pays</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-3">
                      <input
                        type="range"
                        min="0"
                        max="3000"
                        step="10"
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateOverhead(
                            item.id,
                            'amount',
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="relative inline-block">
                        <span className="absolute left-2 top-1 text-slate-400 font-mono">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateOverhead(
                              item.id,
                              'amount',
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="w-24 bg-slate-950 border border-slate-700/80 rounded pl-5 pr-2 py-1 text-right text-[#FFCC00] font-bold text-xs font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => handleDeleteOverhead(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
