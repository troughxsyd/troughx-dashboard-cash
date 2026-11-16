<!-- TAB 0: INTERACTIVE VENUE PROGRAMMING CALENDAR (3/4 CALENDAR + 1/4 SIMULATOR) -->
<section id="tab-programming" class="tab-panel space-y-4">
  <!-- TOP BAR -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-trough-yellow/15 border border-trough-yellow/40 flex items-center justify-center text-trough-yellow shrink-0">
        <i class="fa-solid fa-calendar-days text-base"></i>
      </div>
      <div>
        <div class="flex items-center gap-2.5 flex-wrap">
          <h2 class="text-sm sm:text-base font-bold text-white tracking-tight">
            Trough X Interactive Venue Programming Calendar
          </h2>
          <span class="text-xs text-neutral-400 font-mono">
            &middot; 3/4 Schedule Grid + 1/4 Live Budget Simulator
          </span>
        </div>
        <p class="text-xs text-trough-muted">
          Click any date on the calendar to program a new event or click an existing booking to
          model its budget, format, and surplus on the right. Drag events between dates to
          reschedule.
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-wrap shrink-0">
      <span id="prog-sync-pill" class="text-[11px] font-mono px-2.5 py-1 rounded-lg border bg-emerald-500/15 text-emerald-300 border-emerald-500/30 flex items-center gap-1.5">
        <i class="fa-solid fa-database"></i>
        <span>MySQL Auto-Sync Active</span>
      </span>
      <button type="button" onclick="refreshFromMysql()" class="px-2.5 py-1.5 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 text-xs font-mono flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
        <i class="fa-solid fa-cloud-arrow-down text-trough-yellow"></i>
        <span>Pull MySQL</span>
      </button>
    </div>
  </div>

  <!-- DESKTOP 3/4 LEFT CALENDAR + 1/4 RIGHT SIMULATOR & EVENT ENTRY -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
    <!-- LEFT 3/4 COLUMN (9 COLS) -->
    <div class="lg:col-span-9 space-y-4">
      <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 sm:p-5 space-y-4">
        <!-- Month Navigation & Season Quick-Jump Strip -->
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
          <div class="flex items-center gap-2.5">
            <button type="button" onclick="progPrevMonth()" class="w-9 h-9 rounded-xl bg-[#191919] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center transition cursor-pointer" title="Previous Month">
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <div class="min-w-[175px] text-center">
              <h3 id="prog-month-title" class="text-base sm:text-lg font-bold text-white tracking-tight">November 2026</h3>
              <span id="prog-month-subtitle" class="text-[11px] text-trough-muted font-mono block">0 Booked · 0 Open Fri/Sat</span>
            </div>
            <button type="button" onclick="progNextMonth()" class="w-9 h-9 rounded-xl bg-[#191919] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center transition cursor-pointer" title="Next Month">
              <i class="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>

          <!-- Season Month Pills -->
          <div id="prog-season-pills" class="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none"></div>

          <!-- Filter & Prime Slot Highlight Controls -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <div id="prog-filter-group" class="flex items-center bg-[#191919] p-1 rounded-xl border border-neutral-800 text-xs"></div>
            <button type="button" id="prog-prime-toggle" onclick="toggleHighlightPrimeSlots()" class="px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 bg-trough-yellow/15 text-trough-yellow border-trough-yellow/40" title="Highlight unbooked Friday & Saturday nights">
              <i class="fa-solid fa-sparkles text-[10px]"></i>
              <span>Open Fri/Sat Slots</span>
            </button>
          </div>
        </div>

        <!-- Monthly Financial Rollup Strip -->
        <div id="prog-month-rollup" class="grid grid-cols-2 sm:grid-cols-5 gap-2.5"></div>

        <!-- 7-COLUMN CALENDAR GRID -->
        <div class="border border-neutral-800 rounded-xl overflow-hidden bg-[#191919]">
          <div class="grid grid-cols-7 border-b border-neutral-800 bg-[#202020]">
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-neutral-400">Mon</div>
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-neutral-400">Tue</div>
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-neutral-400">Wed</div>
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-neutral-400">Thu</div>
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-trough-yellow bg-trough-yellow/5">Fri <span class="hidden sm:inline text-[10px] font-mono ml-1 text-trough-yellow/80">&middot; Prime</span></div>
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-trough-yellow bg-trough-yellow/5">Sat <span class="hidden sm:inline text-[10px] font-mono ml-1 text-trough-yellow/80">&middot; Prime</span></div>
            <div class="py-2.5 px-2 text-center text-xs font-bold tracking-wider uppercase text-neutral-400">Sun</div>
          </div>
          <div id="prog-calendar-grid" class="grid grid-cols-7 divide-x divide-y divide-neutral-800/90"></div>
        </div>

        <!-- Legend & Prime Slot Quick Programmer -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs">
          <div class="flex items-center gap-4 flex-wrap text-[11px] text-neutral-300">
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-trough-yellow/25 border border-trough-yellow"></span>
              <span>Trough-Owned Party (100% Door + Bar)</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-[#262626] border border-neutral-500"></span>
              <span>Promoter Hosted (Ticket Clip + Bar)</span>
            </span>
            <span class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded bg-sky-500/25 border border-sky-400"></span>
              <span>Fixed Venue Hire (Flat Rate)</span>
            </span>
          </div>
          <div id="prog-quick-prime-slots" class="flex items-center gap-1.5 flex-wrap"></div>
        </div>
      </div>

      <!-- CHRONOLOGICAL MONTH SCHEDULE STRIP -->
      <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 sm:p-5 space-y-3">
        <div class="flex items-center justify-between border-b border-neutral-800 pb-2.5">
          <div>
            <h3 id="prog-runsheet-title" class="text-sm font-bold text-white">Programmed Run-Sheet</h3>
            <p class="text-xs text-trough-muted">Click any row to load into the right-hand Budget Simulator &amp; Event Editor</p>
          </div>
          <button type="button" onclick="progAddInCurrentMonth()" id="prog-add-month-btn" class="px-3 py-1.5 rounded-lg bg-trough-yellow hover:bg-trough-yellowHover text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <i class="fa-solid fa-plus"></i>
            <span>Add Event</span>
          </button>
        </div>
        <div id="prog-runsheet-body"></div>
      </div>
    </div>

    <!-- RIGHT 1/4 COLUMN (3 COLS): BUDGET SIMULATOR & EVENT ENTRY -->
    <aside class="lg:col-span-3 lg:sticky lg:top-24 space-y-4">
      <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-4 space-y-4 shadow-sm">
        <div class="flex items-start justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <div class="flex items-center gap-1.5">
              <span id="prog-edit-badge" class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                New Event Entry
              </span>
              <span id="prog-sidebar-date-label" class="text-xs font-mono text-neutral-400">20/03/2027</span>
            </div>
            <h3 class="text-sm font-bold text-white mt-1">Budget Simulator &amp; Event Entry</h3>
          </div>
          <button type="button" id="prog-btn-new" onclick="startNewEventOnCalendarDate(state.simEventDate)" class="hidden px-2 py-1 rounded-lg bg-[#191919] hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-mono cursor-pointer whitespace-nowrap" title="Switch to creating a new event">
            + New
          </button>
        </div>

        <div id="prog-save-notice" class="hidden p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-emerald-400 shrink-0"></i>
          <span id="prog-save-notice-text" class="leading-snug"></span>
        </div>

        <!-- 1. Event Identity Fields -->
        <div class="space-y-2.5">
          <div>
            <label class="block text-[11px] text-neutral-400 font-medium mb-1">Event Date (DD/MM/YYYY)</label>
            <input type="text" id="prog-input-date" oninput="onSimFieldInput('date', this.value, true)" placeholder="14/11/2026" class="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg px-3 text-xs text-white font-mono focus:border-trough-yellow focus:outline-none" />
          </div>
          <div>
            <label class="block text-[11px] text-neutral-400 font-medium mb-1">Event Title &amp; Promoter</label>
            <input type="text" id="prog-input-title" oninput="onSimFieldInput('title', this.value, true)" placeholder="e.g. ACTION by Thick N Juicy" class="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-trough-yellow focus:outline-none" />
          </div>
          <div>
            <label class="block text-[11px] text-neutral-400 font-medium mb-1">Format Label</label>
            <input type="text" id="prog-input-format" oninput="onSimFieldInput('format', this.value, true)" placeholder="Owned Hero Night" class="w-full h-9 bg-[#191919] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-trough-yellow focus:outline-none" />
          </div>
        </div>

        <!-- 2. Operating & Revenue Mode Switch -->
        <div class="pt-2 border-t border-neutral-800 space-y-2">
          <label class="block text-[11px] font-semibold text-trough-muted uppercase tracking-wider">Revenue &amp; Deal Model</label>
          <div class="grid grid-cols-3 gap-1 bg-[#191919] p-1 rounded-xl border border-neutral-800">
            <button type="button" onclick="setSimMode('owned')" id="prog-mode-owned" class="py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap">Owned</button>
            <button type="button" onclick="setSimMode('promoter')" id="prog-mode-promoter" class="py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap">Promoter</button>
            <button type="button" onclick="setSimMode('fixed_hire')" id="prog-mode-fixed" class="py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap">Fixed Hire</button>
          </div>
        </div>

        <!-- 3. Dynamic Budget Parameters (re-rendered only when mode switches or event loads) -->
        <div id="prog-dynamic-params" class="space-y-3 pt-1"></div>

        <!-- 4. Live Pro-Forma Breakdown Card -->
        <div id="prog-proforma-card" class="bg-[#191919] border border-neutral-800 rounded-xl p-3 space-y-2 text-xs font-mono tabular-nums"></div>

        <!-- 5. Action Buttons -->
        <div id="prog-action-buttons" class="space-y-2 pt-1"></div>
      </div>
    </aside>
  </div>
</section>
