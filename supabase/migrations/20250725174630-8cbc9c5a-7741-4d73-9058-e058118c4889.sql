-- First, let's create an admin user manually by inserting the profile and role
-- This assumes the user will sign up with admin@trion.com and password admin123

-- Insert admin profile (the user will sign up first, then we'll assign admin role)
INSERT INTO public.profiles (user_id, full_name, email)
SELECT 
  id,
  'Admin User',
  'admin@trion.com'
FROM auth.users 
WHERE email = 'admin@trion.com'
ON CONFLICT (user_id) DO NOTHING;

-- Assign admin role to the admin user
INSERT INTO public.user_roles (user_id, role)
SELECT 
  id,
  'admin'::app_role
FROM auth.users 
WHERE email = 'admin@trion.com'
ON CONFLICT (user_id, role) DO NOTHING;