-- Trough X Sydney — Branched Standalone PHP 8 + MySQL 8 Operating System
-- MySQL 8.0+ / MariaDB 10.6+ Complete Schema & Populated Base Seed Data

CREATE DATABASE IF NOT EXISTS `troughx_venue`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `troughx_venue`;

-- 1. Forthcoming & Programmed Events Schedule
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `event_date` VARCHAR(10) NOT NULL COMMENT 'DD/MM/YYYY format',
  `title` VARCHAR(180) NOT NULL,
  `type` ENUM('owned', 'promoter') NOT NULL DEFAULT 'owned',
  `format` VARCHAR(120) NOT NULL DEFAULT 'Owned Hero Night',
  `pax` INT UNSIGNED NOT NULL DEFAULT 200,
  `bar_gross` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `clip` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `ticket_rev` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `deposit` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `wages` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `surplus` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. IFA Staffing Roster Roles
CREATE TABLE IF NOT EXISTS `roster_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `role` VARCHAR(120) NOT NULL,
  `headcount` INT UNSIGNED NOT NULL DEFAULT 1,
  `hours` DECIMAL(5, 2) NOT NULL DEFAULT 6.00,
  `rate` DECIMAL(8, 2) NOT NULL DEFAULT 35.00,
  `has_super` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` VARCHAR(255) NOT NULL DEFAULT '',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Saved Wage Calculator Roster Templates
CREATE TABLE IF NOT EXISTS `roster_templates` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `template_key` VARCHAR(80) NOT NULL,
  `name` VARCHAR(180) NOT NULL,
  `updated_label` VARCHAR(40) NOT NULL DEFAULT 'Custom',
  `include_super` TINYINT(1) NOT NULL DEFAULT 1,
  `is_system` TINYINT(1) NOT NULL DEFAULT 0,
  `items_json` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_template_key` (`template_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Clover Bar & Alcohol Inventory (97 SKUs + Costing & Stocktake Counts)
