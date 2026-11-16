# Trough X Sydney — PHP 8 & MySQL 8 Export

Standalone PHP 8 + MySQL 8 version of the Trough X Venue Programming Calendar & Budget Simulator.

## Setup

1. Import `schema.sql` into your MySQL server:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` environment variables (or update defaults in `config.php`).
3. Run locally with PHP built-in server:
   ```bash
   php -S 0.0.0.0:8080 -t php-mysql-app
   ```
