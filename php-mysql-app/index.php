<?php
declare(strict_types=1);
?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trough X — Venue Programming Calendar &amp; Budget Simulator (PHP / MySQL)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            trough: {
              bg: '#222222',
              cardDark: '#191919',
              cardBorder: '#333333',
              yellow: '#FFCC00',
              yellowHover: '#E5B800',
              muted: '#A3A3A3',
            },
          },
          fontFamily: {
            sans: ['Poppins', 'system-ui', 'sans-serif'],
            mono: ['Inconsolata', 'monospace'],
          },
        },
      },
    };
  </script>
  <style>
    body {
      background-color: #222222;
      color: #f5f5f5;
      font-family: 'Poppins', system-ui, sans-serif;
    }
    .font-mono, input[type="number"] {
      font-family: 'Inconsolata', monospace;
    }
    input[type="range"] {
      accent-color: #FFCC00;
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#222222] text-neutral-100 antialiased selection:bg-[#FFCC00] selection:text-black">
  <!-- TOP NAVIGATION -->
  <header class="border-b border-[#333333] bg-[#222222]/95 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <img
          src="https://cdn.prod.website-files.com/69efc0068b16fc7a61e4f47e/6ae80e7d51e9ca54c2e6f5d4_TROUGH-X-LOGO.png"
          alt="Trough X Logo"
          class="h-10 w-auto object-contain rounded-lg"
        />
        <div class="hidden sm:block border-l border-neutral-700 pl-3">
          <div class="text-xs font-bold text-white">Trough X Venue OS · PHP &amp; MySQL Edition</div>
          <div class="text-[11px] font-mono text-neutral-400">273 Crown St, Surry Hills NSW 2010 · 300 Pax Cap</div>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs">
        <span id="dbStatusBadge" class="px-2.5 py-1 rounded-lg bg-[#191919] border border-neutral-700 font-mono text-neutral-300">
          Connecting to MySQL...
        </span>
        <button
          type="button"
          onclick="window.print()"
          class="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <i class="fa-solid fa-print"></i>
          <span>Print</span>
        </button>
      </div>
    </div>

    <div class="border-t border-[#333333] bg-[#1C1C1C]">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex space-x-2 overflow-x-auto py-1.5 text-xs font-medium">
        <button data-tab="programming" class="tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap bg-[#FFCC00] text-black font-semibold">
          <i class="fa-solid fa-calendar-check"></i> Programming Calendar (3/4 Split)
        </button>
        <button data-tab="wages" class="tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-users-gear"></i> Wage Calculator (IFA)
        </button>
        <button data-tab="schedule" class="tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-calendar-days"></i> Full Schedule Ledger
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN CONTENT -->
  <main class="flex-grow max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- TAB 1: PROGRAMMING CALENDAR (3/4 LEFT + 1/4 RIGHT SIMULATOR) -->
    <section id="tab-programming" class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- LEFT 3/4 (9 COLS): CALENDAR & MONTHLY STATS -->
        <div class="lg:col-span-9 space-y-4">
          <div class="bg-[#191919] border border-[#333333] rounded-2xl p-4 sm:p-5 space-y-4">
            <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
              <div class="flex items-center gap-2.5">
                <button id="prevMonthBtn" type="button" class="w-9 h-9 rounded-xl bg-[#222222] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center cursor-pointer">
                  <i class="fa-solid fa-chevron-left text-xs"></i>
                </button>
                <div class="min-w-[180px] text-center">
                  <h2 id="monthHeading" class="text-base sm:text-lg font-bold text-white">November 2026</h2>
                  <span id="monthSubheading" class="text-[11px] font-mono text-neutral-400">0 Booked · 0 Open Fri/Sat</span>
                </div>
                <button id="nextMonthBtn" type="button" class="w-9 h-9 rounded-xl bg-[#222222] hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center cursor-pointer">
                  <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>

              <!-- Quick Season Jump -->
              <div id="seasonPills" class="flex items-center gap-1.5 overflow-x-auto py-1"></div>

              <!-- Filter Controls -->
              <div class="flex items-center bg-[#222222] p-1 rounded-xl border border-neutral-800 text-xs">
                <button data-filter="all" class="filter-btn px-2.5 py-1 rounded-lg bg-[#FFCC00] text-black font-bold cursor-pointer">All</button>
                <button data-filter="owned" class="filter-btn px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white cursor-pointer">Owned</button>
                <button data-filter="promoter" class="filter-btn px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white cursor-pointer">Promoter</button>
                <button data-filter="fixed_hire" class="filter-btn px-2.5 py-1 rounded-lg text-neutral-300 hover:text-white cursor-pointer">Fixed Hire</button>
              </div>
            </div>

            <!-- Monthly Rollup KPIs -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div class="bg-[#222222] border border-neutral-800 rounded-xl p-2.5">
                <span class="text-[11px] text-neutral-400 block">Programmed Nights</span>
                <div id="kpiCount" class="text-base font-bold font-mono text-white">0 Events</div>
              </div>
              <div class="bg-[#222222] border border-neutral-800 rounded-xl p-2.5">
                <span class="text-[11px] text-neutral-400 block">Projected Footfall</span>
                <div id="kpiPax" class="text-base font-bold font-mono text-white">0 Pax</div>
              </div>
              <div class="bg-[#222222] border border-neutral-800 rounded-xl p-2.5">
                <span class="text-[11px] text-neutral-400 block">Month Gross Turnover</span>
                <div id="kpiGross" class="text-base font-bold font-mono text-white">$0</div>
              </div>
              <div class="bg-[#222222] border border-neutral-800 rounded-xl p-2.5">
                <span class="text-[11px] text-neutral-400 block">Month Committed Wages</span>
                <div id="kpiWages" class="text-base font-bold font-mono text-rose-300">($0)</div>
              </div>
              <div class="col-span-2 sm:col-span-1 bg-[#222222] border border-[#FFCC00]/50 rounded-xl p-2.5">
                <span class="text-[11px] text-[#FFCC00] font-semibold block">Month Net Surplus</span>
                <div id="kpiSurplus" class="text-base font-extrabold font-mono text-[#FFCC00]">+$0</div>
              </div>
            </div>

            <!-- 7-Day Grid -->
            <div class="border border-neutral-800 rounded-xl overflow-hidden bg-[#222222]">
              <div class="grid grid-cols-7 border-b border-neutral-800 bg-[#1C1C1C]">
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-neutral-400">Mon</div>
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-neutral-400">Tue</div>
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-neutral-400">Wed</div>
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-neutral-400">Thu</div>
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-[#FFCC00] bg-[#FFCC00]/5">Fri · Prime</div>
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-[#FFCC00] bg-[#FFCC00]/5">Sat · Prime</div>
                <div class="py-2.5 px-2 text-center text-xs font-bold uppercase text-neutral-400">Sun</div>
              </div>
              <div id="calendarGrid" class="grid grid-cols-7 divide-x divide-y divide-neutral-800/90"></div>
            </div>
          </div>
        </div>

        <!-- RIGHT 1/4 (3 COLS): STICKY BUDGET SIMULATOR & EVENT ENTRY -->
        <aside class="lg:col-span-3 lg:sticky lg:top-24">
          <div class="bg-[#191919] border border-[#333333] rounded-2xl p-4 space-y-3.5 shadow-sm">
            <div class="flex items-start justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <span id="editorModeTag" class="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  New Event Entry
                </span>
                <h3 class="text-sm font-bold text-white mt-1">Budget Simulator &amp; Event Entry</h3>
              </div>
              <button id="resetNewBtn" type="button" class="px-2 py-1 rounded-lg bg-[#222222] hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-[11px] font-mono cursor-pointer">
                + New
              </button>
            </div>

            <div id="saveBanner" class="hidden p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs"></div>

            <div class="space-y-2">
              <div>
                <label class="block text-[11px] text-neutral-400 mb-1">Event Date (DD/MM/YYYY)</label>
                <input id="simEventDate" type="text" value="20/03/2027" class="w-full h-9 bg-[#222222] border border-neutral-700 rounded-lg px-3 text-xs text-white font-mono focus:border-[#FFCC00] focus:outline-none" />
              </div>
              <div>
                <label class="block text-[11px] text-neutral-400 mb-1">Event Title &amp; Promoter</label>
                <input id="simEventTitle" type="text" value="New Trough X Event" class="w-full h-9 bg-[#222222] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-[#FFCC00] focus:outline-none" />
              </div>
              <div>
                <label class="block text-[11px] text-neutral-400 mb-1">Format Label</label>
                <input id="simEventFormat" type="text" value="Owned Hero Night" class="w-full h-9 bg-[#222222] border border-neutral-700 rounded-lg px-3 text-xs text-white focus:border-[#FFCC00] focus:outline-none" />
              </div>
            </div>

            <!-- Mode Selector -->
            <div class="pt-2 border-t border-neutral-800">
              <label class="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">Revenue &amp; Deal Model</label>
              <div class="grid grid-cols-3 gap-1 bg-[#222222] p-1 rounded-xl border border-neutral-800">
                <button data-mode="owned" class="mode-btn py-1.5 px-2 rounded-lg text-[11px] font-bold bg-[#FFCC00] text-black cursor-pointer">Owned</button>
                <button data-mode="promoter" class="mode-btn py-1.5 px-2 rounded-lg text-[11px] font-semibold text-neutral-300 cursor-pointer">Promoter</button>
                <button data-mode="fixed_hire" class="mode-btn py-1.5 px-2 rounded-lg text-[11px] font-semibold text-neutral-300 cursor-pointer">Fixed Hire</button>
              </div>
            </div>

            <!-- Fixed Hire Inputs -->
            <div id="fixedHireBox" class="hidden p-3 rounded-xl bg-[#222222] border border-[#FFCC00]/40 space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-[#FFCC00]">Flat Venue Hire Fee</label>
                <div class="h-8 inline-flex items-center bg-[#191919] border border-[#FFCC00]/50 rounded-lg px-2">
                  <span class="text-[#FFCC00] font-mono text-xs mr-1">$</span>
                  <input id="simFixedHireInput" type="number" min="0" step="100" value="5000" class="w-20 bg-transparent text-right font-mono font-bold text-white text-xs focus:outline-none" />
                </div>
              </div>
              <input id="simFixedHireSlider" type="range" min="500" max="25000" step="250" value="5000" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer" />
              <p class="text-[10px] text-neutral-400">Flat contracted hire amount only — does not scale with attendance or include bar/ticket factors.</p>
            </div>

            <!-- Variable Event Sliders -->
            <div id="variableParamsBox" class="space-y-2.5">
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-neutral-300">Attendance (Pax)</span>
                  <span id="paxLabel" class="font-mono font-bold text-[#FFCC00]">200 Pax</span>
                </div>
                <input id="simPax" type="range" min="50" max="300" step="10" value="200" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer" />
              </div>

              <div id="ticketPriceBox">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-neutral-300">Avg Door Ticket Price</span>
                  <span id="ticketPriceLabel" class="font-mono font-bold text-white">$30.00</span>
                </div>
                <input id="simTicketPrice" type="range" min="15" max="60" step="1" value="30" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer" />
              </div>

              <div id="ticketClipBox" class="hidden">
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-[#FFCC00] font-semibold">Venue Ticket Clip / Head</span>
                  <span id="ticketClipLabel" class="font-mono font-bold text-white">$5.00</span>
                </div>
                <input id="simTicketClip" type="range" min="0" max="20" step="0.5" value="5" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer" />
              </div>

              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="text-neutral-300">Bar Spend / Head</span>
                  <span id="barSpendLabel" class="font-mono font-bold text-white">$22.50</span>
                </div>
                <input id="simBarSpend" type="range" min="12" max="45" step="0.5" value="22.5" class="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer" />
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2">
                  <div class="flex justify-between text-[10px] text-neutral-400">
                    <span>Cloak %</span>
                    <span id="cloakLabel" class="font-mono text-white font-bold">50%</span>
                  </div>
                  <input id="simCloakRate" type="range" min="0" max="100" step="5" value="50" class="w-full h-1 bg-neutral-800 rounded-lg cursor-pointer mt-1" />
                </div>
                <div class="bg-[#222222] border border-neutral-800 rounded-lg p-2">
                  <div class="flex justify-between text-[10px] text-neutral-400">
                    <span>Bev COGS</span>
                    <span id="cogsLabel" class="font-mono text-white font-bold">22.0%</span>
                  </div>
                  <input id="simCogsRate" type="range" min="15" max="35" step="0.5" value="22" class="w-full h-1 bg-neutral-800 rounded-lg cursor-pointer mt-1" />
                </div>
              </div>

              <label id="depositToggleRow" class="hidden flex items-center justify-between p-2 rounded-xl bg-[#222222] border border-neutral-800 cursor-pointer text-xs">
                <span>Include $550 Venue Deposit</span>
                <input id="simDeposit" type="checkbox" checked class="accent-[#FFCC00] w-4 h-4" />
              </label>
            </div>

            <!-- Live Pro-Forma Breakdown -->
            <div class="bg-[#222222] border border-neutral-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
              <div class="flex justify-between font-bold text-white border-b border-neutral-800 pb-1.5">
                <span class="font-sans text-[11px] uppercase text-neutral-300">1. Gross Venue Revenue</span>
                <span id="pfGross">$0.00</span>
              </div>
              <div class="flex justify-between text-[11px] text-rose-300">
                <span>2. COGS &amp; Overheads</span>
                <span id="pfCosts">($0.00)</span>
              </div>
              <div class="flex justify-between text-[11px] text-rose-300">
                <span>3. Direct IFA Wages</span>
                <span id="pfWages">($0.00)</span>
              </div>
              <div class="pt-2 border-t border-neutral-700 flex items-baseline justify-between">
                <div>
                  <span class="font-sans text-[11px] font-bold text-white block">Net Operating Surplus</span>
                  <span id="pfMargin" class="text-[10px] text-neutral-400">Margin: 0.0%</span>
                </div>
                <span id="pfSurplus" class="text-lg font-extrabold text-[#FFCC00]">+$0</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
              <button id="savePrimaryBtn" type="button" class="w-full py-2.5 px-4 rounded-xl bg-[#FFCC00] hover:bg-[#E5B800] text-black font-bold text-xs transition cursor-pointer">
                Add Event to Calendar
              </button>
              <div id="editActionsRow" class="hidden grid grid-cols-2 gap-2">
                <button id="saveCopyBtn" type="button" class="py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs cursor-pointer">
                  Save as Copy
                </button>
                <button id="deleteEventBtn" type="button" class="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold text-xs cursor-pointer">
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <!-- TAB 2: IFA WAGE CALCULATOR -->
    <section id="tab-wages" class="hidden space-y-4">
      <div class="bg-[#191919] border border-[#333333] rounded-2xl p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 class="text-base font-bold text-white">Flat-Rate IFA Venue Roster (MySQL Synced)</h2>
            <p class="text-xs text-neutral-400">Changes save to MySQL and dynamically update Budget Simulator wage projections.</p>
          </div>
          <button id="saveRosterBtn" type="button" class="px-4 py-2 rounded-xl bg-[#FFCC00] hover:bg-[#E5B800] text-black font-bold text-xs cursor-pointer">
            Save Roster to MySQL
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#222222] text-neutral-400 uppercase font-mono text-[10px]">
              <tr>
                <th class="py-2.5 px-3">Role</th>
                <th class="py-2.5 px-3">Staff</th>
                <th class="py-2.5 px-3">Hours</th>
                <th class="py-2.5 px-3">Hourly Rate ($)</th>
                <th class="py-2.5 px-3">Super (11.5%)</th>
                <th class="py-2.5 px-3 text-right">Line Cost</th>
              </tr>
            </thead>
            <tbody id="rosterBody" class="divide-y divide-neutral-800"></tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- TAB 3: FULL SCHEDULE LEDGER -->
    <section id="tab-schedule" class="hidden space-y-4">
      <div class="bg-[#191919] border border-[#333333] rounded-2xl p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div>
            <h2 class="text-base font-bold text-white">Full Programmed Events Ledger (MySQL)</h2>
            <p class="text-xs text-neutral-400">Click any event to inspect or edit it in the 3/4 Calendar + Simulator view.</p>
          </div>
          <button id="resetBaselineBtn" type="button" class="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs cursor-pointer">
            Reset Baseline 12 Events
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-[#222222] text-neutral-400 uppercase font-mono text-[10px]">
              <tr>
                <th class="py-2.5 px-3">Date</th>
                <th class="py-2.5 px-3">Event Title</th>
                <th class="py-2.5 px-3">Format</th>
                <th class="py-2.5 px-3 text-right">Pax</th>
                <th class="py-2.5 px-3 text-right">Gross</th>
                <th class="py-2.5 px-3 text-right">Wages</th>
                <th class="py-2.5 px-3 text-right text-[#FFCC00]">Net Surplus</th>
              </tr>
            </thead>
            <tbody id="ledgerBody" class="divide-y divide-neutral-800"></tbody>
          </table>
        </div>
      </div>
    </section>
  </main>

  <script>
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let state = {
      events: [],
      roster: [],
      ownedOverheads: { talentCost: 900, productionCost: 450, marketingCost: 400, otherCost: 0, merchantFeePct: 1.5 },
      wagesIncludeSuper: true,
      fixedHireFee: 5000,
      viewMonth: 10,
      viewYear: 2026,
      filter: 'all',
      editingId: null,
      simMode: 'owned',
      draggedEventId: null
    };

    function parseDMY(str) {
      const parts = String(str || '').trim().split(/[/-]/);
      if (parts.length !== 3) return null;
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      if (y < 100) y += 2000;
      if (isNaN(d) || isNaN(m) || isNaN(y) || m < 0 || m > 11) return null;
      return { day: d, month: m, year: y };
    }

    function fmtDMY(d, m, y) {
      return `${String(d).padStart(2,'0')}/${String(m + 1).padStart(2,'0')}/${y}`;
    }

    function fmtMoney(n) {
      return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function isFixedHireEvent(ev) {
      return String(ev.format || '').toLowerCase().includes('fixed') ||
        (Number(ev.barGross) === 0 && (Number(ev.clip) + Number(ev.ticketRev) + Number(ev.deposit)) > 0);
    }

    async function loadInitialData() {
      const badge = document.getElementById('dbStatusBadge');
      try {
        const [evRes, setRes] = await Promise.all([
          fetch('api/events.php'),
          fetch('api/settings.php')
        ]);
        const evData = await evRes.json();
        const setData = await setRes.json();
        state.events = evData.events || [];
        state.roster = setData.roster || [];
        state.ownedOverheads = setData.ownedOverheads || state.ownedOverheads;
        state.wagesIncludeSuper = setData.wagesIncludeSuper ?? true;
        state.fixedHireFee = Number(setData.fixedHireFee || 5000);
        document.getElementById('simFixedHireInput').value = state.fixedHireFee;
        document.getElementById('simFixedHireSlider').value = Math.min(25000, Math.max(500, state.fixedHireFee));
        badge.textContent = `MySQL Connected · ${state.events.length} Events`;
        badge.className = 'px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 font-mono text-emerald-300';
      } catch (err) {
        badge.textContent = 'MySQL Connection Error';
        badge.className = 'px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 font-mono text-rose-300';
      }
      recalculateSimulator();
      renderCalendar();
      renderRoster();
      renderLedger();
    }

    function computeRosterBaseWages(pax, isFixed) {
      let total = 0;
      state.roster.forEach((item) => {
        let count = Number(item.headcount || 0);
        if (!isFixed && item.role.includes('Crowd Control') && pax > 240) count += 1;
        if (!isFixed && item.role.includes('Bartender') && pax > 220) count += 1;
        total += count * Number(item.hours || 0) * Number(item.rate || 0);
      });
      return total;
    }

    function computeMetrics() {
      const pax = Number(document.getElementById('simPax').value || 200);
      const ticketPrice = Number(document.getElementById('simTicketPrice').value || 30);
      const ticketClip = Number(document.getElementById('simTicketClip').value || 5);
      const barSpend = Number(document.getElementById('simBarSpend').value || 22.5);
      const cloakRate = Number(document.getElementById('simCloakRate').value || 50) / 100;
      const cogsRate = Number(document.getElementById('simCogsRate').value || 22) / 100;
      const hasDeposit = document.getElementById('simDeposit').checked;
      const fixedHire = Number(document.getElementById('simFixedHireInput').value || 0);

      const isFixed = state.simMode === 'fixed_hire';
      const isOwned = state.simMode === 'owned';

      let ticketRevenue = 0, barRevenue = 0, cloakRevenue = 0, depositRevenue = 0, gross = 0;
      if (isFixed) {
        gross = fixedHire;
      } else if (isOwned) {
        ticketRevenue = pax * ticketPrice;
        barRevenue = pax * barSpend;
        cloakRevenue = Math.round(pax * cloakRate) * 5;
        gross = ticketRevenue + barRevenue + cloakRevenue;
      } else {
        ticketRevenue = pax * ticketClip;
        depositRevenue = hasDeposit ? 550 : 0;
        barRevenue = pax * barSpend;
        cloakRevenue = Math.round(pax * cloakRate) * 5;
        gross = ticketRevenue + barRevenue + cloakRevenue + depositRevenue;
      }

      const bevCogs = isFixed ? 0 : barRevenue * cogsRate;
      const consumables = isFixed ? 0 : (pax > 220 ? 200 : pax > 150 ? 150 : 100);
      const wages = computeRosterBaseWages(pax, isFixed);
      const fixedOh = isOwned
        ? (state.ownedOverheads.talentCost + state.ownedOverheads.productionCost + state.ownedOverheads.marketingCost + state.ownedOverheads.otherCost)
        : (isFixed ? 0 : 150);
      const terminalFees = isFixed ? 0 : gross * (isOwned ? state.ownedOverheads.merchantFeePct / 100 : 0.015);
      const costsAndOh = bevCogs + consumables + fixedOh + terminalFees;
      const surplus = gross - costsAndOh - wages;
      const margin = gross > 0 ? (surplus / gross) * 100 : 0;

      return { pax, ticketRevenue, barRevenue, cloakRevenue, depositRevenue, gross, costsAndOh, wages, surplus, margin, fixedHire };
    }

    function recalculateSimulator() {
      const m = computeMetrics();
      document.getElementById('paxLabel').textContent = `${m.pax} Pax`;
      document.getElementById('ticketPriceLabel').textContent = `$${Number(document.getElementById('simTicketPrice').value).toFixed(2)}`;
      document.getElementById('ticketClipLabel').textContent = `$${Number(document.getElementById('simTicketClip').value).toFixed(2)}`;
      document.getElementById('barSpendLabel').textContent = `$${Number(document.getElementById('simBarSpend').value).toFixed(2)}`;
      document.getElementById('cloakLabel').textContent = `${document.getElementById('simCloakRate').value}%`;
      document.getElementById('cogsLabel').textContent = `${Number(document.getElementById('simCogsRate').value).toFixed(1)}%`;

      document.getElementById('pfGross').textContent = `$${fmtMoney(m.gross)}`;
      document.getElementById('pfCosts').textContent = `($${fmtMoney(m.costsAndOh)})`;
      document.getElementById('pfWages').textContent = `($${fmtMoney(m.wages)})`;
      document.getElementById('pfMargin').textContent = `Margin: ${m.margin.toFixed(1)}%`;
      const sp = document.getElementById('pfSurplus');
      sp.textContent = m.surplus >= 0 ? `+$${Math.round(m.surplus).toLocaleString()}` : `-$${Math.round(Math.abs(m.surplus)).toLocaleString()}`;
      sp.className = `text-lg font-extrabold ${m.surplus >= 0 ? 'text-[#FFCC00]' : 'text-rose-400'}`;
    }

    function setSimMode(mode) {
      state.simMode = mode;
      document.querySelectorAll('.mode-btn').forEach((btn) => {
        const active = btn.dataset.mode === mode;
        btn.className = `mode-btn py-1.5 px-2 rounded-lg text-[11px] cursor-pointer ${active ? 'bg-[#FFCC00] text-black font-bold' : 'text-neutral-300 font-semibold'}`;
      });
      document.getElementById('fixedHireBox').classList.toggle('hidden', mode !== 'fixed_hire');
      document.getElementById('variableParamsBox').classList.toggle('hidden', mode === 'fixed_hire');
      document.getElementById('ticketPriceBox').classList.toggle('hidden', mode !== 'owned');
      document.getElementById('ticketClipBox').classList.toggle('hidden', mode !== 'promoter');
      document.getElementById('depositToggleRow').classList.toggle('hidden', mode !== 'promoter');
      recalculateSimulator();
    }

    function renderCalendar() {
      document.getElementById('monthHeading').textContent = `${MONTHS[state.viewMonth]} ${state.viewYear}`;
      const filtered = state.events.filter((ev) => {
        const fixed = isFixedHireEvent(ev);
        if (state.filter === 'owned') return ev.type === 'owned' && !fixed;
        if (state.filter === 'promoter') return ev.type === 'promoter' && !fixed;
        if (state.filter === 'fixed_hire') return fixed;
        return true;
      });

      const byDate = new Map();
      let monthEvents = [];
      filtered.forEach((ev) => {
        const p = parseDMY(ev.date);
        const key = p ? fmtDMY(p.day, p.month, p.year) : ev.date;
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(ev);
        if (p && p.month === state.viewMonth && p.year === state.viewYear) {
          monthEvents.push(ev);
        }
      });

      // Season Pills
      const seasonPills = document.getElementById('seasonPills');
      seasonPills.innerHTML = '';
      [[10,2026],[11,2026],[0,2027],[1,2027],[2,2027],[3,2027]].forEach(([m, y]) => {
        const count = state.events.filter((e) => { const p = parseDMY(e.date); return p && p.month === m && p.year === y; }).length;
        const active = m === state.viewMonth && y === state.viewYear;
        const b = document.createElement('button');
        b.className = `px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer whitespace-nowrap ${active ? 'bg-[#FFCC00] text-black font-bold border-[#FFCC00]' : 'bg-[#222222] text-neutral-300 border-neutral-800'}`;
        b.textContent = `${SHORT_MONTHS[m]} ’${String(y).slice(-2)} (${count})`;
        b.onclick = () => { state.viewMonth = m; state.viewYear = y; renderCalendar(); };
        seasonPills.appendChild(b);
      });

      // KPIs
      let mGross = 0, mWages = 0, mSurplus = 0, mPax = 0;
      monthEvents.forEach((e) => {
        mGross += Number(e.barGross) + Number(e.clip) + Number(e.ticketRev) + Number(e.deposit);
        mWages += Number(e.wages);
        mSurplus += Number(e.surplus);
        mPax += Number(e.pax);
      });
      document.getElementById('kpiCount').textContent = `${monthEvents.length} Events`;
      document.getElementById('kpiPax').textContent = `${mPax.toLocaleString()} Pax`;
      document.getElementById('kpiGross').textContent = `$${Math.round(mGross).toLocaleString()}`;
      document.getElementById('kpiWages').textContent = `($${Math.round(mWages).toLocaleString()})`;
      document.getElementById('kpiSurplus').textContent = `+$${Math.round(mSurplus).toLocaleString()}`;

      // Build 35 or 42 cells
      const firstDay = new Date(state.viewYear, state.viewMonth, 1);
      const daysInMonth = new Date(state.viewYear, state.viewMonth + 1, 0).getDate();
      const offset = (firstDay.getDay() + 6) % 7;
      const prevDays = new Date(state.viewYear, state.viewMonth, 0).getDate();
      const cells = [];

      for (let i = offset - 1; i >= 0; i--) {
        const m = state.viewMonth === 0 ? 11 : state.viewMonth - 1;
        const y = state.viewMonth === 0 ? state.viewYear - 1 : state.viewYear;
        cells.push({ day: prevDays - i, month: m, year: y, current: false });
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, month: state.viewMonth, year: state.viewYear, current: true });
      }
      const needed = cells.length <= 35 ? 35 : 42;
      let nd = 1;
      while (cells.length < needed) {
        const m = state.viewMonth === 11 ? 0 : state.viewMonth + 1;
        const y = state.viewMonth === 11 ? state.viewYear + 1 : state.viewYear;
        cells.push({ day: nd++, month: m, year: y, current: false });
      }

      const openPrimeCount = cells.filter((c, idx) => c.current && (idx % 7 === 4 || idx % 7 === 5) && !byDate.has(fmtDMY(c.day, c.month, c.year))).length;
      document.getElementById('monthSubheading').textContent = `${monthEvents.length} Booked · ${openPrimeCount} Open Fri/Sat`;

      const grid = document.getElementById('calendarGrid');
      grid.innerHTML = '';

      cells.forEach((cell, idx) => {
        const dateStr = fmtDMY(cell.day, cell.month, cell.year);
        const evList = byDate.get(dateStr) || [];
        const isPrime = idx % 7 === 4 || idx % 7 === 5;
        const box = document.createElement('div');
        box.className = `min-h-[124px] p-2 flex flex-col justify-between cursor-pointer transition ${
          !cell.current ? 'bg-[#161616] opacity-45' : isPrime && evList.length === 0 ? 'bg-[#1F1F1F] hover:bg-[#272727]' : 'bg-[#191919] hover:bg-[#232323]'
        }`;

        box.ondragover = (e) => e.preventDefault();
        box.ondrop = async (e) => {
          e.preventDefault();
          if (!state.draggedEventId) return;
          await fetch('api/events.php', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: state.draggedEventId, date: dateStr })
          });
          state.draggedEventId = null;
          await loadInitialData();
        };

        box.onclick = () => {
          if (evList.length > 0) loadEventIntoEditor(evList[0]);
          else startNewOnDate(dateStr);
        };

        const top = document.createElement('div');
        top.className = 'flex items-center justify-between text-xs font-mono';
        top.innerHTML = `<span class="font-bold ${isPrime && cell.current ? 'text-white' : 'text-neutral-400'}">${cell.day}</span>` +
          (evList.length === 0 && cell.current ? `<span class="text-[10px] text-[#FFCC00]/80">+ Program</span>` : '');
        box.appendChild(top);

        const body = document.createElement('div');
        body.className = 'space-y-1 my-1';
        evList.forEach((ev) => {
          const fixed = isFixedHireEvent(ev);
          const selected = state.editingId === ev.id;
          const card = document.createElement('div');
          card.draggable = true;
          card.ondragstart = (e) => { e.stopPropagation(); state.draggedEventId = ev.id; };
          card.onclick = (e) => { e.stopPropagation(); loadEventIntoEditor(ev); };
          card.className = `p-1.5 rounded-lg border text-left ${
            selected ? 'bg-[#FFCC00] text-black border-[#FFCC00]'
            : fixed ? 'bg-sky-500/15 border-sky-500/40 text-white'
            : ev.type === 'owned' ? 'bg-[#FFCC00]/15 border-[#FFCC00]/40 text-white'
            : 'bg-[#262626] border-neutral-600 text-white'
          }`;
          card.innerHTML = `
            <div class="flex justify-between text-[10px] font-mono ${selected ? 'text-black' : 'text-neutral-300'}">
              <span>${fixed ? 'FIXED HIRE' : ev.type.toUpperCase()}</span>
              <span>${fixed ? 'Flat' : ev.pax + 'p'}</span>
            </div>
            <div class="text-[11px] font-bold leading-tight truncate">${ev.title}</div>
            <div class="text-[10px] font-mono font-bold ${selected ? 'text-black' : 'text-emerald-400'}">+$${Math.round(ev.surplus).toLocaleString()}</div>
          `;
          body.appendChild(card);
        });
        box.appendChild(body);
        grid.appendChild(box);
      });
    }

    function startNewOnDate(dateStr) {
      state.editingId = null;
      document.getElementById('simEventDate').value = dateStr;
      document.getElementById('simEventTitle').value = 'New Trough X Event';
      document.getElementById('editorModeTag').textContent = 'New Event Entry';
      document.getElementById('savePrimaryBtn').textContent = `Add Event to ${dateStr}`;
      document.getElementById('editActionsRow').classList.add('hidden');
      recalculateSimulator();
      renderCalendar();
    }

    function loadEventIntoEditor(ev) {
      state.editingId = ev.id;
      document.getElementById('simEventDate').value = ev.date;
      document.getElementById('simEventTitle').value = ev.title;
      document.getElementById('simEventFormat').value = ev.format;
      const fixed = isFixedHireEvent(ev);
      if (fixed) {
        document.getElementById('simFixedHireInput').value = Number(ev.clip) + Number(ev.ticketRev) + Number(ev.deposit);
        setSimMode('fixed_hire');
      } else {
        setSimMode(ev.type);
        document.getElementById('simPax').value = Math.min(300, Math.max(50, ev.pax || 200));
        if (ev.pax > 0 && ev.barGross > 0) document.getElementById('simBarSpend').value = (ev.barGross / ev.pax).toFixed(1);
        if (ev.type === 'owned' && ev.pax > 0 && ev.ticketRev > 0) document.getElementById('simTicketPrice').value = Math.round(ev.ticketRev / ev.pax);
        if (ev.type === 'promoter' && ev.pax > 0) document.getElementById('simTicketClip').value = (ev.clip / ev.pax).toFixed(1);
        document.getElementById('simDeposit').checked = Number(ev.deposit) > 0;
      }
      document.getElementById('editorModeTag').textContent = `Editing Event #${ev.id}`;
      document.getElementById('savePrimaryBtn').textContent = 'Update Event on MySQL Calendar';
      document.getElementById('editActionsRow').classList.remove('hidden');
      recalculateSimulator();
      renderCalendar();
    }

    function buildPayloadFromSim() {
      const m = computeMetrics();
      const date = document.getElementById('simEventDate').value.trim();
      const title = document.getElementById('simEventTitle').value.trim();
      const format = document.getElementById('simEventFormat').value.trim();
      if (state.simMode === 'fixed_hire') {
        return {
          date, title, type: 'promoter',
          format: format.toLowerCase().includes('fixed') ? format : `Fixed Venue Hire (${format})`,
          pax: m.pax, barGross: 0, clip: Math.round(m.fixedHire), ticketRev: 0, deposit: 0,
          wages: Math.round(m.wages), surplus: Math.round(m.surplus)
        };
      }
      return {
        date, title, type: state.simMode, format,
        pax: m.pax, barGross: Math.round(m.barRevenue),
        clip: state.simMode === 'promoter' ? Math.round(m.ticketRevenue) : 0,
        ticketRev: state.simMode === 'owned' ? Math.round(m.ticketRevenue) : 0,
        deposit: state.simMode === 'promoter' ? Math.round(m.depositRevenue) : 0,
        wages: Math.round(m.wages), surplus: Math.round(m.surplus)
      };
    }

    async function saveEvent(asNew = false) {
      const payload = buildPayloadFromSim();
      const isUpdate = state.editingId !== null && !asNew;
      if (isUpdate) payload.id = state.editingId;
      const res = await fetch('api/events.php', {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.event) state.editingId = data.event.id;
      const banner = document.getElementById('saveBanner');
      banner.textContent = `Saved "${payload.title}" to MySQL.`;
      banner.classList.remove('hidden');
      await loadInitialData();
    }

    function renderRoster() {
      const body = document.getElementById('rosterBody');
      body.innerHTML = '';
      state.roster.forEach((r, idx) => {
        const superMult = state.wagesIncludeSuper && r.hasSuper ? 1.115 : 1;
        const cost = Number(r.headcount) * Number(r.hours) * Number(r.rate) * superMult;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-semibold text-white">${r.role}</td>
          <td class="py-2.5 px-3"><input type="number" min="0" value="${r.headcount}" onchange="updateRosterField(${idx},'headcount',this.value)" class="w-16 bg-[#222222] border border-neutral-700 rounded px-2 py-1 text-white" /></td>
          <td class="py-2.5 px-3"><input type="number" step="0.5" value="${r.hours}" onchange="updateRosterField(${idx},'hours',this.value)" class="w-16 bg-[#222222] border border-neutral-700 rounded px-2 py-1 text-white" /></td>
          <td class="py-2.5 px-3"><input type="number" step="0.5" value="${r.rate}" onchange="updateRosterField(${idx},'rate',this.value)" class="w-20 bg-[#222222] border border-neutral-700 rounded px-2 py-1 text-white" /></td>
          <td class="py-2.5 px-3 font-mono text-neutral-300">${r.hasSuper ? '11.5% Eligible' : 'Contract Exempt'}</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-[#FFCC00]">$${fmtMoney(cost)}</td>
        `;
        body.appendChild(tr);
      });
    }

    window.updateRosterField = (idx, key, val) => {
      state.roster[idx][key] = Number(val || 0);
      renderRoster();
      recalculateSimulator();
    };

    function renderLedger() {
      const body = document.getElementById('ledgerBody');
      body.innerHTML = '';
      state.events.forEach((ev) => {
        const gross = Number(ev.barGross) + Number(ev.clip) + Number(ev.ticketRev) + Number(ev.deposit);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-neutral-800/40 cursor-pointer';
        tr.onclick = () => {
          switchTab('programming');
          const p = parseDMY(ev.date);
          if (p) { state.viewMonth = p.month; state.viewYear = p.year; }
          loadEventIntoEditor(ev);
        };
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-mono text-neutral-300">${ev.date}</td>
          <td class="py-2.5 px-3 font-semibold text-white">${ev.title}</td>
          <td class="py-2.5 px-3 text-neutral-300">${ev.format}</td>
          <td class="py-2.5 px-3 text-right font-mono">${ev.pax} Pax</td>
          <td class="py-2.5 px-3 text-right font-mono">$${Math.round(gross).toLocaleString()}</td>
          <td class="py-2.5 px-3 text-right font-mono text-rose-300">($${Math.round(ev.wages).toLocaleString()})</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold text-[#FFCC00]">+$${Math.round(ev.surplus).toLocaleString()}</td>
        `;
        body.appendChild(tr);
      });
    }

    function switchTab(tab) {
      ['programming', 'wages', 'schedule'].forEach((t) => {
        document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tab);
      });
      document.querySelectorAll('.tab-btn').forEach((btn) => {
        const active = btn.dataset.tab === tab;
        btn.className = `tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
          active ? 'bg-[#FFCC00] text-black font-semibold' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
        }`;
      });
    }

    // Event bindings
    document.querySelectorAll('.tab-btn').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
    document.querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', () => setSimMode(b.dataset.mode)));
    document.querySelectorAll('.filter-btn').forEach((b) => b.addEventListener('click', () => {
      state.filter = b.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach((btn) => {
        const active = btn.dataset.filter === state.filter;
        btn.className = `filter-btn px-2.5 py-1 rounded-lg cursor-pointer ${active ? 'bg-[#FFCC00] text-black font-bold' : 'text-neutral-300 hover:text-white'}`;
      });
      renderCalendar();
    }));

    ['simPax','simTicketPrice','simTicketClip','simBarSpend','simCloakRate','simCogsRate','simDeposit'].forEach((id) => {
      document.getElementById(id).addEventListener('input', recalculateSimulator);
    });
    document.getElementById('simFixedHireInput').addEventListener('input', (e) => {
      document.getElementById('simFixedHireSlider').value = Math.min(25000, Math.max(500, Number(e.target.value || 0)));
      recalculateSimulator();
    });
    document.getElementById('simFixedHireSlider').addEventListener('input', (e) => {
      document.getElementById('simFixedHireInput').value = e.target.value;
      recalculateSimulator();
    });

    document.getElementById('prevMonthBtn').onclick = () => {
      if (state.viewMonth === 0) { state.viewMonth = 11; state.viewYear -= 1; } else { state.viewMonth -= 1; }
      renderCalendar();
    };
    document.getElementById('nextMonthBtn').onclick = () => {
      if (state.viewMonth === 11) { state.viewMonth = 0; state.viewYear += 1; } else { state.viewMonth += 1; }
      renderCalendar();
    };
    document.getElementById('resetNewBtn').onclick = () => startNewOnDate(document.getElementById('simEventDate').value || '20/03/2027');
    document.getElementById('savePrimaryBtn').onclick = () => saveEvent(false);
    document.getElementById('saveCopyBtn').onclick = () => saveEvent(true);
    document.getElementById('deleteEventBtn').onclick = async () => {
      if (!state.editingId) return;
      await fetch(`api/events.php?id=${state.editingId}`, { method: 'DELETE' });
      state.editingId = null;
      await loadInitialData();
    };
    document.getElementById('saveRosterBtn').onclick = async () => {
      await fetch('api/settings.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roster: state.roster, wagesIncludeSuper: state.wagesIncludeSuper })
      });
      await loadInitialData();
    };
    document.getElementById('resetBaselineBtn').onclick = async () => {
      await fetch('api/events.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      await loadInitialData();
    };

    loadInitialData();
  </script>
</body>
</html>
