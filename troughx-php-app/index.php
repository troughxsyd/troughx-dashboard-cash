<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/seed_data.php';

$dbConnected = false;
$dbError = null;

$defaults = getDefaultSettings();
$initialPayload = [
    'connected' => false,
    'events' => getSeedEvents(),
    'roster' => getSeedRoster(),
    'templates' => getSeedRosterTemplates(),
    'inventory' => getSeedInventoryItems(),
    'purchases' => [],
    'settings' => [
        'ownedOverheads' => $defaults['owned_overheads'],
        'wagesIncludeSuper' => (bool)$defaults['wages_include_super']['enabled'],
        'fixedHireFee' => (float)$defaults['fixed_hire_fee']['amount'],
        'simCogsRate' => (float)$defaults['sim_cogs_rate']['rate'],
        'openingStockValue' => (float)$defaults['inventory_opening_value']['amount'],
        'periodBarSales' => (float)$defaults['inventory_period_sales']['amount'],
    ],
];

try {
    $pdo = getDbConnection();
    $dbConnected = true;

    $eventRows = $pdo->query(
        'SELECT `id`, `event_date` AS `date`, `title`, `type`, `format`, `pax`,
                `bar_gross` AS `barGross`, `clip`, `ticket_rev` AS `ticketRev`,
                `deposit`, `wages`, `surplus`
         FROM `events` ORDER BY `id` ASC'
    )->fetchAll();

    $events = array_map(static fn(array $r): array => [
        'id' => (int)$r['id'],
        'date' => (string)$r['date'],
        'title' => (string)$r['title'],
        'type' => $r['type'] === 'promoter' ? 'promoter' : 'owned',
        'format' => (string)$r['format'],
        'pax' => (int)$r['pax'],
        'barGross' => (float)$r['barGross'],
        'clip' => (float)$r['clip'],
        'ticketRev' => (float)$r['ticketRev'],
        'deposit' => (float)$r['deposit'],
        'wages' => (float)$r['wages'],
        'surplus' => (float)$r['surplus'],
    ], $eventRows);

    $rosterRows = $pdo->query(
        'SELECT `id`, `role`, `headcount`, `hours`, `rate`, `has_super` AS `hasSuper`, `notes`
         FROM `roster_items` ORDER BY `sort_order` ASC, `id` ASC'
    )->fetchAll();

    $roster = array_map(static fn(array $r): array => [
        'id' => (int)$r['id'],
        'role' => (string)$r['role'],
        'headcount' => (int)$r['headcount'],
        'hours' => (float)$r['hours'],
        'rate' => (float)$r['rate'],
        'hasSuper' => (bool)$r['hasSuper'],
        'notes' => (string)$r['notes'],
    ], $rosterRows);

    $tplRows = $pdo->query(
        'SELECT `template_key` AS `id`, `name`, `updated_label` AS `updatedAt`,
                `include_super` AS `includeSuper`, `is_system` AS `isSystem`, `items_json`
         FROM `roster_templates` ORDER BY `is_system` DESC, `id` DESC'
    )->fetchAll();

    $templates = array_map(static function (array $r): array {
        $items = json_decode((string)$r['items_json'], true);
        return [
            'id' => (string)$r['id'],
            'name' => (string)$r['name'],
            'updatedAt' => (string)$r['updatedAt'],
            'includeSuper' => (bool)$r['includeSuper'],
            'isSystem' => (bool)$r['isSystem'],
            'items' => is_array($items) ? $items : [],
        ];
    }, $tplRows);

    $invRows = $pdo->query(
        'SELECT `clover_id` AS `cloverId`, `name`, `category`, `price`,
                `live_clover_stock` AS `liveCloverStock`, `expected_stock` AS `expectedStock`,
                `bottle_size_ml` AS `bottleSizeMl`, `pour_size_ml` AS `pourSizeMl`,
                `recipe_deductions` AS `recipeDeductions`, `actual_count` AS `actualCount`,
                `unit_cost` AS `unitCost`, `cost_verified` AS `costVerified`
         FROM `clover_inventory` ORDER BY `sort_order` ASC, `clover_id` ASC'
    )->fetchAll();

    $inventory = array_map(static fn(array $r): array => [
        'cloverId' => (string)$r['cloverId'],
        'name' => (string)$r['name'],
        'category' => (string)$r['category'],
        'price' => (float)$r['price'],
        'liveCloverStock' => (float)$r['liveCloverStock'],
        'expectedStock' => (float)$r['expectedStock'],
        'bottleSizeMl' => $r['bottleSizeMl'] !== null ? (float)$r['bottleSizeMl'] : null,
        'pourSizeMl' => $r['pourSizeMl'] !== null ? (float)$r['pourSizeMl'] : null,
        'recipeDeductions' => (float)$r['recipeDeductions'],
        'actualCount' => $r['actualCount'] !== null ? (float)$r['actualCount'] : null,
        'unitCost' => (float)$r['unitCost'],
        'costVerified' => (bool)$r['costVerified'],
    ], $invRows);

    $purRows = $pdo->query(
        'SELECT `purchase_key` AS `id`, `purchase_date` AS `date`, `supplier`,
                `invoice_ref` AS `invoiceRef`, `amount`, `notes`
         FROM `inventory_purchases` ORDER BY `id` DESC'
    )->fetchAll();

    $purchases = array_map(static fn(array $r): array => [
        'id' => (string)$r['id'],
        'date' => (string)$r['date'],
        'supplier' => (string)$r['supplier'],
        'invoiceRef' => (string)$r['invoiceRef'],
        'amount' => (float)$r['amount'],
        'notes' => (string)$r['notes'],
    ], $purRows);

    $rawSettings = $pdo->query('SELECT `setting_key`, `setting_value` FROM `venue_settings`')->fetchAll();
    $settingsMap = $defaults;
    foreach ($rawSettings as $row) {
        $decoded = json_decode((string)$row['setting_value'], true);
        if (is_array($decoded)) {
            $settingsMap[$row['setting_key']] = $decoded;
        }
    }

    $initialPayload = [
        'connected' => true,
        'events' => count($events) > 0 ? $events : $initialPayload['events'],
        'roster' => count($roster) > 0 ? $roster : $initialPayload['roster'],
        'templates' => count($templates) > 0 ? $templates : $initialPayload['templates'],
        'inventory' => count($inventory) > 0 ? $inventory : $initialPayload['inventory'],
        'purchases' => $purchases,
        'settings' => [
            'ownedOverheads' => $settingsMap['owned_overheads'],
            'wagesIncludeSuper' => (bool)($settingsMap['wages_include_super']['enabled'] ?? true),
            'fixedHireFee' => (float)($settingsMap['fixed_hire_fee']['amount'] ?? 5000.0),
            'simCogsRate' => (float)($settingsMap['sim_cogs_rate']['rate'] ?? 22.0),
            'openingStockValue' => (float)($settingsMap['inventory_opening_value']['amount'] ?? 3850.0),
            'periodBarSales' => (float)($settingsMap['inventory_period_sales']['amount'] ?? 10000.0),
        ],
    ];
} catch (Throwable $e) {
    $dbConnected = false;
    $dbError = $e->getMessage();
}

