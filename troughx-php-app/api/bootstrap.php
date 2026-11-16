<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../seed_data.php';

try {
    $pdo = getDbConnection();
} catch (Throwable $e) {
    $defaults = getDefaultSettings();
    sendJson([
        'connected' => false,
        'error' => $e->getMessage(),
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
    ]);
}

// Fetch events
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

// Fetch roster
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

// Fetch templates
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

// Fetch Clover inventory
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

// Fetch purchases
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

// Fetch settings
$settingsRaw = $pdo->query('SELECT `setting_key`, `setting_value` FROM `venue_settings`')->fetchAll();
$defaults = getDefaultSettings();
$settingsMap = $defaults;
foreach ($settingsRaw as $row) {
    $decoded = json_decode((string)$row['setting_value'], true);
    if (is_array($decoded)) {
        $settingsMap[$row['setting_key']] = $decoded;
    }
}

sendJson([
    'connected' => true,
    'events' => $events,
    'roster' => $roster,
    'templates' => $templates,
    'inventory' => $inventory,
    'purchases' => $purchases,
    'settings' => [
        'ownedOverheads' => $settingsMap['owned_overheads'],
        'wagesIncludeSuper' => (bool)($settingsMap['wages_include_super']['enabled'] ?? true),
        'fixedHireFee' => (float)($settingsMap['fixed_hire_fee']['amount'] ?? 5000.0),
        'simCogsRate' => (float)($settingsMap['sim_cogs_rate']['rate'] ?? 22.0),
        'openingStockValue' => (float)($settingsMap['inventory_opening_value']['amount'] ?? 3850.0),
        'periodBarSales' => (float)($settingsMap['inventory_period_sales']['amount'] ?? 10000.0),
    ],
]);
