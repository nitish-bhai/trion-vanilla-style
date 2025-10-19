-- Create admin user credentials
-- Password: AdminTrion@2025

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'authenticated',
  'authenticated',
  'admin@trion.store',
  '$2a$10$XoQ3xJZvK6L5yN8W9mP.VeCxW3mJhXv8KwN5QzY2L1xRmN4P5Qz6O',
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  NULL,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert into profiles
INSERT INTO public.profiles (user_id, full_name, email)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Admin User',
  'admin@trion.store'
) ON CONFLICT (user_id) DO NOTHING;

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'admin'::app_role
) ON CONFLICT (user_id, role) DO NOTHING;

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create hero_banners table
CREATE TABLE IF NOT EXISTS public.hero_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT,
  cta_link TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on hero_banners
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- RLS policies for hero_banners
CREATE POLICY "Banners are viewable by everyone"
ON public.hero_banners FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage banners"
ON public.hero_banners FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.categories (name, description, display_order) VALUES
('T-Shirts', 'Comfortable and stylish t-shirts for everyday wear', 1),
('Shirts', 'Formal and casual shirts for all occasions', 2),
('Hoodies', 'Warm and cozy hoodies', 3),
('Dresses', 'Elegant dresses for women', 4),
('Pants', 'Comfortable pants for men and women', 5),
('Jeans', 'Classic denim jeans', 6),
('Shorts', 'Casual shorts for summer', 7),
('Shoes', 'Footwear for all occasions', 8),
('Sneakers', 'Trendy sneakers', 9),
('Watches', 'Stylish timepieces', 10),
('Glasses', 'Fashion eyewear', 11),
('Bags', 'Bags and backpacks', 12)
ON CONFLICT (name) DO NOTHING;