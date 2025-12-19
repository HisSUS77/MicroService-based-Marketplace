-- Initialize all databases

-- Auth Database
CREATE DATABASE IF NOT EXISTS marketplace_auth;
\c marketplace_auth;

-- Product Database
CREATE DATABASE IF NOT EXISTS marketplace_products;
\c marketplace_products;

-- Order Database
CREATE DATABASE IF NOT EXISTS marketplace_orders;
\c marketplace_orders;

-- Payment Database
CREATE DATABASE IF NOT EXISTS marketplace_payments;
\c marketplace_payments;
