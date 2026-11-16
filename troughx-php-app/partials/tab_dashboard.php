<!-- TAB 1: EXECUTIVE DASHBOARD -->
<section id="tab-dashboard" class="tab-panel hidden space-y-6">
  <!-- Operational Notice Bar -->
  <div class="bg-gradient-to-r from-trough-cardDark to-[#191919] border-l-4 border-trough-yellow p-4 rounded-xl shadow flex flex-col md:flex-row md:items-center justify-between gap-3 border border-trough-cardBorder">
    <div class="flex items-center space-x-3">
      <div class="p-2.5 bg-trough-yellow/10 rounded-lg text-trough-yellow text-lg">
        <i class="fa-solid fa-shield-halved"></i>
      </div>
      <div>
        <h4 class="font-semibold text-sm text-white">273 Crown Street Surry Hills Compliance Framework</h4>
        <p class="text-xs text-trough-muted">
          Maximum capacity capped at 300 patrons total (Basement strict limit: 60 patrons).
          Wages governed by flat-rate IFA BOOT standards.
        </p>
      </div>
    </div>
  </div>

  <!-- KPI Executive Cards Grid -->
  <div id="dash-kpis" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>

  <!-- Charts Section -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Comparative Performance Chart (2 cols) -->
    <div class="lg:col-span-2 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            <i class="fa-solid fa-chart-column text-trough-yellow"></i> Operating Scenario Comparison
          </h3>
          <p class="text-xs text-trough-muted">Actual Historical (Sept 11) vs Owned Target vs Owned Peak vs Promoter Model</p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="inline-flex items-center gap-1 text-neutral-300"><span class="w-2.5 h-2.5 rounded-full bg-[#4D4D4D]"></span> Gross</span>
          <span class="inline-flex items-center gap-1 text-neutral-300"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Wages</span>
          <span class="inline-flex items-center gap-1 text-neutral-300"><span class="w-2.5 h-2.5 rounded-full bg-trough-yellow"></span> Surplus</span>
        </div>
      </div>
      <div id="dash-bar-chart"></div>
    </div>

    <!-- Cost Allocation Doughnut Chart (1 col) -->
    <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      <div>
        <h3 class="font-bold text-sm text-white flex items-center gap-2">
          <i class="fa-solid fa-chart-pie text-trough-yellow"></i> Target Cost &amp; Margin Split
        </h3>
        <p class="text-xs text-trough-muted">Allocation of $11,000 Target Turnover</p>
      </div>
      <div id="dash-doughnut-chart" class="relative h-56 w-full my-auto flex items-center justify-center"></div>
      <div id="dash-doughnut-legend" class="pt-3 border-t border-neutral-800 text-[11px] grid grid-cols-2 gap-2 text-trough-muted"></div>
    </div>
  </div>

  <!-- Historical Actuals vs Benchmark Table -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 overflow-hidden shadow-sm space-y-4">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div>
        <h3 class="font-bold text-sm text-white flex items-center gap-2">
          <i class="fa-solid fa-scale-unbalanced-flip text-trough-yellow"></i> Operating Models Performance Matrix
        </h3>
        <p id="dash-matrix-subtitle" class="text-xs text-trough-muted">
          Dynamically recalculated across attendance levels using active IFA Roster &amp; Trough-Owned Direct Overheads
        </p>
      </div>
      <button type="button" onclick="resetOwnedOverheads()" class="self-start lg:self-auto text-xs text-trough-yellow hover:underline flex items-center gap-1.5 cursor-pointer font-mono">
        <i class="fa-solid fa-rotate-left"></i> Reset Overheads ($1,750 Base)
      </button>
    </div>

    <!-- Editable Trough-Owned Direct Overheads Bar -->
    <div class="bg-[#191919] border border-neutral-800 rounded-xl p-3.5 space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-trough-yellow flex items-center gap-1.5">
          <i class="fa-solid fa-sliders"></i> Editable Direct Overheads (Trough-Owned Events)
        </span>
        <span id="dash-overheads-summary" class="text-[11px] font-mono text-neutral-300"></span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2">
          <label class="block text-[10px] text-neutral-400 uppercase">DJ &amp; Talent ($)</label>
          <div class="mt-1 flex items-center">
            <span class="text-xs font-mono text-neutral-400 mr-1">$</span>
            <input type="number" id="dash-oh-talent" min="0" step="50" oninput="updateOwnedOverhead('talentCost', parseFloat(this.value) || 0)" class="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none" />
          </div>
        </div>
        <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2">
          <label class="block text-[10px] text-neutral-400 uppercase">Sound / AV &amp; Decor ($)</label>
          <div class="mt-1 flex items-center">
            <span class="text-xs font-mono text-neutral-400 mr-1">$</span>
            <input type="number" id="dash-oh-production" min="0" step="25" oninput="updateOwnedOverhead('productionCost', parseFloat(this.value) || 0)" class="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none" />
          </div>
        </div>
        <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2">
          <label class="block text-[10px] text-neutral-400 uppercase">Marketing &amp; Posters ($)</label>
          <div class="mt-1 flex items-center">
            <span class="text-xs font-mono text-neutral-400 mr-1">$</span>
            <input type="number" id="dash-oh-marketing" min="0" step="25" oninput="updateOwnedOverhead('marketingCost', parseFloat(this.value) || 0)" class="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none" />
          </div>
        </div>
        <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2">
          <label class="block text-[10px] text-neutral-400 uppercase">Other Direct ($)</label>
          <div class="mt-1 flex items-center">
            <span class="text-xs font-mono text-neutral-400 mr-1">$</span>
            <input type="number" id="dash-oh-other" min="0" step="25" oninput="updateOwnedOverhead('otherCost', parseFloat(this.value) || 0)" class="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none" />
          </div>
        </div>
        <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2 col-span-2 sm:col-span-1">
          <label class="block text-[10px] text-neutral-400 uppercase">EFTPOS Terminal (%)</label>
          <div class="mt-1 flex items-center">
            <input type="number" id="dash-oh-fee" min="0" max="10" step="0.1" oninput="updateOwnedOverhead('merchantFeePct', parseFloat(this.value) || 0)" class="w-full bg-transparent text-xs font-mono font-bold text-white focus:outline-none" />
            <span class="text-xs font-mono text-neutral-400 ml-1">%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-[#202020] text-neutral-300 uppercase tracking-wider text-[10px] border-b border-trough-cardBorder">
          <tr>
            <th class="py-3 px-3.5">Model Scenario</th>
            <th class="py-3 px-3.5">Patron Count</th>
            <th class="py-3 px-3.5">Gross Revenue</th>
            <th class="py-3 px-3.5">Beverage &amp; Bar COGS</th>
            <th class="py-3 px-3.5">Total Direct Wages</th>
            <th class="py-3 px-3.5">Direct Overheads</th>
            <th class="py-3 px-3.5">Labour %</th>
            <th class="py-3 px-3.5 text-right font-bold text-trough-yellow">Net Operating Surplus</th>
          </tr>
        </thead>
        <tbody id="dash-matrix-tbody" class="divide-y divide-neutral-800/80 text-neutral-200"></tbody>
      </table>
    </div>
  </div>
</section>