CREATE TABLE IF NOT EXISTS `clover_inventory` (
  `clover_id` VARCHAR(32) NOT NULL,
  `sort_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `name` VARCHAR(180) NOT NULL,
  `category` VARCHAR(120) NOT NULL DEFAULT 'Unassigned',
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `live_clover_stock` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `expected_stock` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `bottle_size_ml` DECIMAL(10, 2) DEFAULT NULL,
  `pour_size_ml` DECIMAL(10, 2) DEFAULT NULL,
  `recipe_deductions` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `actual_count` DECIMAL(12, 2) DEFAULT NULL,
  `unit_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `cost_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clover_id`),
  INDEX `idx_inventory_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Wholesale Liquor Deliveries & Invoices Log
CREATE TABLE IF NOT EXISTS `inventory_purchases` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `purchase_key` VARCHAR(64) NOT NULL,
  `purchase_date` VARCHAR(20) NOT NULL,
  `supplier` VARCHAR(160) NOT NULL,
  `invoice_ref` VARCHAR(80) NOT NULL DEFAULT 'INV',
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_purchase_key` (`purchase_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Venue Operating Settings (Overheads, Fixed Hire Fee, Super Toggle, COGS Target, Opening/Sales)
CREATE TABLE IF NOT EXISTS `venue_settings` (
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_value` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- POPULATED BASE SEED DATA
-- =====================================================================

TRUNCATE TABLE `events`;
INSERT INTO `events` (`event_date`, `title`, `type`, `format`, `pax`, `bar_gross`, `clip`, `ticket_rev`, `deposit`, `wages`, `surplus`) VALUES
('14/11/2026', 'ACTION by Thick N Juicy', 'promoter', 'Promoter Hosted', 300, 10000.00, 1500.00, 0.00, 0.00, 4060.00, 4185.00),
('21/11/2026', 'THROBB by brute.club', 'promoter', 'Promoter Hosted', 280, 8000.00, 1400.00, 0.00, 0.00, 3860.00, 3125.00),
('28/11/2026', 'Red Rave by POOF DOOF', 'promoter', 'Promoter Hosted', 300, 10000.00, 1500.00, 0.00, 0.00, 4060.00, 4185.00),
('04/12/2026', 'BUSH (2nd Edition)', 'promoter', 'Promoter Hosted', 250, 7000.00, 1250.00, 0.00, 550.00, 3560.00, 2950.00),
('12/12/2026', 'THROBB Festive Edition', 'promoter', 'Promoter Hosted', 280, 8000.00, 1400.00, 0.00, 0.00, 3860.00, 3125.00),
('19/12/2026', 'Trough Noir: Summer Edition', 'owned', 'Owned Hero Night', 240, 6500.00, 0.00, 7200.00, 0.00, 3500.00, 6150.00),
('31/12/2026', 'NYE Lock-In 2026/27', 'owned', 'Owned Hero Night', 300, 12500.00, 0.00, 12000.00, 0.00, 4200.00, 12850.00),
('16/01/2027', 'Bareback Cabaret Launch', 'owned', 'Owned Daytime', 160, 4800.00, 0.00, 3200.00, 0.00, 2800.00, 2950.00),
('30/01/2027', 'LNQD (Late Night Queer Dance)', 'promoter', 'Promoter Hosted', 250, 7000.00, 1250.00, 0.00, 0.00, 3560.00, 2400.00),
('13/02/2027', 'Mardi Gras Warmup: Sniffies Cruise', 'owned', 'Owned Hero Night', 300, 11000.00, 0.00, 9000.00, 0.00, 4100.00, 9400.00),
('27/02/2027', 'TROUGH Mardi Gras Festival Main', 'owned', 'Owned Festival', 300, 15000.00, 0.00, 15000.00, 0.00, 4400.00, 15650.00),
('06/03/2027', 'FK CLUB Recovery', 'owned', 'Owned Recovery', 180, 5500.00, 0.00, 4500.00, 0.00, 2800.00, 4125.00);

TRUNCATE TABLE `roster_items`;
INSERT INTO `roster_items` (`sort_order`, `role`, `headcount`, `hours`, `rate`, `has_super`, `notes`) VALUES
(1, 'Venue Duty Manager', 1, 6.00, 55.00, 1, 'Incident management, licensing compliance, cash reconciliation'),
(2, 'Senior Bartender', 2, 6.00, 45.00, 1, 'Main bar and basement dispensary service'),
(3, 'Licensed Crowd Control', 1, 6.00, 55.00, 0, 'Licensed crowd control & street line management (Contracted Agency)'),
(4, 'Door / Ticket Scanner & Cloak', 1, 6.00, 35.00, 1, 'ID verification, wristbanding, ticket clip & cloakroom accounting'),
(5, 'Cleaning Crew', 1, 6.00, 60.00, 1, 'Bio-wash, floor sanitisation, commercial waste disposal');

INSERT INTO `roster_templates` (`template_key`, `name`, `updated_label`, `include_super`, `is_system`, `items_json`) VALUES
('baseline-200', 'Baseline 200 Pax Roster (Default)', 'Default', 1, 1, '[{"role":"Venue Duty Manager","headcount":1,"hours":6,"rate":55,"hasSuper":true,"notes":"Incident management, licensing compliance, cash reconciliation"},{"role":"Senior Bartender","headcount":2,"hours":6,"rate":45,"hasSuper":true,"notes":"Main bar and basement dispensary service"},{"role":"Licensed Crowd Control","headcount":1,"hours":6,"rate":55,"hasSuper":false,"notes":"Licensed crowd control & street line management (Contracted Agency)"},{"role":"Door / Ticket Scanner & Cloak","headcount":1,"hours":6,"rate":35,"hasSuper":true,"notes":"ID verification, wristbanding, ticket clip & cloakroom accounting"},{"role":"Cleaning Crew","headcount":1,"hours":6,"rate":60,"hasSuper":true,"notes":"Bio-wash, floor sanitisation, commercial waste disposal"}]'),
('peak-300', 'Peak 300 Pax Sell-Out Roster (2 Guards, 3 Bar)', 'Preset', 1, 1, '[{"role":"Venue Duty Manager","headcount":1,"hours":6,"rate":55,"hasSuper":true,"notes":"Incident management, licensing compliance, cash reconciliation"},{"role":"Senior Bartender","headcount":3,"hours":6,"rate":45,"hasSuper":true,"notes":"Main bar and basement dispensary service"},{"role":"Licensed Crowd Control","headcount":2,"hours":6,"rate":55,"hasSuper":false,"notes":"Licensed crowd control & street line management (Contracted Agency)"},{"role":"Door / Ticket Scanner & Cloak","headcount":1,"hours":6,"rate":35,"hasSuper":true,"notes":"ID verification, wristbanding, ticket clip & cloakroom accounting"},{"role":"Cleaning Crew","headcount":1,"hours":6,"rate":60,"hasSuper":true,"notes":"Bio-wash, floor sanitisation, commercial waste disposal"}]')
ON DUPLICATE KEY UPDATE `items_json` = VALUES(`items_json`), `name` = VALUES(`name`);

INSERT INTO `clover_inventory` (`clover_id`, `sort_order`, `name`, `category`, `price`, `live_clover_stock`, `expected_stock`, `bottle_size_ml`, `pour_size_ml`, `recipe_deductions`, `actual_count`, `unit_cost`, `cost_verified`) VALUES
('H550FNQSMHVEE', 1, 'Stone & Wood', 'Beer', 12.00, 3, -0.09, 50000, 375, 0, NULL, 365.00, 0),
('9QB49WFJQ6EZG', 2, 'Tiger Lager', 'Beer', 14.00, 70.33, 0.53, 50000, 375, 0, NULL, 335.00, 0),
('R6KCA2EEJ5N1Y', 3, 'Newtowner', 'Beer', 14.00, 112.33, 0.84, 50000, 375, 0, NULL, 335.00, 0),
('6TCDA8EAHPWS4', 4, 'Carlton Daught', 'Beer', 14.00, 65.33, 0.49, 50000, 375, 0, NULL, 335.00, 0),
('BPGAZQE4Y529P', 5, 'Bourbon + Coke', 'Cocktails, HAPPY HOUR', 15.00, 0, 0, 250, 250, 0, NULL, 2.75, 0),
('EGTSYJFD3MNTA', 6, 'Tequila + Soda + Lime', 'Cocktails, HAPPY HOUR', 14.00, -15, -15, 250, 250, 0, NULL, 2.75, 0),
('K0C3PFCB2EJ4A', 7, 'Vodka + Soda + Lime', 'Cocktails', 14.00, -66, -66, 250, 250, 0, NULL, 2.75, 0),
('SB07QE1VXR39R', 8, 'Vodka + Redbull', 'Cocktails, Spirits', 17.50, -105, -105, 250, 250, 0, NULL, 44.00, 0),
('BTDFDD509PRVC', 9, 'Gin & Tonic', 'Cocktails, HAPPY HOUR', 15.00, -8, -8, 250, 250, 0, NULL, 2.75, 0),
('QFBG2AGS4YVMP', 10, 'Long Island Iced Tea', 'Cocktails', 24.00, -12, -12, 250, 250, 0, NULL, 4.95, 0),
('76GCPGEK1FJKE', 11, 'Ruby Red', 'Cocktails', 14.00, -2, -2, 250, 250, 0, NULL, 2.75, 0),
('7YM5F89Z13X6E', 12, 'Mojito', 'Cocktails', 20.00, 0, 0, 250, 250, 0, NULL, 3.85, 0),
('966MYE7FW3D0W', 13, 'Spicy Margarita', 'Cocktails', 21.00, 0, 0, 250, 250, 0, NULL, 3.85, 0),
('40ZFJA18V3JP2', 14, 'Margarita', 'Cocktails', 20.00, 0, 0, 250, 250, 0, NULL, 3.85, 0),
('37B2FRVKNPWP0', 15, 'Cosmopolitan', 'Cocktails', 20.00, 0, 0, 250, 250, 0, NULL, 3.85, 0),
('JGTEGS18E49PA', 16, 'Japanese Highball', 'Cocktails', 18.00, 0, 0, 250, 250, 0, NULL, 2.75, 0),
('70Z6AVXYDQEDC', 17, 'Shandy', 'Cocktails', 18.00, 0, 0, 250, 250, 0, NULL, 2.75, 0),
('KWRND78CEZN6G', 18, 'Suntory 196', 'Pre-mix cans', 16.00, -6, -6, 330, 330, 0, NULL, 3.85, 0),
('RXGGPWAD1GADG', 19, 'Hard Rated', 'Pre-mix cans', 15.00, 54, 54, 375, 375, 0, NULL, 3.45, 0),
('KRXNGZKHHCCYW', 20, 'Smirnoff DOUBLE BLACK RASP', 'Pre-mix cans', 16.00, 27, 27, 375, 375, 0, NULL, 3.85, 0),
('F5PK1VST0T1C8', 21, 'Smirnoff DOUBLE BLACK', 'Pre-mix cans', 16.00, 16, 16, 375, 375, 0, NULL, 3.85, 0),
('22NS155D0F25M', 22, 'Smirnoff RED CAN', 'Pre-mix cans', 16.00, 9, 9, 375, 375, 0, NULL, 3.85, 0),
('4K2BEKAD4FA6M', 23, 'Whiteclaw WATERMELON', 'Pre-mix cans', 15.00, 14, 14, 330, 330, 0, NULL, 3.35, 0),
('PK9KF8TNDX1D2', 24, 'Whiteclaw RASPBERRY', 'Pre-mix cans', 15.00, 8, 8, 375, 375, 0, NULL, 3.35, 0),
('W45C85H7BWQJ8', 25, 'Whiteclaw MANGO', 'Pre-mix cans', 15.00, 20, 20, 330, 330, 0, NULL, 3.35, 0),
('SG5VSR0VRXB9W', 26, 'Jim Beam & Cola', 'Pre-mix cans', 14.00, 23, 23, 330, 330, 0, NULL, 3.45, 0),
('M6E9Y1Q7JRYSG', 27, 'Canadian Club - Dry', 'Pre-mix cans', 14.00, 10, 10, 375, 375, 0, NULL, 3.45, 0),
('RER0J6VZ60CB8', 28, 'Brookvale Ginger Beer', 'Pre-mix cans', 15.00, 20, 20, 330, 330, 0, NULL, 3.35, 0),
('ZRY5CGKQC4MAA', 29, 'Newtowner - Can', 'Beer', 14.00, 16, 16, 375, 375, 0, NULL, 2.95, 0),
('96ACZ68SFQ9C0', 30, 'Hanh Superdry Can', 'Beer', 14.00, 42, 42, 375, 375, 0, NULL, 2.95, 0),
('6AP8DFD1VQMYM', 31, 'Somersby Apple Cider', 'Pre-mix cans', 14.00, 30, 30, 375, 375, 0, NULL, 3.45, 0),
('NJSD0JSXV2Y9Y', 32, 'Guiness', 'Beer, Pre-mix cans', 13.00, 12, 12, 440, 440, 0, NULL, 3.60, 0),
('EGZRV4MP1V6P8', 33, 'Basic', 'Pre-mix cans, Spirits', 13.00, 0, 0, 1000, 30, 0, NULL, 3.45, 0),
('B8QKAJKS2VZ4J', 34, 'Vodka - Smirnoff', 'Spirits', 13.00, -130.5, -8.04, 1125, 30, -4.56, NULL, 54.00, 0),
('7JQMASEQVMPAR', 35, 'Gin - Gordon''s', 'Spirits', 13.00, 285.5, 7.61, 1125, 30, 0, NULL, 54.00, 0),
('853T60DB7W0S0', 36, 'Rum - Bacardi White', 'Spirits', 13.00, 62, 2.66, 700, 30, 0, NULL, 44.00, 0),
('ZJ3PNGYGJG6ET', 37, 'Tequila - Sierra Blanco', 'Spirits', 13.00, 0, 0, 1000, 30, 0, NULL, 48.00, 0),
('VQ2XHPSPD63AY', 38, 'Whisky - Ballantines', 'Spirits', 13.00, 53.67, 1.61, 1000, 30, 0, NULL, 48.00, 0),
('E8Z6GE8SAN9H2', 39, 'Tequila - Altos', 'Spirits', 15.00, 0, 0, 700, 30, 0, NULL, 54.00, 0),
('6N5DG7MDXT9A0', 40, 'Tequila - Jose Cuervo', 'Spirits', 14.00, 168.33, 5.05, 1000, 30, 0, NULL, 48.00, 0),
('9M73HHQMSDVM4', 41, 'Tequila - 1800 Coconut', 'Spirits', 16.00, 37.67, 1.61, 700, 30, 0, NULL, 72.00, 0),
('AF4SD9GXETSQ4', 42, 'Rum - Mount Gay', 'Spirits', 15.00, 4.33, 0.19, 700, 30, 0, NULL, 54.00, 0),
('6AK0JDMBR4Y38', 43, 'Gin - Tanqueray', 'Spirits', 15.00, 39.33, 1.69, 700, 30, 0, NULL, 56.00, 0),
('6M8HQ50XZVB2T', 44, 'Bourbon - Makers Mark', 'Spirits', 14.00, 45.67, 1.37, 1000, 30, 0, NULL, 54.00, 0),
('V4HR3VGZXTB3E', 45, 'Bourbon - Black Widow Honey', 'Cocktails, HAPPY HOUR, Spirits', 14.00, -3, -0.13, 700, 30, 0, NULL, 44.00, 0),
('EW5NB7TZ509FG', 46, 'Whisky - Laphoraig', 'Spirits', 18.00, 37, 0.93, 1200, 30, 0, NULL, 96.00, 0),
('K0R7M1JT8KFVY', 47, 'Fireball', 'HAPPY HOUR, Spirits', 13.00, 142, 4.26, 1000, 30, 0, NULL, 48.00, 0),
('A4Y09JR3BE2TT', 48, 'Spirit  - Other - Alize', 'Spirits', 13.00, 46.67, 2, 700, 30, 0, NULL, 44.00, 0),
('3MT37HC6SR652', 49, 'Spirit  - Other - Aperol', 'Cocktails', 13.00, 299, 8.97, 1000, 30, 0, NULL, 0.00, 0),
('NB9A1J3SVDY4Y', 50, 'Other - Cointreau', 'Spirits', 13.00, 70, 3, 700, 30, 0, NULL, 56.00, 0),
('RFZ1SNXX2KJSR', 51, 'Other - Wet Bussy', 'Spirits', 13.00, -4, -4, 1, 0, 0, NULL, 2.10, 0),
('Z6ZD3PYYVSS90', 52, 'Redbull Tropical', 'Non-alcohol', 6.00, 47, 47, 330, 330, 0, NULL, 1.85, 0),
('30FSDHYKAQ5H4', 53, 'Redbull WMelon', 'Non-alcohol', 6.00, 34, 34, 330, 330, 0, NULL, 1.85, 0),
('NKA93FHHYJ7K2', 54, 'Redbull', 'Non-alcohol', 6.00, 182, 112, 330, 330, -70, NULL, 1.85, 0),
('V40BK6S3MANKJ', 55, 'Redbull Sugar Free', 'Non-alcohol', 6.00, 175, 175, 330, 330, 0, NULL, 1.85, 0),
('0252K9FXE2AE2', 56, 'Gatorade - Clear/Watermelon', 'Non-alcohol', 6.00, 70, 70, 600, 600, 0, NULL, 1.95, 0),
('JNJ046KVK5DBY', 57, 'Gatorade - Purple', 'Non-alcohol', 6.00, 72, 72, 600, 600, 0, NULL, 1.95, 0),
('9G369GZQTVHV6', 58, 'Gatorade - Orange', 'Non-alcohol', 6.00, 53, 53, 600, 600, 0, NULL, 1.95, 0),
('F0NVF265YREST', 59, 'Gatorade - RED Topical', 'Non-alcohol', 6.00, 59, 59, 600, 600, 0, NULL, 1.95, 0),
('PG06H7J22E41G', 60, 'Gatorade - Yellow Lemon', 'Non-alcohol', 6.00, 88, 88, 600, 600, 0, NULL, 1.95, 0),
('XEGVDDJNBC8PP', 61, 'Gatorade - Blue Bolt', 'Non-alcohol', 6.00, 124, 124, 600, 600, 0, NULL, 1.95, 0),
('TV13HR90DZSDP', 62, 'Soft Drink - Solo', 'Non-alcohol', 4.50, 36, 36, 375, 375, 0, NULL, 1.35, 0),
('2DB70PCFNGZMW', 63, 'Soft Drink - Sprite', 'Non-alcohol', 4.50, 135, 135, 375, 375, 0, NULL, 1.35, 0),
('GCMW9J49Z3X4R', 64, 'Soft Drink - Coke Zero', 'Non-alcohol', 4.50, 79, 79, 375, 375, 0, NULL, 1.35, 0),
('C9FE322NSKENM', 65, 'Soft Drink - Coke', 'Non-alcohol', 4.50, 127, 127, 375, 375, 0, NULL, 1.35, 0),
('V1A9AC1G62N2Y', 66, 'Soft Drink - Sunkist', 'Non-alcohol', 4.50, 89, 89, 375, 375, 0, NULL, 1.35, 0),
('38NBHC1QHKKEA', 67, 'Mixer - Coke', 'Non-alcohol', 1.50, -6, -2.04, 1250, 425, 0, NULL, 2.45, 0),
('GGDKB09VT0SKY', 68, 'Mixer - Soda Water', 'Non-alcohol', 1.50, 285, 45.6, 1250, 200, 0, NULL, 0.75, 0),
('X8QDJEK97YVPY', 69, 'Mixer - Cranberry Juice', 'Non-alcohol', 2.00, 20, 2, 2000, 200, 0, NULL, 3.80, 0),
('55FDQHD8SC080', 70, 'Mixer - Tonic', 'Non-alcohol', 2.00, 112.75, 18.04, 1250, 200, 0, NULL, 2.45, 0),
('5ZN2XP4EH5BJA', 71, 'Mixer - Orange Juice', 'Non-alcohol', 2.00, 48, 4.8, 2000, 200, 0, NULL, 3.80, 0),
('YEXCHDBYSSEAA', 72, 'Mixer - Pineapple Juice', 'Non-alcohol', 2.00, 58, 5.8, 2000, 200, 0, NULL, 3.80, 0),
('3GANMJVZNF6FT', 73, 'Bottle Water', 'Non-alcohol', 4.75, -77, -77, NULL, 200, 0, NULL, 0.75, 0),
('VFSYQZZB2E66E', 74, 'Towel Service', 'Entries', 5.00, -7, -7, NULL, NULL, 0, NULL, 0.00, 0),
('G5W3ATHM2XHSP', 75, 'Cloak $10', 'Entries', 10.00, -463, -463, NULL, NULL, 0, NULL, 0.00, 0),
('6X6GDDFAN8FF6', 76, 'Cloak $5', 'Entries', 5.00, -44, -44, NULL, NULL, 0, NULL, 0.00, 0),
('J1JF0KHPZ9VAE', 77, 'Towel + Locker', 'Entries', 10.00, 0, 0, NULL, NULL, 0, NULL, 0.00, 0),
('J5XDWSNYRMDFT', 78, 'Ear Plugs', 'Entries', 5.00, 4, 4, NULL, NULL, 0, NULL, 0.00, 0),
('AFF4T8XEWZWM4', 79, 'Late Trough Entry', 'Entries', 20.00, -2, -2, NULL, NULL, 0, NULL, 0.00, 0),
('NDZDGV7HZ54D6', 80, 'FK CLUB Entry', 'Entries', 25.00, 0, 0, NULL, NULL, 0, NULL, 0.00, 0),
('F8Y38R6CGV7TG', 81, 'SATURDAY ENTRY', 'Entries', 35.00, -9, -9, NULL, NULL, 0, NULL, 0.00, 0),
('13EQ681Z51GEC', 82, 'FRIDAY ENTRY', 'Entries', 25.00, 0, 0, NULL, NULL, 0, NULL, 0.00, 0),
('6B1Q4HJFB2400', 83, 'Douch Room Charge', 'Entries', 5.00, -6, -6, NULL, NULL, 0, NULL, 0.00, 0),
('6G2XH6JGDM23J', 84, 'Hardware-JJBL30', 'Hardware', 60.00, 12, 12, NULL, NULL, 0, NULL, 21.00, 0),
('TSRSMZXKKQFMY', 85, 'Hardware-JJBL15', 'Hardware', 40.00, 17, 17, NULL, NULL, 0, NULL, 14.00, 0),
('ZJKCB9SJD0XRG', 86, 'Hardware-ry30', 'Hardware', 60.00, 11, 11, NULL, NULL, 0, NULL, 21.00, 0),
('NTB9EJA3MDBV0', 87, 'Hardware-ry15', 'Hardware', 40.00, 36, 36, NULL, NULL, 0, NULL, 14.00, 0),
('SKN6QGWCXNYAR', 88, 'Bourbon + Coke', 'Cocktails, HAPPY HOUR', 10.00, -8, -8, NULL, NULL, 0, NULL, 44.00, 0),
('9YPCWQ433ADEM', 89, 'WET BUSSY', 'HAPPY HOUR', 10.00, -27, -27, NULL, NULL, 0, NULL, 2.10, 0),
('5A108V8M5M402', 90, 'Gatorade', 'Non-alcohol', 8.00, -25, -25, NULL, NULL, 0, NULL, 1.95, 0),
('1P0WVEJ8D28H8', 91, 'Galliano BLACK Sambuca', 'Spirits', 12.00, -1, -1, NULL, NULL, 0, NULL, 44.00, 0),
('DABFBHYXV85VJ', 92, 'Galliano White Sambuca', 'Spirits', 12.00, -2, -2, NULL, NULL, 0, NULL, 44.00, 0),
('46FZM0QTB3X70', 93, 'GREEN FAIRY', 'Spirits', 18.00, -1, -1, NULL, NULL, 0, NULL, 82.00, 0),
('2MJWAG4XCZ1QR', 94, 'Ball', 'Unassigned', 3.50, -1, -1, NULL, NULL, 0, NULL, 0.00, 0),
('W1WPHSN1F822A', 95, 'Delivery Fee', 'Unassigned', 0.00, 0, 0, NULL, NULL, 0, NULL, 0.00, 0),
('G6MZECGYQH38T', 96, 'COCK XXX PALE ALE', 'Beer', 13.50, 70, 70, NULL, NULL, 0, NULL, 2.95, 0),
('QHQ3Q81ZKZ3KC', 97, 'Hendrix GIN', 'Spirits', 16.00, -4, -4, NULL, NULL, 0, NULL, 78.00, 0)
ON DUPLICATE KEY UPDATE
  `sort_order` = VALUES(`sort_order`),
  `name` = VALUES(`name`),
  `category` = VALUES(`category`),
  `price` = VALUES(`price`),
  `live_clover_stock` = VALUES(`live_clover_stock`),
  `expected_stock` = VALUES(`expected_stock`),
  `bottle_size_ml` = VALUES(`bottle_size_ml`),
  `pour_size_ml` = VALUES(`pour_size_ml`),
  `recipe_deductions` = VALUES(`recipe_deductions`);

INSERT INTO `venue_settings` (`setting_key`, `setting_value`) VALUES
('owned_overheads', JSON_OBJECT('talentCost', 900, 'productionCost', 450, 'marketingCost', 400, 'otherCost', 0, 'merchantFeePct', 1.5)),
('wages_include_super', JSON_OBJECT('enabled', true)),
('fixed_hire_fee', JSON_OBJECT('amount', 5000)),
('sim_cogs_rate', JSON_OBJECT('rate', 22.0)),
('inventory_opening_value', JSON_OBJECT('amount', 3850)),
('inventory_period_sales', JSON_OBJECT('amount', 10000))
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
