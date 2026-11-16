<!-- TAB 2: INTERACTIVE BUDGET SIMULATOR -->
<section id="tab-simulator" class="tab-panel hidden space-y-6">
  <!-- FORTHCOMING EVENT LINK & SAVE BAR -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 shrink-0 rounded-lg bg-trough-yellow/15 border border-trough-yellow/30 flex items-center justify-center text-trough-yellow">
          <i class="fa-solid fa-calendar-check"></i>
        </div>
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-bold text-sm text-white">Forthcoming Event Builder &amp; Schedule Editor</h3>
            <span id="sim-editing-pill" class="text-[11px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 font-mono">
              New / Custom Event Mode
            </span>
          </div>
          <p class="text-xs text-trough-muted">
            Load any forthcoming event below, adjust parameters with the sliders, and save directly back to the Forthcoming Events schedule in MySQL.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <label class="text-xs text-neutral-400">Load Event:</label>
        <select id="sim-event-select" onchange="onSimSelectEvent(this.value)" class="bg-[#1E1E1E] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none max-w-xs"></select>
      </div>
    </div>

    <!-- Event Metadata Inputs -->
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
      <div class="sm:col-span-2 space-y-1">
        <label class="block text-[11px] text-neutral-400 font-medium truncate">Event Date (DD/MM/YYYY)</label>
        <input type="text" id="sim-input-date" oninput="onSimFieldInput('date', this.value, false)" placeholder="14/11/2026" class="w-full h-9 bg-[#1E1E1E] border border-neutral-700 rounded-lg px-3 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none" />
      </div>
      <div class="sm:col-span-4 space-y-1">
        <label class="block text-[11px] text-neutral-400 font-medium truncate">Event Title &amp; Promoter</label>
        <input type="text" id="sim-input-title" oninput="onSimFieldInput('title', this.value, false)" placeholder="e.g. ACTION by Thick N Juicy" class="w-full h-9 bg-[#1E1E1E] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-trough-yellow focus:outline-none" />
      </div>
      <div class="sm:col-span-3 space-y-1">
        <label class="block text-[11px] text-neutral-400 font-medium truncate">Format Label</label>
        <input type="text" id="sim-input-format" oninput="onSimFieldInput('format', this.value, false)" placeholder="Owned Hero Night" class="w-full h-9 bg-[#1E1E1E] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-trough-yellow focus:outline-none" />
      </div>
      <div id="sim-save-buttons" class="sm:col-span-3 flex items-center gap-2"></div>
    </div>

    <div id="sim-save-notice" class="hidden p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span id="sim-save-notice-text"></span>
      </div>
      <button type="button" onclick="setActiveTab('calendar')" class="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-semibold text-[11px] cursor-pointer whitespace-nowrap">
        View in Forthcoming Events &rarr;
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
    <!-- Controls Column (5 cols) -->
    <div class="lg:col-span-5 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between shadow-sm">
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-neutral-800 pb-3 min-h-[52px]">
          <div>
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-sliders text-trough-yellow"></i> Simulation Parameters
            </h3>
            <span class="text-xs text-trough-muted block">Adjust event revenue model, attendance, or fixed venue hire fee</span>
          </div>
          <button type="button" onclick="resetSimulatorDefaults()" class="text-xs text-trough-yellow hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0">
            <i class="fa-solid fa-rotate-left"></i> Reset Defaults
          </button>
        </div>

        <!-- Operating Mode Radio Switch -->
        <div>
          <label class="block text-xs font-semibold text-trough-muted uppercase tracking-wider mb-2">Event Production &amp; Revenue Mode</label>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-[#191919] p-1.5 rounded-xl border border-neutral-800">
            <button type="button" onclick="setSimMode('owned')" id="sim-mode-owned" class="h-9 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
              <i class="fa-solid fa-crown"></i><span>Trough-Owned</span>
            </button>
            <button type="button" onclick="setSimMode('promoter')" id="sim-mode-promoter" class="h-9 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
              <i class="fa-solid fa-handshake"></i><span>Clip + Bar Spend</span>
            </button>
            <button type="button" onclick="setSimMode('fixed_hire')" id="sim-mode-fixed" class="h-9 px-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
              <i class="fa-solid fa-building-lock"></i><span>Fixed Venue Hire</span>
            </button>
          </div>
        </div>

        <!-- Mode-specific sliders & inputs (rendered when mode changes or event loads) -->
        <div id="sim-controls-dynamic" class="space-y-4"></div>
      </div>
    </div>

    <!-- Live Financial Output Statement (7 cols) -->
    <div id="sim-proforma-panel" class="lg:col-span-7 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 flex flex-col justify-between shadow-sm"></div>
  </div>
</section>
