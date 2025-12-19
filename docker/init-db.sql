-- Initialize all databases

-- Check and create Auth Database
SELECT 'CREATE DATABASE marketplace_auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'marketplace_auth')\gexec

-- Check and create Product Database
SELECT 'CREATE DATABASE marketplace_products'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'marketplace_products')\gexec

-- Check and create Order Database
SELECT 'CREATE DATABASE marketplace_orders'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'marketplace_orders')\gexec

-- Check and create Payment Database
SELECT 'CREATE DATABASE marketplace_payments'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'marketplace_payments')\gexec
