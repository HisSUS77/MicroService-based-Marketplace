-- Seed data for marketplace
-- This creates sample products for testing

-- Connect to products database
\c marketplace_products;

-- Insert sample products
INSERT INTO products (id, name, description, price, stock, seller_id, category, image_url, is_active, created_at) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'MacBook Pro 16"', 'Powerful laptop with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers and creators.', 2499.99, 15, '00000000-0000-0000-0000-000000000001', 'Electronics', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', true, CURRENT_TIMESTAMP),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'iPhone 15 Pro', 'Latest iPhone with A17 Pro chip, stunning camera, and titanium design.', 1199.99, 25, '00000000-0000-0000-0000-000000000001', 'Electronics', 'https://images.unsplash.com/photo-1592286927505-2fd0d9e8253b?w=500', true, CURRENT_TIMESTAMP),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'Sony WH-1000XM5', 'Industry-leading noise canceling headphones with premium sound quality.', 399.99, 40, '00000000-0000-0000-0000-000000000001', 'Electronics', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500', true, CURRENT_TIMESTAMP),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'Samsung 4K Monitor 32"', 'Ultra HD 4K monitor with HDR support, perfect for work and gaming.', 549.99, 20, '00000000-0000-0000-0000-000000000002', 'Electronics', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500', true, CURRENT_TIMESTAMP),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'Mechanical Keyboard RGB', 'Premium mechanical keyboard with Cherry MX switches and RGB lighting.', 159.99, 35, '00000000-0000-0000-0000-000000000002', 'Electronics', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500', true, CURRENT_TIMESTAMP),
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'Logitech MX Master 3', 'Advanced wireless mouse designed for professionals and creators.', 99.99, 50, '00000000-0000-0000-0000-000000000002', 'Electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500', true, CURRENT_TIMESTAMP),
('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'The Art of Programming', 'Comprehensive guide to modern software development and best practices.', 49.99, 100, '00000000-0000-0000-0000-000000000003', 'Books', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500', true, CURRENT_TIMESTAMP),
('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'Clean Code', 'A handbook of agile software craftsmanship by Robert C. Martin.', 39.99, 80, '00000000-0000-0000-0000-000000000003', 'Books', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500', true, CURRENT_TIMESTAMP),
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'Nike Running Shoes', 'Comfortable running shoes with excellent cushioning and support.', 129.99, 60, '00000000-0000-0000-0000-000000000004', 'Clothing', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', true, CURRENT_TIMESTAMP),
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'Adidas Sports T-Shirt', 'Breathable athletic t-shirt perfect for workouts and casual wear.', 29.99, 120, '00000000-0000-0000-0000-000000000004', 'Clothing', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', true, CURRENT_TIMESTAMP),
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'Yoga Mat Premium', 'Eco-friendly yoga mat with excellent grip and cushioning.', 39.99, 75, '00000000-0000-0000-0000-000000000004', 'Sports', 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=500', true, CURRENT_TIMESTAMP),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'Coffee Maker Deluxe', 'Programmable coffee maker with thermal carafe and auto-brew.', 89.99, 30, '00000000-0000-0000-0000-000000000005', 'Home', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500', true, CURRENT_TIMESTAMP),
('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'Instant Pot 6-Quart', 'Multi-use pressure cooker with 7 functions in one appliance.', 99.99, 45, '00000000-0000-0000-0000-000000000005', 'Home', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=500', true, CURRENT_TIMESTAMP),
('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 'Dyson Vacuum V15', 'Powerful cordless vacuum with laser detection and HEPA filtration.', 649.99, 18, '00000000-0000-0000-0000-000000000005', 'Home', 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500', true, CURRENT_TIMESTAMP),
('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'Samsung Smart TV 55"', 'QLED 4K Smart TV with HDR and built-in streaming apps.', 899.99, 12, '00000000-0000-0000-0000-000000000002', 'Electronics', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500', true, CURRENT_TIMESTAMP);

-- Verify insertion
SELECT COUNT(*) as total_products FROM products;
