import React, { useState, useMemo, useRef } from 'react';
import {
  InventoryItem,
  StockPurchaseEntry,
  isBarBeverageCategory,
  parseCloverInventoryCsv,
  calculateItemMetrics,
} from '../data/cloverInventorySeed';

interface AlcoholInventoryCogsProps {
  items: InventoryItem[];
  onUpdateItems: (next: InventoryItem[], notice?: string) => void;
  onResetDefaults: () => void;
  purchases: StockPurchaseEntry[];
  onUpdatePurchases: (next: StockPurchaseEntry[]) => void;
  openingStockValue: number;
  onUpdateOpeningStockValue: (val: number) => void;
  periodBarSales: number;
  onUpdatePeriodBarSales: (val: number) => void;
  simCogsRate: number;
  onApplyCogsToSimulator: (cogsPct: number, sourceLabel: string) => void;
}

type CategoryFilter =
  | 'bar'
  | 'beer'
  | 'premix'
  | 'spirits'
  | 'cocktails'
  | 'nonalcohol'
  | 'nonbar'
  | 'all';

function fmtMoney(val: number): string {
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const AlcoholInventoryCogs: React.FC<AlcoholInventoryCogsProps> = ({
  items,
  onUpdateItems,
  onResetDefaults,
  purchases,
  onUpdatePurchases,
  openingStockValue,
  onUpdateOpeningStockValue,
  periodBarSales,
  onUpdatePeriodBarSales,
  simCogsRate,
  onApplyCogsToSimulator,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('bar');
  const [onlyNegativeOrRecipe, setOnlyNegativeOrRecipe] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add Purchase Form State
  const [newPurchaseDate, setNewPurchaseDate] = useState<string>(
    new Date().toLocaleDateString('en-AU')
  );
  const [newPurchaseSupplier, setNewPurchaseSupplier] = useState<string>(
    'Paramount Liquor'
  );
  const [newPurchaseInvoice, setNewPurchaseInvoice] = useState<string>('');
  const [newPurchaseAmount, setNewPurchaseAmount] = useState<string>('');
  const [newPurchaseNotes, setNewPurchaseNotes] = useState<string>('');

  // Enrich items with computed COGS & variance metrics
  const enrichedItems = useMemo(() => {
    return items.map((item) => ({
      item,
      metrics: calculateItemMetrics(item),
    }));
  }, [items]);

  // Global & Category Bar Metrics
  const summary = useMemo(() => {
    const barItems = enrichedItems.filter(({ item }) =>
      isBarBeverageCategory(item.category)
    );
    const physicalBarItems = barItems.filter(
      ({ metrics }) => !metrics.isPosRecipeOnly
    );

    let currentOnHandValue = 0;
    let expectedStockValue = 0;
    let totalCountedSkus = 0;
    let totalVarianceCost = 0;
    let negativeSkuCount = 0;
    let weightedCostSum = 0;
    let weightedRetailSum = 0;
    let verifiedCostCount = 0;

    physicalBarItems.forEach(({ item, metrics }) => {
      currentOnHandValue += metrics.stockValue;
      expectedStockValue += Math.max(0, item.expectedStock) * item.unitCost;

      if (item.actualCount !== null) {
        totalCountedSkus++;
        if (metrics.varianceCost !== null) {
          totalVarianceCost += metrics.varianceCost;
        }
      }

      if (item.expectedStock < 0 || item.liveCloverStock < 0) {
        negativeSkuCount++;
      }

      if (item.costVerified) {
        verifiedCostCount++;
      }

      // Weight theoretical bar COGS by active retail pour value on sellable SKUs
      if (item.price > 0 && item.unitCost > 0) {
        const volumeWeight = Math.max(1, Math.abs(item.liveCloverStock) || 1);
        weightedCostSum += metrics.costPerPour * volumeWeight;
        weightedRetailSum += item.price * volumeWeight;
      }
    });

    // Also compute simple equal-weighted average COGS across priced bar SKUs
    const pricedPhysical = physicalBarItems.filter(
      ({ item }) => item.price > 0 && item.unitCost > 0
    );
    const simpleAvgCogsPct =
      pricedPhysical.length > 0
        ? pricedPhysical.reduce((acc, { metrics }) => acc + metrics.cogsPct, 0) /
          pricedPhysical.length
        : 22.0;

    const theoreticalWeightedCogsPct =
      weightedRetailSum > 0
        ? (weightedCostSum / weightedRetailSum) * 100
        : simpleAvgCogsPct;

    // Running Period COGS calculation:
    // Consumed Cost of Goods = Opening Stock + Purchases - Closing Stock On Hand
    const totalPurchases = purchases.reduce((acc, p) => acc + (p.amount || 0), 0);
    const consumedCogsDollar = Math.max(
      0,
      openingStockValue + totalPurchases - currentOnHandValue
    );
    const periodRunningCogsPct =
      periodBarSales > 0 ? (consumedCogsDollar / periodBarSales) * 100 : 0;

    // Category Breakdowns
    const catDefs = [
      {
        id: 'beer' as CategoryFilter,
        label: 'Beer (Kegs & Cans)',
        match: (c: string) => c.toLowerCase().includes('beer'),
      },
      {
        id: 'premix' as CategoryFilter,
        label: 'Pre-mix RTD Cans',
        match: (c: string) => c.toLowerCase().includes('pre-mix'),
      },
      {
        id: 'spirits' as CategoryFilter,
        label: 'Spirits (Bottles)',
        match: (c: string) => c.toLowerCase().includes('spirit'),
      },
      {
        id: 'nonalcohol' as CategoryFilter,
        label: 'Non-alcohol & Mixers',
        match: (c: string) => c.toLowerCase().includes('non-alcohol'),
      },
      {
        id: 'cocktails' as CategoryFilter,
        label: 'Cocktail Recipes (POS)',
        match: (c: string) =>
          c.toLowerCase().includes('cocktail') &&
          !c.toLowerCase().includes('spirit'),
      },
    ];

    const categoryStats = catDefs.map((def) => {
      const matched = barItems.filter(({ item }) => def.match(item.category));
      const priced = matched.filter(
        ({ item, metrics }) => item.price > 0 && metrics.costPerPour > 0
      );
      const avgCogs =
        priced.length > 0
          ? priced.reduce((acc, { metrics }) => acc + metrics.cogsPct, 0) /
            priced.length
          : 0;
      const stockVal = matched.reduce(
        (acc, { metrics }) => acc + metrics.stockValue,
        0
      );
      const negCount = matched.filter(
        ({ item }) => item.expectedStock < 0 || item.liveCloverStock < 0
      ).length;

      return {
        ...def,
        skuCount: matched.length,
        avgCogs,
        stockVal,
        negCount,
      };
    });

    const negativeCocktailsCount = barItems.filter(
      ({ item, metrics }) =>
        metrics.isPosRecipeOnly &&
        (item.expectedStock < 0 || item.liveCloverStock < 0)
    ).length;

    return {
      barSkuCount: barItems.length,
      physicalBarSkuCount: physicalBarItems.length,
      currentOnHandValue,
      expectedStockValue,
      totalCountedSkus,
      totalVarianceCost,
      negativeSkuCount: negativeSkuCount + negativeCocktailsCount,
      theoreticalWeightedCogsPct,
      simpleAvgCogsPct,
      verifiedCostCount,
      totalPurchases,
      consumedCogsDollar,
      periodRunningCogsPct,
      categoryStats,
    };
  }, [enrichedItems, purchases, openingStockValue, periodBarSales]);

  // Filtered table rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedItems.filter(({ item }) => {
      const cat = item.category.toLowerCase();
      if (categoryFilter === 'bar' && !isBarBeverageCategory(item.category)) {
        return false;
      }
      if (categoryFilter === 'beer' && !cat.includes('beer')) return false;
      if (categoryFilter === 'premix' && !cat.includes('pre-mix')) return false;
      if (categoryFilter === 'spirits' && !cat.includes('spirit')) return false;
      if (categoryFilter === 'cocktails' && !cat.includes('cocktail')) return false;
      if (categoryFilter === 'nonalcohol' && !cat.includes('non-alcohol')) {
        return false;
      }
      if (categoryFilter === 'nonbar' && isBarBeverageCategory(item.category)) {
        return false;
      }

      if (onlyNegativeOrRecipe) {
        const needsAttention =
          item.expectedStock < 0 ||
          item.liveCloverStock < 0 ||
          item.recipeDeductions !== 0;
        if (!needsAttention) return false;
      }

      if (q) {
        const hit =
          item.name.toLowerCase().includes(q) ||
          item.cloverId.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!hit) return false;
      }

      return true;
    });
  }, [enrichedItems, categoryFilter, onlyNegativeOrRecipe, searchQuery]);

  // Field update handlers
  const updateItemField = (
    cloverId: string,
    patch: Partial<InventoryItem>
  ) => {
    const next = items.map((it) =>
      it.cloverId === cloverId ? { ...it, ...patch } : it
    );
    onUpdateItems(next);
  };

  const handleAutofillExpectedToActual = () => {
    const next = items.map((it) => {
      if (!isBarBeverageCategory(it.category)) return it;
      if (it.actualCount !== null) return it;
      return {
        ...it,
        actualCount: Number(Math.max(0, it.expectedStock).toFixed(2)),
      };
    });
    onUpdateItems(next, 'Prefilled blank stocktake counts from Clover expected stock');
    setStatusNotice('Prefilled blank Actual Count cells from Clover Expected Stock.');
  };

  const handleClearActualCounts = () => {
    const next = items.map((it) => ({ ...it, actualCount: null }));
    onUpdateItems(next, 'Cleared physical stocktake counts for new count');
    setStatusNotice('Cleared all Actual Count entries for a fresh stocktake.');
  };

  const handleAddPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newPurchaseAmount);
    if (Number.isNaN(amountNum) || amountNum <= 0) return;

    const entry: StockPurchaseEntry = {
      id: `pur-${Date.now()}`,
      date: newPurchaseDate.trim() || new Date().toLocaleDateString('en-AU'),
      supplier: newPurchaseSupplier.trim() || 'Liquor Wholesaler',
      invoiceRef: newPurchaseInvoice.trim() || 'INV',
      amount: amountNum,
      notes: newPurchaseNotes.trim(),
    };
    onUpdatePurchases([entry, ...purchases]);
    setNewPurchaseInvoice('');
    setNewPurchaseAmount('');
    setNewPurchaseNotes('');
    setStatusNotice(`Logged $${fmtMoney(amountNum)} stock purchase from ${entry.supplier}.`);
  };

  const handleDeletePurchase = (id: string) => {
    onUpdatePurchases(purchases.filter((p) => p.id !== id));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (!text) return;
      const existingMap = new Map(items.map((it) => [it.cloverId, it]));
      const parsed = parseCloverInventoryCsv(text, existingMap);
      if (parsed.length === 0) {
        setStatusNotice('Could not parse any rows from uploaded CSV.');
        return;
      }
      onUpdateItems(
        parsed,
        `Imported ${parsed.length} Clover SKUs (unit costs preserved)`
      );
      setStatusNotice(
        `Imported ${parsed.length} Clover inventory SKUs from "${file.name}" while preserving your wholesale unit costs.`
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCsv = () => {
    const header = [
      'Clover Item ID',
      'Item Name',
      'Category',
      'Price',
      'Live Clover Stock (Pours/Cans)',
      'Expected Stock (Bottles/Cans)',
      'Bottle Size (ml)',
      'Pour Size (ml)',
      'Recipe Deductions (Bottles)',
      'Actual Count (Bottles/Cans)',
      'Wholesale Cost (AUD)',
      'Cost Per Pour (AUD)',
      'Item COGS (%)',
      'On Hand Cost Value (AUD)',
    ];

    const rows = items.map((it) => {
      const m = calculateItemMetrics(it);
      const escape = (v: string) =>
        v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
      return [
        it.cloverId,
        escape(it.name),
        escape(it.category),
        `$${it.price.toFixed(2)}`,
        it.liveCloverStock,
        it.expectedStock,
        it.bottleSizeMl ?? '',
        it.pourSizeMl ?? '',
        it.recipeDeductions,
        it.actualCount ?? '',
        it.unitCost.toFixed(2),
        m.costPerPour.toFixed(2),
        m.cogsPct.toFixed(1),
        m.stockValue.toFixed(2),
      ].join(',');
    });

    const csv = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TroughX_Inventory_COGS_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-6">
      {/* TOP KPI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Stock On Hand Value */}
        <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
              Bar Stock On Hand (Cost)
            </span>
            <span className="p-1.5 rounded-lg bg-trough-yellow/10 text-trough-yellow text-xs">
              <i className="fa-solid fa-boxes-stacked"></i>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
              ${fmtMoney(summary.currentOnHandValue)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-trough-muted font-mono">
            {summary.physicalBarSkuCount} physical bar SKUs · {summary.totalCountedSkus}{' '}
            stocktaken
          </p>
        </div>

        {/* Card 2: Weighted Menu Alcohol COGS % */}
        <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
              Weighted Menu COGS %
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                summary.theoreticalWeightedCogsPct <= 22.0
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {summary.theoreticalWeightedCogsPct <= 22.0
                ? 'Under 22% Cap'
                : 'Above 22% Cap'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-trough-yellow">
              {summary.theoreticalWeightedCogsPct.toFixed(1)}%
            </span>
            <button
              type="button"
              onClick={() =>
                onApplyCogsToSimulator(
                  summary.theoreticalWeightedCogsPct,
                  'Weighted Clover Menu COGS'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-trough-yellow/15 hover:bg-trough-yellow text-trough-yellow hover:text-black border border-trough-yellow/40 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
            >
              Use in Simulator
            </button>
          </div>
          <p className="mt-1 text-[11px] text-trough-muted font-mono">
            Simple Avg: {summary.simpleAvgCogsPct.toFixed(1)}% · Verified costs:{' '}
            {summary.verifiedCostCount}/{summary.physicalBarSkuCount}
          </p>
        </div>

        {/* Card 3: Running Period Actual COGS % */}
        <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
              Running Period COGS %
            </span>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                summary.periodRunningCogsPct <= 22.0
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-rose-500/15 text-rose-300'
              }`}
            >
              ${Math.round(summary.consumedCogsDollar).toLocaleString()} Used
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                summary.periodRunningCogsPct <= 22.0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {summary.periodRunningCogsPct.toFixed(1)}%
            </span>
            <button
              type="button"
              onClick={() =>
                onApplyCogsToSimulator(
                  summary.periodRunningCogsPct,
                  'Running Period Actual COGS'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
            >
              Sync to Sim ({simCogsRate.toFixed(1)}%)
            </button>
          </div>
          <p className="mt-1 text-[11px] text-trough-muted font-mono">
            (Open + Purchases − Closing) ÷ ${periodBarSales.toLocaleString()} Bar Sales
          </p>
        </div>

        {/* Card 4: Variance & Clover Negative Alerts */}
        <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-trough-muted uppercase tracking-wider">
              Stocktake Variance &amp; Alerts
            </span>
            <button
              type="button"
              onClick={() => setOnlyNegativeOrRecipe((v) => !v)}
              className={`text-[11px] font-mono px-2 py-0.5 rounded border cursor-pointer ${
                onlyNegativeOrRecipe
                  ? 'bg-rose-500 text-white border-rose-500 font-bold'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
              }`}
            >
              {summary.negativeSkuCount} Negative SKUs
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                summary.totalVarianceCost >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.totalVarianceCost >= 0
                ? `+$${fmtMoney(summary.totalVarianceCost)}`
                : `-$${fmtMoney(Math.abs(summary.totalVarianceCost))}`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-trough-muted">
            Physical count vs Clover expected ({summary.totalCountedSkus} SKUs counted)
          </p>
        </div>
      </div>

      {/* RUNNING COGS FORMULA + INVOICE PURCHASES LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left 6 cols: Period COGS Calculator */}
        <div className="lg:col-span-6 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <i className="fa-solid fa-scale-balanced text-trough-yellow"></i> Running
                  Period Cost of Goods Reconciliation
                </h3>
                <p className="text-xs text-trough-muted">
                  Standard hospitality COGS formula linked directly to your live physical stocktake
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <label className="text-[11px] text-neutral-400 block font-medium">
                  1. Opening Stock Value (AUD ex-GST)
                </label>
                <div className="flex items-center bg-[#222222] border border-neutral-700 rounded-lg px-2.5 h-9 focus-within:border-trough-yellow">
                  <span className="text-neutral-400 font-mono mr-1.5">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={openingStockValue}
                    onChange={(e) =>
                      onUpdateOpeningStockValue(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none tabular-nums"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateOpeningStockValue(
                      Number(summary.expectedStockValue.toFixed(2))
                    )
                  }
                  className="text-[10px] text-trough-yellow hover:underline font-mono cursor-pointer"
                >
                  Set from Clover Expected Value ($
                  {fmtMoney(summary.expectedStockValue)})
                </button>
              </div>

              <div className="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-1.5">
                <label className="text-[11px] text-neutral-400 block font-medium">
                  Period Bar POS Turnover (Excl. Door/Cloak)
                </label>
                <div className="flex items-center bg-[#222222] border border-neutral-700 rounded-lg px-2.5 h-9 focus-within:border-trough-yellow">
                  <span className="text-trough-yellow font-mono mr-1.5">$</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={periodBarSales}
                    onChange={(e) =>
                      onUpdatePeriodBarSales(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none tabular-nums"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 block font-mono">
                  Used as denominator for actual COGS %
                </span>
              </div>
            </div>

            <div className="mt-3 bg-[#191919] border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-neutral-300">
                <span>Opening Stock Value:</span>
                <span>${fmtMoney(openingStockValue)}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>+ Stock Purchases / Deliveries ({purchases.length}):</span>
                <span>+${fmtMoney(summary.totalPurchases)}</span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>− Current / Closing Stock Value (from table below):</span>
                <span>(${fmtMoney(summary.currentOnHandValue)})</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between items-center text-white font-bold">
                <span>= Actual Consumed Beverage COGS:</span>
                <span className="text-base text-trough-yellow">
                  ${fmtMoney(summary.consumedCogsDollar)} ({summary.periodRunningCogsPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800 text-xs">
            <span className="text-neutral-400">
              Active Budget Simulator Beverage COGS Target:{' '}
              <strong className="text-trough-yellow font-mono">
                {simCogsRate.toFixed(1)}%
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onApplyCogsToSimulator(
                    summary.theoreticalWeightedCogsPct,
                    'Weighted Clover Menu COGS'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-[11px] font-semibold cursor-pointer"
              >
                Apply Menu COGS ({summary.theoreticalWeightedCogsPct.toFixed(1)}%)
              </button>
              <button
                type="button"
                onClick={() =>
                  onApplyCogsToSimulator(
                    summary.periodRunningCogsPct,
                    'Running Period Actual COGS'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-[11px] cursor-pointer"
              >
                Apply Period Actual ({summary.periodRunningCogsPct.toFixed(1)}%)
              </button>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Stock Deliveries & Supplier Invoices */}
        <div className="lg:col-span-6 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <i className="fa-solid fa-truck-ramp-box text-trough-yellow"></i> Stock
                  Deliveries &amp; Wholesale Invoices
                </h3>
                <p className="text-xs text-trough-muted">
                  Log Paramount, ALM, keg, and mixer invoices added to bar stock during the period
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-trough-yellow">
                Total: ${fmtMoney(summary.totalPurchases)}
              </span>
            </div>

            <form
              onSubmit={handleAddPurchase}
              className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end bg-[#191919] border border-neutral-800 rounded-xl p-3"
            >
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] text-neutral-400 block">Date</label>
                <input
                  type="text"
                  value={newPurchaseDate}
                  onChange={(e) => setNewPurchaseDate(e.target.value)}
                  className="w-full h-8 bg-[#222222] border border-neutral-700 rounded px-2 text-xs text-white font-mono"
                />
              </div>
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] text-neutral-400 block">Supplier</label>
                <input
                  type="text"
                  value={newPurchaseSupplier}
                  onChange={(e) => setNewPurchaseSupplier(e.target.value)}
                  placeholder="Paramount / ALM"
                  className="w-full h-8 bg-[#222222] border border-neutral-700 rounded px-2 text-xs text-white"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] text-neutral-400 block">Inv #</label>
                <input
                  type="text"
                  value={newPurchaseInvoice}
                  onChange={(e) => setNewPurchaseInvoice(e.target.value)}
                  placeholder="INV-104"
                  className="w-full h-8 bg-[#222222] border border-neutral-700 rounded px-2 text-xs text-white font-mono"
                />
              </div>
              <div className="sm:col-span-3 space-y-1">
                <label className="text-[10px] text-trough-yellow font-semibold block">
                  Amount ($)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newPurchaseAmount}
                    onChange={(e) => setNewPurchaseAmount(e.target.value)}
                    placeholder="1250.00"
                    required
                    className="w-full h-8 bg-[#222222] border border-trough-yellow/50 rounded px-2 text-xs text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="h-8 px-3 rounded bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>
              <div className="col-span-2 sm:col-span-12">
                <input
                  type="text"
                  value={newPurchaseNotes}
                  onChange={(e) => setNewPurchaseNotes(e.target.value)}
                  placeholder="Optional delivery notes (e.g. 2x Stone & Wood kegs, 12x Smirnoff 1125ml, Redbull cartons)..."
                  className="w-full h-7 bg-[#222222] border border-neutral-800 rounded px-2 text-[11px] text-neutral-300"
                />
              </div>
            </form>

            {/* Logged Purchase List */}
            <div className="mt-3 max-h-44 overflow-y-auto divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl bg-[#191919]">
              {purchases.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  No stock invoices logged yet for this period. Add liquor/keg deliveries above to
                  calculate period COGS.
                </div>
              ) : (
                purchases.map((p) => (
                  <div
                    key={p.id}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-neutral-800/40"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium text-white">
                        <span className="font-mono text-neutral-400 text-[11px]">
                          {p.date}
                        </span>
                        <span className="truncate">{p.supplier}</span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          #{p.invoiceRef}
                        </span>
                      </div>
                      {p.notes && (
                        <div className="text-[11px] text-neutral-400 truncate">
                          {p.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono">
                      <span className="font-bold text-trough-yellow tabular-nums">
                        ${fmtMoney(p.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePurchase(p.id)}
                        className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                        title="Remove invoice"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY PERFORMANCE STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summary.categoryStats.map((cat) => {
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                setCategoryFilter((prev) => (prev === cat.id ? 'bar' : cat.id))
              }
              className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                isActive
                  ? 'bg-trough-yellow/10 border-trough-yellow'
                  : 'bg-trough-cardDark border-trough-cardBorder hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-medium text-neutral-300">
                <span className="truncate">{cat.label}</span>
                <span className="font-mono text-neutral-500">{cat.skuCount}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between font-mono tabular-nums">
                <span
                  className={`text-lg font-bold ${
                    cat.avgCogs <= 22 ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {cat.avgCogs.toFixed(1)}%
                </span>
                <span className="text-xs text-neutral-300">
                  ${Math.round(cat.stockVal).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                <span>Avg Item COGS</span>
                {cat.negCount > 0 && (
                  <span className="text-rose-400 font-mono">
                    {cat.negCount} negative
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN CLOVER INVENTORY & STOCKTAKE TABLE */}
      <div className="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <i className="fa-solid fa-wine-bottle text-trough-yellow"></i> Clover
              Alcohol &amp; Bar Inventory Stocktake ({filteredRows.length} SKUs)
            </h3>
            <p className="text-xs text-trough-muted">
              Edit wholesale Bottle/Keg/Can costs and enter physical Actual Counts to refine
              live Cost of Goods and catch shrinkage or unmapped Clover recipe deductions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-file-import text-trough-yellow"></i>
              <span>Import Clover CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-file-export text-emerald-400"></i>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleAutofillExpectedToActual}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            >
              Fill Blank Counts
            </button>
            <button
              type="button"
              onClick={handleClearActualCounts}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer"
            >
              Clear Counts
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white cursor-pointer"
            >
              Reset Seed CSV
            </button>
          </div>
        </div>

        {statusNotice && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-400"></i>
              <span>{statusNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-emerald-200 hover:text-white cursor-pointer"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* Search & Category Filter Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:w-72">
            <i className="fa-solid fa-magnifying-glass text-neutral-500 text-xs absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item, category, or Clover ID..."
              className="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg pl-8 pr-8 text-xs text-white placeholder:text-neutral-500 focus:border-trough-yellow focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {(
              [
                ['bar', 'Bar & Alcohol'],
                ['beer', 'Beer'],
                ['premix', 'Pre-mix'],
                ['spirits', 'Spirits'],
                ['cocktails', 'Cocktails'],
                ['nonalcohol', 'Non-Alc & Mixers'],
                ['nonbar', 'Entries & Hardware'],
                ['all', `All (${items.length})`],
              ] as [CategoryFilter, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                  categoryFilter === key
                    ? 'bg-trough-yellow text-black font-bold'
                    : 'bg-[#191919] text-neutral-300 hover:text-white border border-neutral-800'
                }`}
              >
                {label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setOnlyNegativeOrRecipe((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg border transition cursor-pointer whitespace-nowrap ${
                onlyNegativeOrRecipe
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-semibold'
                  : 'bg-[#191919] text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              Negative / Recipe Only
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-neutral-800 rounded-xl bg-[#191919]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202020] text-neutral-300 uppercase tracking-wider text-[10px] font-mono border-b border-trough-cardBorder">
              <tr>
                <th className="py-3 px-3">Clover Item</th>
                <th className="py-3 px-2 text-right">POS Price</th>
                <th className="py-3 px-2 text-right">Clover Expected</th>
                <th className="py-3 px-2 text-center">Bottle / Pour (ml)</th>
                <th className="py-3 px-2 text-right">Unit Cost ($)</th>
                <th className="py-3 px-2 text-right">Pour Cost &amp; COGS %</th>
                <th className="py-3 px-2 text-center">Actual Count</th>
                <th className="py-3 px-3 text-right">Value &amp; Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80 text-neutral-200">
              {filteredRows.map(({ item, metrics }) => {
                const isNegative =
                  item.expectedStock < 0 || item.liveCloverStock < 0;
                return (
                  <tr
                    key={item.cloverId}
                    className={`hover:bg-neutral-800/40 transition ${
                      isNegative ? 'bg-rose-500/[0.03]' : ''
                    }`}
                  >
                    {/* Clover ID & Name */}
                    <td className="py-2.5 px-3 min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">{item.name}</span>
                        {isNegative && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300"
                            title="Negative Clover stock balance"
                          >
                            NEG
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5">
                        <span>{item.cloverId}</span>
                        <span>·</span>
                        <span className="font-sans text-neutral-400">{item.category}</span>
                        {item.recipeDeductions !== 0 && (
                          <>
                            <span>·</span>
                            <span className="text-amber-300">
                              Recipe {item.recipeDeductions}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* POS Price */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums text-white">
                      ${item.price.toFixed(2)}
                    </td>

                    {/* Clover Expected */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                      <div
                        className={`font-semibold ${
                          item.expectedStock < 0 ? 'text-rose-400' : 'text-neutral-200'
                        }`}
                      >
                        {item.expectedStock.toFixed(
                          Number.isInteger(item.expectedStock) ? 0 : 2
                        )}{' '}
                        {metrics.isPosRecipeOnly
                          ? 'sold'
                          : metrics.isPackagedCanOrSingle
                          ? 'units'
                          : 'btls'}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Live: {item.liveCloverStock}
                      </div>
                    </td>

                    {/* Bottle / Pour Size */}
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={item.bottleSizeMl ?? ''}
                          placeholder="ml"
                          onChange={(e) =>
                            updateItemField(item.cloverId, {
                              bottleSizeMl:
                                e.target.value === ''
                                  ? null
                                  : Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-16 bg-[#222222] border border-neutral-700 rounded px-1.5 py-1 text-right text-[11px] text-neutral-200"
                          title="Bottle / Keg size (ml)"
                        />
                        <span className="text-neutral-500">/</span>
                        <input
                          type="number"
                          min="0"
                          value={item.pourSizeMl ?? ''}
                          placeholder="ml"
                          onChange={(e) =>
                            updateItemField(item.cloverId, {
                              pourSizeMl:
                                e.target.value === ''
                                  ? null
                                  : Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-12 bg-[#222222] border border-neutral-700 rounded px-1.5 py-1 text-right text-[11px] text-neutral-200"
                          title="Pour size (ml)"
                        />
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {metrics.isPosRecipeOnly
                          ? 'POS Cocktail Recipe'
                          : `${metrics.poursPerUnit.toFixed(
                              Number.isInteger(metrics.poursPerUnit) ? 0 : 1
                            )} pours/unit`}
                      </div>
                    </td>

                    {/* Wholesale Cost ($ / Bottle or Can) */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                      <div className="inline-flex items-center bg-[#222222] border border-neutral-700 focus-within:border-trough-yellow rounded px-1.5 py-1">
                        <span className="text-neutral-500 mr-1">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItemField(item.cloverId, {
                              unitCost: Math.max(0, parseFloat(e.target.value) || 0),
                              costVerified: true,
                            })
                          }
                          className="w-16 bg-transparent text-right text-xs font-bold text-white focus:outline-none"
                          title="Wholesale cost per bottle, keg, or can (ex-GST)"
                        />
                      </div>
                      <div className="text-[10px] mt-0.5">
                        {item.costVerified ? (
                          <span className="text-emerald-400">Invoice Verified</span>
                        ) : (
                          <span className="text-neutral-500">Est. Wholesale</span>
                        )}
                      </div>
                    </td>

                    {/* Cost Per Pour & Item COGS % */}
                    <td className="py-2.5 px-2 text-right font-mono tabular-nums">
                      <div className="text-neutral-200">
                        ${metrics.costPerPour.toFixed(2)} / pour
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          item.price <= 0
                            ? 'text-neutral-500'
                            : metrics.cogsPct <= 22
                            ? 'text-emerald-400'
                            : metrics.cogsPct <= 28
                            ? 'text-trough-yellow'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.price > 0 ? `${metrics.cogsPct.toFixed(1)}% COGS` : 'N/A'}
                      </div>
                    </td>

                    {/* Physical Actual Count */}
                    <td className="py-2.5 px-2 text-center font-mono tabular-nums">
                      <input
                        type="number"
                        step="0.1"
                        value={item.actualCount ?? ''}
                        placeholder={String(item.expectedStock)}
                        onChange={(e) =>
                          updateItemField(item.cloverId, {
                            actualCount:
                              e.target.value === ''
                                ? null
                                : parseFloat(e.target.value),
                          })
                        }
                        className="w-20 bg-[#222222] border border-neutral-700 focus:border-trough-yellow rounded px-2 py-1 text-center text-xs font-bold text-trough-yellow placeholder:text-neutral-600 focus:outline-none"
                      />
                    </td>

                    {/* Stock Value & Variance */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <div className="font-bold text-white">
                        ${fmtMoney(metrics.stockValue)}
                      </div>
                      {metrics.varianceUnits !== null && (
                        <div
                          className={`text-[10px] font-semibold ${
                            metrics.varianceUnits >= 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          Var:{' '}
                          {metrics.varianceUnits >= 0
                            ? `+${metrics.varianceUnits.toFixed(2)}`
                            : metrics.varianceUnits.toFixed(2)}{' '}
                          ({metrics.varianceCost !== null
                            ? `${metrics.varianceCost >= 0 ? '+' : '-'}$${Math.abs(
                                metrics.varianceCost
                              ).toFixed(0)}`
                            : '$0'}
                          )
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-neutral-400">
                    No inventory items match the current search or category filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
