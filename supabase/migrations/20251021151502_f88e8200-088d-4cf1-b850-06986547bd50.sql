-- Ensure trigger exists to populate profiles and roles on user signup
-- 1) Create trigger to call handle_new_user after a new auth user is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

-- 2) Backfill profiles for existing users missing a profile
INSERT INTO public.profiles (user_id, full_name, email)
SELECT u.id,
       COALESCE(u.raw_user_meta_data ->> 'full_name', u.email) AS full_name,
       u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.user_id IS NULL;

-- 3) Backfill admin role for known admin emails if missing
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur 
  ON ur.user_id = u.id AND ur.role = 'admin'::app_role
WHERE ur.user_id IS NULL
  AND lower(u.email) IN ('admin@trion.com', 'admin@trion.store');

-- 4) Optional: ensure has_role runs with correct search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;