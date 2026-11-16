<!-- TAB 3: WAGES CALCULATOR & ROSTER -->
<section id="tab-wages" class="tab-panel hidden space-y-6">
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
      <div>
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="font-bold text-sm text-white flex items-center gap-2">
            <i class="fa-solid fa-users-gear text-trough-yellow"></i> Staffing Roster &amp; Individual Flexibility Agreement (IFA) Matrix
          </h3>
          <span id="wages-saved-notice" class="hidden text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono"></span>
        </div>
        <p class="text-xs text-trough-muted">
          Edit role titles, headcount, shift hours, IFA hourly rates, and superannuation.
          Save entries to persist to MySQL and drive the Budget Simulator.
        </p>
      </div>
      <div class="flex items-center gap-2.5 flex-wrap">
        <label class="text-xs text-neutral-300 flex items-center gap-2 cursor-pointer bg-[#1E1E1E] px-3 py-1.5 rounded-lg border border-neutral-800">
          <input type="checkbox" id="wages-super-checkbox" onchange="toggleWagesIncludeSuper(this.checked)" class="rounded border-neutral-700 text-trough-yellow focus:ring-0" />
          <span>Apply Statutory Super (11.5%)</span>
        </label>
        <button type="button" onclick="saveCurrentRosterToMysql('Saved active wage entries')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-trough-yellow hover:bg-trough-yellowHover text-black transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-floppy-disk"></i><span>Save Wage Entries</span>
        </button>
        <button type="button" onclick="addRosterRole()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer">
          <i class="fa-solid fa-plus"></i><span>Add Role</span>
        </button>
        <button type="button" onclick="resetRosterDefaults()" class="text-xs text-neutral-400 hover:text-trough-yellow flex items-center gap-1 cursor-pointer px-2 py-1">
          <i class="fa-solid fa-arrow-rotate-right"></i> Reset Defaults
        </button>
      </div>
    </div>

    <!-- Saved Roster Templates Bar -->
    <div class="bg-[#1E1E1E] p-3.5 rounded-xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div class="space-y-1.5 flex-1">
        <span class="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">
          Saved Wage Calculator Templates (Click to Load):
        </span>
        <div id="wages-templates-list" class="flex flex-wrap gap-2"></div>
      </div>

      <div class="flex items-center gap-2 self-start md:self-end">
        <input type="text" id="wages-new-template-name" placeholder="New template name (e.g. Mardi Gras Roster)" class="bg-[#171717] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-trough-yellow focus:outline-none w-56" />
        <button type="button" onclick="saveNamedRosterTemplate()" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-trough-steelGrey hover:bg-trough-steelLight text-white border border-neutral-600 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5">
          <i class="fa-solid fa-bookmark text-trough-yellow"></i><span>Save as Template</span>
        </button>
      </div>
    </div>

    <!-- Roster Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-[#202020] text-neutral-300 uppercase tracking-wider text-[10px] border-b border-trough-cardBorder">
          <tr>
            <th class="py-3 px-3">Role &amp; Operational Scope (Editable)</th>
            <th class="py-3 px-3 text-center">Headcount</th>
            <th class="py-3 px-3 text-center">Hours / Shift</th>
            <th class="py-3 px-3 text-center">Hourly Rate (AUD)</th>
            <th class="py-3 px-3 text-center">Superannuation</th>
            <th class="py-3 px-3 text-right">Total Shift Cost</th>
            <th class="py-3 px-2 text-center no-print">Remove</th>
          </tr>
        </thead>
        <tbody id="wages-roster-tbody" class="divide-y divide-neutral-800 text-neutral-200"></tbody>
      </table>
    </div>

    <!-- Roster Summary KPI Bar -->
    <div id="wages-kpi-bar" class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-800"></div>

    <!-- Award & IFA Compliance Note -->
    <div class="bg-[#1E1E1E] p-4 rounded-xl border border-neutral-800 text-xs text-neutral-400 space-y-2">
      <h4 class="font-semibold text-neutral-200 flex items-center gap-2">
        <i class="fa-solid fa-circle-info text-trough-yellow"></i> Individual Flexibility Agreement (IFA) &amp; BOOT Testing
      </h4>
      <p>
        Under Trough X’s standard IFA framework, supervisory and floor rates are loaded to absorb weekend penalty rates, late-night allowances (post-midnight), and overtime, ensuring that each rostered worker is Better Off Overall than the base HIGA award.
      </p>
      <div class="flex flex-wrap gap-4 text-[11px] pt-1 text-neutral-300">
        <span>&bull; Venue Duty Manager / Crowd Control: $55.00/hr (6.0 hrs)</span>
        <span>&bull; Senior Bartender (x2): $45.00/hr (6.0 hrs)</span>
        <span>&bull; Door / Ticket Scanner &amp; Cloak: $35.00/hr (6.0 hrs)</span>
        <span>&bull; Cleaning Crew: $60.00/hr (6.0 hrs)</span>
      </div>
    </div>
  </div>
</section>
