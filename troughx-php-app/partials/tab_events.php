<!-- TAB 6: FORTHCOMING EVENTS & MYSQL SYNC -->
<section id="tab-calendar" class="tab-panel hidden space-y-6">
  <!-- MySQL Server Sync & Portable Export/Import Pipeline -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
      <div class="flex items-start sm:items-center gap-3">
        <div class="p-2.5 rounded-xl bg-trough-yellow/10 border border-trough-yellow/30 text-trough-yellow text-lg">
          <i class="fa-solid fa-database"></i>
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-sm text-white">MySQL 8 Persistence &amp; CSV/JSON Data Pipeline</h3>
            <span id="cal-db-pill" class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              Live MySQL Backend
            </span>
          </div>
          <p class="text-xs text-trough-muted mt-0.5">
            All schedule changes persist directly to <span class="font-mono text-neutral-300">troughx_venue.events</span> in MySQL. Export portable CSV schedules or full JSON backups at any time.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" onclick="refreshFromMysql()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-cloud-arrow-down text-trough-yellow"></i><span>Pull Latest from MySQL</span>
        </button>
        <button type="button" onclick="pushAllEventsToMysql()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-cloud-arrow-up"></i><span>Push Schedule to MySQL</span>
        </button>
        <button type="button" onclick="exportEventsCsv()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-file-csv text-emerald-400"></i><span>Export Events CSV</span>
        </button>
        <button type="button" onclick="exportFullBackupJson()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-file-code text-trough-yellow"></i><span>Export Full JSON</span>
        </button>
        <input type="file" id="cal-json-import" accept=".json,application/json" onchange="handleImportFullJson(event)" class="hidden" />
        <button type="button" onclick="document.getElementById('cal-json-import').click()" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer">
          Import JSON Backup
        </button>
        <button type="button" onclick="restoreBaselineEvents()" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer">
          Restore Baseline 12
        </button>
      </div>
    </div>
  </div>

  <!-- Forthcoming Events Table Card -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            <i class="fa-solid fa-calendar-days text-trough-yellow"></i> Trough X Confirmed &amp; Pipeline Events Schedule
          </h3>
          <span id="cal-saved-notice" class="hidden text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono"></span>
        </div>
        <p class="text-xs text-trough-muted">
          Click <strong class="text-trough-yellow">Edit in Simulator</strong> on any event to model and save changes via the Budget Simulator, or use <strong class="text-neutral-200">Quick Edit</strong> to modify cells inline.
        </p>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" onclick="startNewEventInSimulator()" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-plus"></i><span>New Event in Simulator</span>
        </button>
        <button type="button" onclick="pushAllEventsToMysql()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-floppy-disk"></i><span>Save Schedule</span>
        </button>

        <div class="relative flex-1 sm:flex-initial">
          <i class="fa-solid fa-magnifying-glass text-neutral-500 text-[11px] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          <input
            type="text"
            id="cal-search-input"
            oninput="onEventSearchInput(this.value)"
            placeholder="Filter by event title..."
            aria-label="Filter Forthcoming Events by title"
            class="w-full sm:w-52 h-8 bg-[#1E1E1E] border border-neutral-700 rounded-lg pl-7 pr-7 text-xs text-white placeholder:text-neutral-500 focus:border-trough-yellow focus:outline-none"
          />
          <button
            type="button"
            id="cal-search-clear"
            onclick="clearEventSearch()"
            aria-label="Clear title search"
            class="hidden absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
            title="Clear search"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <span class="text-xs text-neutral-500 pl-1">Filter:</span>
        <div id="cal-filter-buttons" class="flex items-center gap-1.5"></div>
      </div>
    </div>

    <!-- Schedule Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-[#202020] text-neutral-300 uppercase tracking-wider text-[10px] border-b border-trough-cardBorder">
          <tr>
            <th class="py-3 px-3">Date</th>
            <th class="py-3 px-3">Event Title &amp; Promoter</th>
            <th class="py-3 px-3">Format</th>
            <th class="py-3 px-3 text-center">Cap Target</th>
            <th class="py-3 px-3 text-right">Venue Gross</th>
            <th class="py-3 px-3 text-right">Venue Wages</th>
            <th class="py-3 px-3 text-right text-trough-yellow font-bold">Net Operating Surplus</th>
            <th class="py-3 px-3 text-right no-print">Actions</th>
          </tr>
        </thead>
        <tbody id="cal-table-tbody" class="divide-y divide-neutral-800/80 text-neutral-200"></tbody>
      </table>
    </div>

    <!-- Pipeline Aggregates -->
    <div id="cal-totals" class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-800"></div>
  </div>
</section>
