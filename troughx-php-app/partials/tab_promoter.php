<!-- TAB 4: PROMOTER DEAL ANALYZER -->
<section id="tab-promoter" class="tab-panel hidden space-y-6">
  <!-- Contractual Structure Banner -->
  <div class="bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 shadow-sm space-y-4">
    <div class="border-b border-neutral-800 pb-3">
      <span class="text-xs px-2.5 py-0.5 rounded bg-trough-yellow/10 text-trough-yellow font-semibold border border-trough-yellow/30 uppercase tracking-wider">
        Commercial Framework
      </span>
      <h3 class="font-bold text-lg text-white mt-1">
        Standard Trough X Promoter Agreement ($5.00 Ticket Clip)
      </h3>
      <p class="text-xs text-trough-muted">
        Standard venue hire structure executed with external promoters (e.g., BUSH, THROBB, POOF DOOF).
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-[#1E1E1E] p-4 rounded-xl border border-neutral-800 space-y-2">
        <h4 class="font-semibold text-sm text-emerald-400 flex items-center gap-2">
          <i class="fa-solid fa-circle-check"></i> What Venue (Trough X) Captures &amp; Retains
        </h4>
        <ul class="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
          <li><strong class="text-white">$5.00 flat clip</strong> per paid ticket sold (deducted from promoter settlement).</li>
          <li><strong class="text-white">100% of Beverage POS sales</strong> across all venue bars.</li>
          <li><strong class="text-white">100% of Cloakroom revenue</strong> ($5.00 per garment/bag).</li>
          <li><strong class="text-white">$550.00 non-refundable booking deposit</strong> paid upon date confirmation.</li>
        </ul>
      </div>

      <div class="bg-[#1E1E1E] p-4 rounded-xl border border-neutral-800 space-y-2">
        <h4 class="font-semibold text-sm text-trough-yellow flex items-center gap-2">
          <i class="fa-solid fa-users"></i> What Venue (Trough X) Provides &amp; Absorbs
        </h4>
        <ul class="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
          <li>Full operational staffing roster (Venue Duty Manager &amp; Senior Bartenders).</li>
          <li>Licensed crowd control security &amp; door/ticket scanner &amp; cloakroom staff.</li>
          <li>Full post-event bio-wash and cleaning crew.</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Breakeven Math Card & Live Deal Viability Tester -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Breakeven Formula Breakdown (5 cols) -->
    <div id="deal-breakeven-card" class="lg:col-span-5 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 space-y-4 shadow-sm"></div>

    <!-- Deal Viability Simulator (7 cols) -->
    <div class="lg:col-span-7 bg-trough-cardDark border border-trough-cardBorder rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <div>
            <h3 class="font-bold text-sm text-white flex items-center gap-2">
              <i class="fa-solid fa-vial-circle-check text-trough-yellow"></i> Live Promoter Night Viability Tester
            </h3>
            <p class="text-xs text-trough-muted">
              Test either a Venue Ticket Clip + Bar Spend deal or a flat Fixed Venue Hire Fee against our real cost structure
            </p>
          </div>
          <span id="deal-viability-badge" class="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">PROFITABLE</span>
        </div>

        <!-- Deal Revenue Option Toggle -->
        <div class="mb-4">
          <label class="block text-[11px] font-semibold text-trough-muted uppercase tracking-wider mb-1.5">Venue Hire Revenue Option</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#191919] p-1.5 rounded-xl border border-neutral-800">
            <button type="button" id="deal-mode-clip" onclick="setDealMode('clip_bar')" class="h-9 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer bg-trough-yellow text-black">
              <i class="fa-solid fa-ticket"></i><span>Venue Ticket Clip + Bar Spend</span>
            </button>
            <button type="button" id="deal-mode-fixed" onclick="setDealMode('fixed_hire')" class="h-9 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer text-neutral-300 hover:text-white">
              <i class="fa-solid fa-building-lock"></i><span>Fixed Venue Hire Fee (Flat Amount)</span>
            </button>
          </div>
        </div>

        <!-- Dynamic Deal Inputs (re-rendered only when toggling dealMode) -->
        <div id="deal-inputs-area"></div>

        <!-- Financial Summary Table -->
        <div id="deal-summary-table" class="mt-4 bg-[#1E1E1E] p-3 rounded-xl border border-neutral-800 space-y-2 text-xs font-mono"></div>
      </div>

      <div id="deal-bottom-result" class="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between"></div>
    </div>
  </div>
</section>
