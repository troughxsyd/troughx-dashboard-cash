# Trough X Sydney — Operating Budget, Programming Calendar & Alcohol COGS (PHP 8 + MySQL 8 Branch)

Standalone **PHP 8 + MySQL 8** branch of the Trough X Operating Budget, Interactive Programming Calendar, Wage Calculator (IFA), Promoter Deal Analyzer, and Clover Alcohol Inventory & COGS application. Built for parity with the React application while persisting all schedules, staffing rosters, templates, venue overheads, and Clover stocktakes in MySQL (`troughx_venue`).

## Features & Tabs (Full 7-Tab Parity)

1. **Programming Calendar (`3/4` Split)**:
   - Interactive Monday–Sunday monthly calendar grid with season quick-jump pills, open Fri/Sat prime slot highlighting, category filtering (`All`, `Owned`, `Promoter`, `Fixed Hire`), and drag-and-drop rescheduling between dates (`PATCH api/events.php`).
   - Monthly KPI rollup (bookings, open slots, gross, IFA wages, net surplus) and chronological Programmed Run-Sheet.
   - Sticky right-hand `1/4` Budget Simulator & Event Entry sidebar with live Pro-Forma card, Overheads drawer, Update/Copy/Delete/Add actions.
2. **Executive Dashboard**:
   - Real-time KPI cards, 5-scenario SVG bar chart, $11k Cost & Margin Doughnut chart, editable Trough-Owned Direct Overheads (`DJ & Talent`, `Sound/AV`, `Marketing`, `Other`, `EFTPOS %`), and 7-scenario Performance Matrix.
3. **Budget Simulator**:
   - Full-page builder linked to Forthcoming Events (`Load Event`), supporting **Trough-Owned**, **Clip + Bar Spend**, and **Fixed Venue Hire** models with real-time IFA roster headcount scaling above 220/240 pax.
4. **Wage Calculator (IFA)**:
   - Editable role & operational scope matrix, headcount, shift hours, hourly rates, per-role `11.5% IFA` vs `Contracted 0%` super toggle, global statutory super checkbox, saved roster templates, and MySQL persistence (`PUT api/settings.php`).
5. **Promoter Deal Analyzer**:
   - Dynamic breakeven calculation (with/without $550 non-refundable deposit) and Live Promoter Night Viability Tester (`Ticket Clip + Bar Spend` vs `Fixed Venue Hire Fee`).
6. **Alcohol Inventory & Running COGS**:
   - Pre-seeded with all **97 Clover SKUs** and realistic wholesale AUD ex-GST cost baselines.
   - Inline editable wholesale unit cost, bottle/pour size (ml), actual physical count, and cost-verified toggle (`PUT api/inventory.php`).
   - Opening stock + Wholesale Purchases log (`POST/DELETE api/inventory.php`) − Closing stock on hand = Consumed COGS $ & Running Period COGS %, with one-click push to the Budget Simulator COGS target.
   - Full Clover CSV import (preserving unit costs) & 14-column CSV export.
7. **Forthcoming Events & Sync**:
   - Live case-insensitive title search box (`#cal-search-input`) + model filter (`All`, `Trough Owned`, `Promoter Hire`).
   - Inline quick-edit table rows, "Edit in Simulator" deep link, Pull/Push MySQL schedule sync, Export Events CSV, Export/Import Full JSON backup, and Restore Baseline 12.

## Quick Setup (Local or Production)

### 1. Provision MySQL 8 Database
```bash
mysql -u root -p < troughx-php-app/schema.sql
```
This creates database `troughx_venue` with tables `events` (12 baseline bookings), `roster_items` (5 roles), `roster_templates` (2 presets), `clover_inventory` (97 Clover SKUs), `inventory_purchases`, and `venue_settings`.

### 2. Configure Database Credentials
Copy `.env.example` to `.env` inside `troughx-php-app/`:
```bash
cp troughx-php-app/.env.example troughx-php-app/.env
```
Edit `troughx-php-app/.env`:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=troughx_venue
DB_USER=root
DB_PASS=your_mysql_password
```

### 3. Run with PHP 8 Built-in Server (Requires `pdo_mysql` extension)
```bash
php -S 0.0.0.0:8080 -t troughx-php-app
```
Open `http://localhost:8080` in your browser. If MySQL is temporarily unavailable, the UI boots gracefully with the baseline dataset and caches edits locally until MySQL is reconnected.

## API Endpoints
- `GET api/bootstrap.php` — Full initial payload (`events`, `roster`, `templates`, `inventory`, `purchases`, `settings`)
- `GET/POST/PUT/PATCH/DELETE api/events.php` — Schedule CRUD, drag-and-drop date move, bulk replace, reset to baseline 12
- `GET/PUT/POST api/settings.php` — Roster items, IFA super setting, direct overheads, fixed hire fee, target COGS %, roster templates
- `GET/POST/PUT/DELETE api/inventory.php` — Clover SKU edits, bulk CSV import, invoice deliveries log, period COGS reconciliation, reset to seed SKUs
