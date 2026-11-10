import React from 'react';
import { VenueConfig } from '../types/budget';
import { Clock, Percent, DollarSign, ShieldAlert } from 'lucide-react';

interface Props {
  venueConfig: VenueConfig;
  onChange: (config: VenueConfig) => void;
}

export const EventMetadataEditor: React.FC<Props> = ({ venueConfig, onChange }) => {
  const updateField = <K extends keyof VenueConfig>(key: K, value: VenueConfig[K]) => {
    onChange({
      ...venueConfig,
      [key]: value,
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-700/80 rounded-lg p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            273 Crown Street, Surry Hills NSW 2010 — Operational & Commercial Parameters
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict licensing constraints (300 Total Cap / 60 Basement Cap), Superannuation Guarantee (11.5%), and processing rates.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#FFCC00]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>One-In, One-Out Enforced at 300 Total / 60 Basement</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Event Name & Edition */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">
            Event Title & Night Edition
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={venueConfig.eventName}
              onChange={(e) => updateField('eventName', e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFCC00]"
            />
            <input
              type="text"
              value={venueConfig.edition}
              onChange={(e) => updateField('edition', e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFCC00]"
            />
          </div>
        </div>

        {/* Date & Operating Hours */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Event Date & Trading Hours</span>
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={venueConfig.eventDate}
              onChange={(e) => updateField('eventDate', e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-700/80 rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFCC00]"
            />
            <div className="w-1/2 flex items-center gap-1">
              <input
                type="time"
                value={venueConfig.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFCC00]"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="time"
                value={venueConfig.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded px-1.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#FFCC00]"
              />
            </div>
          </div>
        </div>

        {/* Hosted Ticket Clip & Mandatory Deposit */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Hosted Ticket Clip & Booking Deposit</span>
          </label>
          <div className="flex gap-2">
            <div className="relative w-1/2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={venueConfig.promoterTicketClip}
                onChange={(e) =>
                  updateField('promoterTicketClip', parseFloat(e.target.value) || 0)
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded pl-5 pr-8 py-1.5 text-xs text-[#FFCC00] font-bold font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
              />
              <span className="absolute left-2 top-1.5 text-[10px] text-slate-400">$</span>
              <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">/tix</span>
            </div>
            <div className="relative w-1/2">
              <input
                type="number"
                min="0"
                step="50"
                value={venueConfig.promoterBookingDeposit}
                onChange={(e) =>
                  updateField('promoterBookingDeposit', parseFloat(e.target.value) || 0)
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded pl-5 pr-8 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
              />
              <span className="absolute left-2 top-1.5 text-[10px] text-slate-400">$</span>
              <span className="absolute right-2 top-1.5 text-[10px] text-slate-400">dep</span>
            </div>
          </div>
        </div>

        {/* Superannuation & Merchant Processing */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-slate-400" />
            <span>Super (11.5%) & Merchant Rates (1.5% / 2.5%)</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={venueConfig.superGuaranteeRate}
                onChange={(e) =>
                  updateField('superGuaranteeRate', parseFloat(e.target.value) || 11.5)
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
                title="Superannuation Guarantee %"
              />
              <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">Sup%</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={venueConfig.merchantFeeHostedPercent}
                onChange={(e) =>
                  updateField('merchantFeeHostedPercent', parseFloat(e.target.value) || 1.5)
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
                title="Hosted Merchant Fee %"
              />
              <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">H%</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={venueConfig.merchantFeeOwnedPercent}
                onChange={(e) =>
                  updateField('merchantFeeOwnedPercent', parseFloat(e.target.value) || 2.5)
                }
                className="w-full bg-slate-950 border border-slate-700/80 rounded px-2 py-1.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:border-[#FFCC00]"
                title="Owned Merchant Fee %"
              />
              <span className="absolute right-1.5 top-1.5 text-[10px] text-slate-400">O%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
