import React from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { BudgetPreset } from '../types/budget';

export type MainMenuTab =
  | 'executive_dashboard'
  | 'budget_simulator'
  | 'wage_calculator'
  | 'promoter_deal_analyzer';

interface HeaderProps {
  activeTab: MainMenuTab;
  setActiveTab: (tab: MainMenuTab) => void;
  presets: BudgetPreset[];
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onResetToDefault: () => void;
  onOpenExport: () => void;
}

const MENU_ITEMS: { id: MainMenuTab; label: string }[] = [
  { id: 'executive_dashboard', label: 'Executive Dashboard' },
  { id: 'budget_simulator', label: 'Budget Simulator' },
  { id: 'wage_calculator', label: 'Wage Calculator (IFA)' },
  { id: 'promoter_deal_analyzer', label: 'Promoter Deal Analyzer' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  presets,
  activePresetId,
  onSelectPreset,
  onResetToDefault,
  onOpenExport,
}) => {
  return (
    <header className="border-b border-slate-700/80 bg-slate-900/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('executive_dashboard');
            }}
            className="font-extrabold tracking-tighter text-lg text-white font-mono uppercase whitespace-nowrap shrink-0"
          >
            TROUGH<span className="text-[#FFCC00]">·X</span> SYDNEY
          </a>

          {/* Zone 2: Exact 4 Menu Items */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                  activeTab === item.id
                    ? 'border-[#FFCC00] text-white font-semibold'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1 primary action with compact preset controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <select
              aria-label="Select Commercial Operating Model Preset"
              value={activePresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="hidden lg:block bg-slate-800 border border-slate-600/80 text-white text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FFCC00] cursor-pointer max-w-[240px] truncate"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={onResetToDefault}
              title="Reset to preset baseline"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label="Reset model"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenExport}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-[#ffe066] rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export P&L</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <div className="md:hidden flex overflow-x-auto gap-2 px-4 py-2 border-t border-slate-800 bg-slate-900 text-xs">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`whitespace-nowrap px-2.5 py-1 rounded cursor-pointer ${
              activeTab === item.id
                ? 'bg-[#FFCC00] text-slate-950 font-bold'
                : 'text-slate-300'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
