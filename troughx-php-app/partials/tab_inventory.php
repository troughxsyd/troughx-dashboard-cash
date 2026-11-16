<!-- TAB 5: ALCOHOL INVENTORY & RUNNING COGS -->
<section id="tab-inventory" class="tab-panel hidden space-y-6">
  <!-- TOP KPI STRIP -->
  <div id="inv-kpis" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>

  <!-- RUNNING COGS FORMULA + INVOICE PURCHASES LOG -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
    <!-- Left 6 cols: Period COGS Calculator -->
    <div class="lg:col-span-6 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between space-y-4">
      <div>
        <div class="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div>
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-scale-balanced text-trough-yellow"></i> Running Period Cost of Goods Reconciliation
            </h3>
            <p class="text-xs text-trough-muted">
              Standard hospitality COGS formula linked directly to your live physical stocktake
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-1.5">
            <label class="text-[11px] text-neutral-400 block font-medium">1. Opening Stock Value (AUD ex-GST)</label>
            <div class="flex items-center bg-[#222222] border border-neutral-700 rounded-lg px-2.5 h-9 focus-within:border-trough-yellow">
              <span class="text-neutral-400 font-mono mr-1.5">$</span>
              <input type="number" id="inv-opening-input" min="0" step="50" oninput="onInventoryOpeningInput(this.value)" class="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none tabular-nums" />
            </div>
            <button type="button" onclick="setOpeningFromCloverExpected()" id="inv-set-expected-btn" class="text-[10px] text-trough-yellow hover:underline font-mono cursor-pointer">
              Set from Clover Expected Value ($0.00)
            </button>
          </div>

          <div class="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-1.5">
            <label class="text-[11px] text-neutral-400 block font-medium">Period Bar POS Turnover (Excl. Door/Cloak)</label>
            <div class="flex items-center bg-[#222222] border border-neutral-700 rounded-lg px-2.5 h-9 focus-within:border-trough-yellow">
              <span class="text-trough-yellow font-mono mr-1.5">$</span>
              <input type="number" id="inv-sales-input" min="0" step="100" oninput="onInventoryPeriodSalesInput(this.value)" class="w-full bg-transparent text-white font-mono font-bold text-sm focus:outline-none tabular-nums" />
            </div>
            <span class="text-[10px] text-neutral-500 block font-mono">Used as denominator for actual COGS %</span>
          </div>
        </div>

        <div id="inv-reconcile-breakdown" class="mt-3 bg-[#191919] border border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs font-mono tabular-nums"></div>
      </div>

      <div id="inv-apply-bar" class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800 text-xs"></div>
    </div>

    <!-- Right 6 cols: Stock Deliveries & Supplier Invoices -->
    <div class="lg:col-span-6 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between space-y-4">
      <div>
        <div class="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
          <div>
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-truck-ramp-box text-trough-yellow"></i> Stock Deliveries &amp; Wholesale Invoices
            </h3>
            <p class="text-xs text-trough-muted">
              Log Paramount, ALM, keg, and mixer invoices added to bar stock during the period
            </p>
          </div>
          <span id="inv-purchases-total" class="text-xs font-mono font-bold text-trough-yellow">Total: $0.00</span>
        </div>

        <form onsubmit="handleAddPurchase(event)" class="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end bg-[#191919] border border-neutral-800 rounded-xl p-3">
          <div class="sm:col-span-3 space-y-1">
            <label class="text-[10px] text-neutral-400 block">Date</label>
            <input type="text" id="pur-date" class="w-full h-8 bg-[#222222] border border-neutral-700 rounded px-2 text-xs text-white font-mono" />
          </div>
          <div class="sm:col-span-4 space-y-1">
            <label class="text-[10px] text-neutral-400 block">Supplier</label>
            <input type="text" id="pur-supplier" value="Paramount Liquor" placeholder="Paramount / ALM" class="w-full h-8 bg-[#222222] border border-neutral-700 rounded px-2 text-xs text-white" />
          </div>
          <div class="sm:col-span-2 space-y-1">
            <label class="text-[10px] text-neutral-400 block">Inv #</label>
            <input type="text" id="pur-invoice" placeholder="INV-104" class="w-full h-8 bg-[#222222] border border-neutral-700 rounded px-2 text-xs text-white font-mono" />
          </div>
          <div class="sm:col-span-3 space-y-1">
            <label class="text-[10px] text-trough-yellow font-semibold block">Amount ($)</label>
            <div class="flex gap-1.5">
              <input type="number" id="pur-amount" min="0" step="0.01" placeholder="1250.00" required class="w-full h-8 bg-[#222222] border border-trough-yellow/50 rounded px-2 text-xs text-white font-mono" />
              <button type="submit" class="h-8 px-3 rounded bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs cursor-pointer shrink-0">+ Add</button>
            </div>
          </div>
          <div class="col-span-2 sm:col-span-12">
            <input type="text" id="pur-notes" placeholder="Optional delivery notes (e.g. 2x Stone & Wood kegs, 12x Smirnoff 1125ml, Redbull cartons)..." class="w-full h-7 bg-[#222222] border border-neutral-800 rounded px-2 text-[11px] text-neutral-300" />
          </div>
        </form>

        <!-- Logged Purchase List -->
        <div id="inv-purchases-list" class="mt-3 max-h-44 overflow-y-auto divide-y divide-neutral-800/80 border border-neutral-800 rounded-xl bg-[#191919]"></div>
      </div>
    </div>
  </div>

  <!-- CATEGORY PERFORMANCE STRIP -->
  <div id="inv-category-strip" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"></div>

  <!-- MAIN CLOVER INVENTORY & STOCKTAKE TABLE -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
    <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
      <div>
        <h3 class="font-bold text-sm text-white flex items-center gap-2">
          <i class="fa-solid fa-wine-bottle text-trough-yellow"></i>
          <span id="inv-table-title">Clover Alcohol &amp; Bar Inventory Stocktake (0 SKUs)</span>
        </h3>
        <p class="text-xs text-trough-muted">
          Edit wholesale Bottle/Keg/Can costs and enter physical Actual Counts to refine live Cost of Goods and catch shrinkage or unmapped Clover recipe deductions.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <input type="file" id="inv-csv-file" accept=".csv,text/csv" onchange="handleInventoryCsvUpload(event)" class="hidden" />
        <button type="button" onclick="document.getElementById('inv-csv-file').click()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-file-import text-trough-yellow"></i><span>Import Clover CSV</span>
        </button>
        <button type="button" onclick="exportInventoryCsv()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-file-export text-emerald-400"></i><span>Export CSV</span>
        </button>
        <button type="button" onclick="autofillExpectedToActual()" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer">
          Fill Blank Counts
        </button>
        <button type="button" onclick="clearActualCounts()" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer">
          Clear Counts
        </button>
        <button type="button" onclick="resetInventoryDefaults()" class="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white cursor-pointer">
          Reset Seed CSV
        </button>
      </div>
    </div>

    <div id="inv-status-notice" class="hidden p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span id="inv-status-notice-text"></span>
      </div>
      <button type="button" onclick="hideInventoryNotice()" class="text-emerald-200 hover:text-white cursor-pointer">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Search & Category Filter Row -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div class="relative w-full lg:w-72">
        <i class="fa-solid fa-magnifying-glass text-neutral-500 text-xs absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        <input type="text" id="inv-search-input" oninput="onInventorySearchInput(this.value)" placeholder="Search item, category, or Clover ID..." class="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg pl-8 pr-8 text-xs text-white placeholder:text-neutral-500 focus:border-trough-yellow focus:outline-none" />
        <button type="button" id="inv-search-clear" onclick="clearInventorySearch()" class="hidden absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div id="inv-filter-pills" class="flex items-center gap-1.5 flex-wrap text-xs"></div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border border-neutral-800 rounded-xl bg-[#191919]">
      <table class="w-full text-left text-xs">
        <thead class="bg-[#202020] text-neutral-300 uppercase tracking-wider text-[10px] font-mono border-b border-trough-cardBorder">
          <tr>
            <th class="py-3 px-3">Clover Item</th>
            <th class="py-3 px-2 text-right">POS Price</th>
            <th class="py-3 px-2 text-right">Clover Expected</th>
            <th class="py-3 px-2 text-center">Bottle / Pour (ml)</th>
            <th class="py-3 px-2 text-right">Unit Cost ($)</th>
            <th class="py-3 px-2 text-right">Pour Cost &amp; COGS %</th>
            <th class="py-3 px-2 text-center">Actual Count</th>
            <th class="py-3 px-3 text-right">Value &amp; Variance</th>
          </tr>
        </thead>
        <tbody id="inv-table-tbody" class="divide-y divide-neutral-800/80 text-neutral-200"></tbody>
      </table>
    </div>
  </div>
</section>
