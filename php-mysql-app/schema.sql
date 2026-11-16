-- Trough X Sydney — Event Programming & Financial Operating System
-- MySQL 8.0+ / MariaDB 10.6+ Schema & Seed Data

CREATE DATABASE IF NOT EXISTS `troughx_venue`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `troughx_venue`;

-- 1. Forthcoming & Programmed Events
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

-- 3. Venue Operating Settings (Overheads, Fixed Hire Fee, Super Toggle)
CREATE TABLE IF NOT EXISTS `venue_settings` (
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_value` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Baseline Events
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

-- Seed Default IFA Roster
INSERT INTO `roster_items` (`sort_order`, `role`, `headcount`, `hours`, `rate`, `has_super`, `notes`) VALUES
(1, 'Venue Duty Manager', 1, 6.00, 55.00, 1, 'Incident management, licensing compliance, cash reconciliation'),
(2, 'Senior Bartender', 2, 6.00, 45.00, 1, 'Main bar and basement dispensary service'),
(3, 'Licensed Crowd Control', 1, 6.00, 55.00, 0, 'Licensed crowd control & street line management (Contracted Agency)'),
(4, 'Door / Ticket Scanner & Cloak', 1, 6.00, 35.00, 1, 'ID verification, wristbanding, ticket clip & cloakroom accounting'),
(5, 'Cleaning Crew', 1, 6.00, 60.00, 1, 'Bio-wash, floor sanitisation, commercial waste disposal');

-- Seed Default Venue Settings
INSERT INTO `venue_settings` (`setting_key`, `setting_value`) VALUES
('owned_overheads', JSON_OBJECT('talentCost', 900, 'productionCost', 450, 'marketingCost', 400, 'otherCost', 0, 'merchantFeePct', 1.5)),
('wages_include_super', JSON_OBJECT('enabled', true)),
('fixed_hire_fee', JSON_OBJECT('amount', 5000))
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
