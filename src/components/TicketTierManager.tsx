import React from 'react';
import { TicketTier, VenueConfig } from '../types/budget';
import { formatAUD } from '../utils/calculations';
import { Plus, Trash2, AlertCircle, Sliders } from 'lucide-react';

interface Props {
  ticketTiers: TicketTier[];
  venueConfig: VenueConfig;
  onChange: (tiers: TicketTier[]) => void;
}

export const TicketTierManager: React.FC<Props> = ({
  ticketTiers,
  venueConfig,
  onChange,
}) => {
  const isHosted = venueConfig.operatingModel === 'promoter_hosted';
  const totalAllocated = ticketTiers.reduce((acc, t) => acc + (t.allocation || 0), 0);
  const totalSold = ticketTiers.reduce((acc, t) => acc + (t.soldCount || 0), 0);
  const capacity = 300;
  const isOverAllocated = totalAllocated > capacity || totalSold > capacity;
  const clip = venueConfig.promoterTicketClip || 5.0;

  const handleUpdateTier = <K extends keyof TicketTier>(
    id: string,
    key: K,
    value: TicketTier[K]
  ) => {
    const updated = ticketTiers.map((t) => {
      if (t.id === id) {
        return { ...t, [key]: value };
      }
      return t;
    });
    onChange(updated);
  };

  const handleAddTier = () => {
    const remainingCap = Math.max(0, 300 - totalAllocated);
    const newTier: TicketTier = {
      id: `tier-${Date.now()}`,
      name: `Release ${ticketTiers.length + 1}`,
      price: 50,
      allocation: remainingCap > 0 ? remainingCap : 50,
      soldCount: remainingCap > 0 ? Math.round(remainingCap * 0.8) : 40,
      description: isHosted
        ? `Venue clips $${clip.toFixed(2)} | Promoter retains balance`
        : '100% retained by Trough X Sydney',
    };
    onChange([...ticketTiers, newTier]);
  };

  const handleDeleteTier = (id: string) => {
    if (ticketTiers.length <= 1) return;
    onChange(ticketTiers.filter((t) => t.id !== id));
  };

  const totalGrossTickets = ticketTiers.reduce(
    (acc, t) => acc + (t.soldCount || 0) * (t.price || 0),
    0
  );
  const totalVenueTicketRev = isHosted ? totalSold * clip : totalGrossTickets;
  const totalPromoterTicketRev = isHosted
    ? Math.max(0, totalGrossTickets - totalVenueTicketRev)
    : 0;

  return (
    <div className="bg-neutral-900/80 border border-neutral-700/80 rounded-lg p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#FFCC00]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Ticket Release Sliders & {isHosted ? `Promoter Clip ($${clip.toFixed(2)}/Ticket)` : '100% Owned Retention'}
            </h2>
            <span className="text-neutral-600">·</span>
            <span className="text-xs text-neutral-300">Strict 300-Pax Licensed Cap</span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Drag sliders to adjust ticket prices ($ AUD) and sold volume per release tier.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono tabular-nums">
            <div className="text-xs text-neutral-300">
              Sold:{' '}
              <span className={totalSold > 300 ? 'text-red-400 font-bold' : 'text-[#FFCC00] font-bold'}>
                {totalSold}
              </span>{' '}
              / Alloc:{' '}
              <span className={totalAllocated > 300 ? 'text-red-400 font-bold' : 'text-white'}>
                {totalAllocated}
              </span>{' '}
              / 300 Cap
            </div>
            <div className="text-[11px] text-neutral-400">
              {totalSold >= 250
                ? '250+ Pax Reached → 3 Security Guards Required'
                : 'Under 250 Pax → 2 Security Guards Required'}
            </div>
          </div>

          <button
            onClick={handleAddTier}
            className="px-3 py-1.5 text-xs font-bold text-neutral-950 bg-[#FFCC00] hover:bg-[#ffe066] rounded transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tier</span>
          </button>
        </div>
      </div>

      {/* Visual Stacked Capacity & Revenue Split Bar */}
      <div className="bg-neutral-950/90 border border-neutral-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <span className="text-white font-bold uppercase">
            300-Pax Capacity Utilization & Box Office Split
          </span>
          <div className="flex items-center gap-4 tabular-nums">
            <span className="text-white">
              Gross Box Office: <strong>{formatAUD(totalGrossTickets)}</strong>
            </span>
            <span className="text-[#FFCC00]">
              Venue Retains: <strong>{formatAUD(totalVenueTicketRev)}</strong>
            </span>
            {isHosted && (
              <span className="text-neutral-400">
                Promoter Retains: <strong>{formatAUD(totalPromoterTicketRev)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Stacked Progress Bar of Sold Tickets out of 300 Cap */}
        <div className="w-full h-4 bg-neutral-800 rounded-md overflow-hidden flex">
          {ticketTiers.map((tier, idx) => {
            const pctOfCap = Math.min(100, ((tier.soldCount || 0) / 300) * 100);
            if (pctOfCap <= 0) return null;
            const barColors = [
              'bg-[#FFCC00]',
              'bg-white',
              'bg-neutral-400',
              'bg-[#FFCC00]/70',
              'bg-neutral-500',
            ];
            return (
              <div
                key={tier.id}
                style={{ width: `${pctOfCap}%` }}
                title={`${tier.name}: ${tier.soldCount} sold @ $${tier.price}`}
                className={`${barColors[idx % barColors.length]} h-full border-r border-neutral-950 transition-all`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[11px] font-mono text-neutral-400 tabular-nums">
          <span>0 Pax</span>
          <span>121 Pax (Dep B/E)</span>
          <span>144 Pax (Base B/E)</span>
          <span>250 Pax (3rd Guard)</span>
          <span className="text-[#FFCC00] font-bold">300 Pax Max Cap</span>
        </div>
      </div>

      {isOverAllocated && (
        <div className="flex items-center gap-2 p-2.5 bg-red-950/40 border border-red-800 rounded text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>
            273 Crown St Licensing Alert: Total allocation ({totalAllocated}) or projected attendance ({totalSold}) exceeds the strict 300-person maximum capacity.
          </span>
        </div>
      )}

      {/* Interactive Tier Cards with Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ticketTiers.map((tier) => {
          const sold = tier.soldCount || 0;
          const price = tier.price || 0;
          const gross = sold * price;
          const venueRetained = isHosted ? sold * clip : gross;
          const promoterRetained = isHosted ? Math.max(0, gross - venueRetained) : 0;

          return (
            <div
              key={tier.id}
              className="bg-neutral-950/80 border border-neutral-800 rounded-lg p-4 space-y-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2.5">
                <input
                  type="text"
                  value={tier.name}
                  onChange={(e) => handleUpdateTier(tier.id, 'name', e.target.value)}
                  className="bg-neutral-900 border border-neutral-700/80 rounded px-2.5 py-1 text-white text-xs font-bold focus:outline-none focus:border-[#FFCC00] w-full"
                />
                <button
                  onClick={() => handleDeleteTier(tier.id)}
                  disabled={ticketTiers.length <= 1}
                  className="p-1 text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer shrink-0"
                  title="Delete tier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Ticket Price Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-300">Ticket Price ($ AUD)</span>
                  <div className="flex items-center gap-1 font-mono tabular-nums">
                    <span className="text-neutral-400">$</span>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      step="1"
                      value={tier.price}
                      onChange={(e) =>
                        handleUpdateTier(
                          tier.id,
                          'price',
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-14 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right text-[#FFCC00] font-bold text-xs focus:outline-none focus:border-[#FFCC00]"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={tier.price}
                  onChange={(e) =>
                    handleUpdateTier(tier.id, 'price', parseFloat(e.target.value))
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
                />
              </div>

              {/* Allocation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-300">Tier Allocation Cap</span>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    step="5"
                    value={tier.allocation}
                    onChange={(e) => {
                      const newAlloc = Math.min(
                        300,
                        Math.max(0, parseInt(e.target.value) || 0)
                      );
                      const updated = ticketTiers.map((t) =>
                        t.id === tier.id
                          ? {
                              ...t,
                              allocation: newAlloc,
                              soldCount: Math.min(t.soldCount, newAlloc),
                            }
                          : t
                      );
                      onChange(updated);
                    }}
                    className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right text-white font-mono tabular-nums text-xs focus:outline-none focus:border-[#FFCC00]"
                  />
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="5"
                  value={tier.allocation}
                  onChange={(e) => {
                    const newAlloc = parseInt(e.target.value, 10);
                    const updated = ticketTiers.map((t) =>
                      t.id === tier.id
                        ? {
                            ...t,
                            allocation: newAlloc,
                            soldCount: Math.min(t.soldCount, newAlloc),
                          }
                        : t
                    );
                    onChange(updated);
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Sold Count Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-300">Projected Sold Pax</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max={tier.allocation}
                      step="1"
                      value={tier.soldCount}
                      onChange={(e) =>
                        handleUpdateTier(
                          tier.id,
                          'soldCount',
                          Math.min(
                            tier.allocation,
                            Math.max(0, parseInt(e.target.value) || 0)
                          )
                        )
                      }
                      className="w-14 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-right text-[#FFCC00] font-bold font-mono tabular-nums text-xs focus:outline-none focus:border-[#FFCC00]"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateTier(tier.id, 'soldCount', tier.allocation)}
                      className="text-[10px] px-1.5 py-0.5 bg-neutral-800 hover:bg-[#FFCC00] hover:text-neutral-950 text-neutral-300 rounded font-mono font-bold transition-colors cursor-pointer"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, tier.allocation)}
                  step="1"
                  value={tier.soldCount}
                  onChange={(e) =>
                    handleUpdateTier(tier.id, 'soldCount', parseInt(e.target.value, 10))
                  }
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#FFCC00]"
                />
              </div>

              {/* Revenue Split Footer */}
              <div className="pt-2.5 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums">
                <div>
                  <span className="text-neutral-400 block">Venue Retains</span>
                  <span className="text-[#FFCC00] font-bold text-xs">
                    {formatAUD(venueRetained)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 block">
                    {isHosted ? 'Promoter Retains' : 'Gross Tier Total'}
                  </span>
                  <span className="text-white font-semibold text-xs">
                    {isHosted ? formatAUD(promoterRetained) : formatAUD(gross)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
