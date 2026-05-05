-- Run this SQL in your Supabase project's SQL Editor
-- https://app.supabase.com/project/YOUR_PROJECT/sql

-- Create table for monthly grocery items
CREATE TABLE IF NOT EXISTS months (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  month_key TEXT NOT NULL,
  items TEXT NOT NULL DEFAULT '[]',
  budget REAL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_key)
);

-- Create table for catalog items
CREATE TABLE IF NOT EXISTS catalog (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  marathi_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  category TEXT NOT NULL,
  typical_quantity TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for item prices
CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  prices TEXT NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS (Row Level Security) - optional, can be disabled for simple setup
-- ALTER TABLE months ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE catalog ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Allow public access (since we're using simple password auth on the app side)
-- Note: In production, you'd want proper RLS policies

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_months_user_month ON months(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_catalog_user ON catalog(user_id);
CREATE INDEX IF NOT EXISTS idx_prices_user ON prices(user_id);

-- Insert some sample catalog items if empty
INSERT INTO catalog (user_id, marathi_name, english_name, category, typical_quantity)
SELECT 'default_user', name, name_en, category, typical
FROM (
  VALUES
    ('दूध', 'Milk', 'Dairy', '1 liter'),
    ('दही', 'Curd', 'Dairy', '500 gm'),
    ('पनीर', 'Paneer', 'Dairy', '250 gm'),
    ('लोणी', 'Butter', 'Dairy', '100 gm'),
    ('चीज', 'Cheese', 'Dairy', '200 gm'),
    ('शकर', 'Sugar', 'Groceries', '1 kg'),
    ('मीठ', 'Salt', 'Groceries', '1 kg'),
    ('तांदूळ', 'Rice', 'Groceries', '5 kg'),
    ('गहू', 'Wheat', 'Groceries', '5 kg'),
    ('कांदा', 'Onion', 'Vegetables', '1 kg'),
    ('टोमॅटो', 'Tomato', 'Vegetables', '1 kg'),
    ('बटाट', 'Potato', 'Vegetables', '1 kg'),
    ('कॉलर', 'Cauliflower', 'Vegetables', '1 piece'),
    ('मिरची', 'Green Chilli', 'Vegetables', '100 gm'),
    ('लसूण', 'Garlic', 'Vegetables', '100 gm'),
    ('आले', 'Ginger', 'Vegetables', '100 gm'),
    ('केळी', 'Banana', 'Fruits', '1 dozen'),
    ('सफरचंद', 'Orange', 'Fruits', '1 kg'),
    ('आंबा', 'Mango', 'Fruits', '1 kg'),
    ('सोयापीठ', 'Soybeans', 'Groceries', '500 gm'),
    ('चना दाल', 'Chana Dal', 'Groceries', '1 kg'),
    ('मूग दाल', 'Moong Dal', 'Groceries', '1 kg'),
    ('उडीद दाल', 'Urad Dal', 'Groceries', '1 kg'),
    ('तूर दाल', 'Toor Dal', 'Groceries', '1 kg'),
    ('तेल', 'Oil', 'Groceries', '1 liter'),
    ('गूळ', 'Jaggery', 'Groceries', '500 gm'),
    ('चहा', 'Tea', 'Beverages', '250 gm'),
    ('कॉफी', 'Coffee', 'Beverages', '100 gm'),
    ('साबण', 'Soap', 'Household', '4 pieces'),
    ('सरदार', 'Detergent', 'Household', '1 kg'),
    ('टूथपेस्ट', 'Toothpaste', 'Personal Care', '1'),
    ('शॅम्पू', 'Shampoo', 'Personal Care', '1'),
    ('भात', 'Rice (Basmati)', 'Groceries', '5 kg')
) AS t(name, name_en, category, typical)
WHERE NOT EXISTS (SELECT 1 FROM catalog WHERE user_id = 'default_user' LIMIT 1)
ON CONFLICT DO NOTHING;