$initialJson = json_encode($initialPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP);
?>
<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Trough X Sydney | Operating Budget, Programming Calendar &amp; COGS (PHP/MySQL)</title>
  <meta name="description" content="Complete financial modeling, interactive venue programming calendar, IFA wage calculator, promoter deal analyzer, and Clover alcohol COGS system backed by PHP 8 & MySQL 8." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400..800&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <?php require __DIR__ . '/partials/styles.php'; ?>
</head>
<body class="min-h-screen flex flex-col bg-[#222222] text-neutral-100 antialiased selection:bg-trough-yellow selection:text-black">

  <!-- TOP HEADER / NAV -->
  <header class="no-print border-b border-trough-cardBorder bg-[#222222]/95 sticky top-0 z-40 backdrop-blur-md">
    <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <!-- Brand Logo -->
      <div class="flex items-center space-x-3">
        <img
          src="https://cdn.prod.website-files.com/69efc0068b16fc7a61e4f47e/6ae80e7d51e9ca54c2e6f5d4_TROUGH-X-LOGO.png"
          alt="Trough X Logo"
          class="h-10 w-auto object-contain rounded-lg"
        />
        <span class="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
          PHP 8 + MySQL Edition
        </span>
      </div>

      <!-- Action Buttons & Mode Pill -->
      <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span id="db-status-badge" class="px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center gap-1.5 <?= $dbConnected ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30' ?>" title="<?= htmlspecialchars($dbError ?? 'Connected to MySQL troughx_venue', ENT_QUOTES, 'UTF-8') ?>">
          <i class="fa-solid fa-database"></i>
          <span><?= $dbConnected ? 'MySQL Live' : 'Offline Fallback (Seed)' ?></span>
        </span>

        <button
          type="button"
          id="btn-refresh-mysql"
          onclick="refreshFromMysql()"
          class="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#191919] hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
          title="Reload schedule, roster, settings, and inventory from MySQL"
        >
          <i class="fa-solid fa-rotate text-trough-yellow"></i>
          <span>Reload MySQL</span>
        </button>

        <button
          type="button"
          id="btn-quick-mode-switch"
          onclick="toggleSimModeQuick()"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-trough-steelGrey hover:bg-trough-steelLight transition border border-neutral-600 flex items-center gap-1.5 cursor-pointer"
        >
          <i class="fa-solid fa-arrows-rotate text-trough-yellow"></i>
          <span id="quick-mode-label">Switch to Promoter ($5 Clip)</span>
        </button>

        <button
          type="button"
          onclick="window.print()"
          class="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
        >
          <i class="fa-solid fa-print"></i>
          <span>Print / PDF</span>
        </button>
      </div>
    </div>

    <!-- TAB NAVIGATION BAR -->
    <div class="border-t border-trough-cardBorder bg-[#1C1C1C]">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-2.5 overflow-x-auto py-1.5 text-xs font-medium scrollbar-none">
        <button type="button" data-tab="programming" onclick="setActiveTab('programming')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-black bg-trough-yellow font-semibold shadow-sm">
          <i class="fa-solid fa-calendar-check"></i> Programming Calendar (3/4 Split)
        </button>
        <button type="button" data-tab="dashboard" onclick="setActiveTab('dashboard')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-chart-pie"></i> Executive Dashboard
        </button>
        <button type="button" data-tab="simulator" onclick="setActiveTab('simulator')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-sliders"></i> Budget Simulator
        </button>
        <button type="button" data-tab="wages" onclick="setActiveTab('wages')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-users-gear"></i> Wage Calculator (IFA)
        </button>
        <button type="button" data-tab="promoter" onclick="setActiveTab('promoter')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-handshake-simple"></i> Promoter Deal Analyzer
        </button>
        <button type="button" data-tab="inventory" onclick="setActiveTab('inventory')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-wine-bottle"></i> Alcohol Inventory &amp; COGS
        </button>
        <button type="button" data-tab="calendar" onclick="setActiveTab('calendar')" class="nav-tab-btn px-3.5 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap text-neutral-300 hover:text-white hover:bg-neutral-800">
          <i class="fa-solid fa-calendar-days"></i> Forthcoming Events &amp; Sync
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN VIEWPORT -->
  <main id="main-viewport" class="flex-grow w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1600px]">
    <?php require __DIR__ . '/partials/tab_programming.php'; ?>
    <?php require __DIR__ . '/partials/tab_dashboard.php'; ?>
    <?php require __DIR__ . '/partials/tab_simulator.php'; ?>
    <?php require __DIR__ . '/partials/tab_wages.php'; ?>
    <?php require __DIR__ . '/partials/tab_promoter.php'; ?>
    <?php require __DIR__ . '/partials/tab_inventory.php'; ?>
    <?php require __DIR__ . '/partials/tab_events.php'; ?>
  </main>

  <!-- FOOTER -->
  <footer class="no-print border-t border-trough-cardBorder bg-[#1C1C1C] py-4 text-center text-xs text-trough-muted mt-8">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full <?= $dbConnected ? 'bg-emerald-400' : 'bg-amber-400' ?>"></span>
        <span>Trough X Operating System &bull; 273 Crown St, Surry Hills NSW 2010</span>
      </div>
      <div>
        <span>Flat-Rate IFA Roster Model &bull; BOOT Compliant &bull; PHP 8 + MySQL 8 Internal Edition</span>
      </div>
    </div>
  </footer>

  <script>
    window.__INITIAL_TROUGHX_STATE__ = <?= $initialJson ?>;
  </script>
  <?php require __DIR__ . '/partials/app_script.php'; ?>
</body>
</html>
