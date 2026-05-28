-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES FOR ADMIN PANEL
-- ============================================================================
-- Apply this SQL in your Supabase SQL Editor.
-- ============================================================================

-- 1. Enable Row Level Security (RLS) on the public.users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create a Security Definer helper function to check if the caller is an approved admin.
-- This function runs with the privileges of the creator (SECURITY DEFINER)
-- which bypasses RLS and avoids infinite recursion loops in table policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SELECT Policy:
-- Allow users to read their own profile, and approved admins to read all profiles.
CREATE POLICY "Allow select for self or admins" 
ON public.users
FOR SELECT
USING (
  auth.uid() = id 
  OR public.is_admin()
);

-- 4. UPDATE Policy:
-- Allow users to update their own profile (e.g. updating last_login timestamp during sign in),
-- and approved admins to update any profile.
-- IMPORTANT: Prevents normal users from self-promoting to 'admin' or self-approving.
CREATE POLICY "Allow update for self or admins" 
ON public.users
FOR UPDATE
USING (
  auth.uid() = id 
  OR public.is_admin()
)
WITH CHECK (
  public.is_admin() 
  OR (
    auth.uid() = id 
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND approved = (SELECT approved FROM public.users WHERE id = auth.uid())
  )
);

-- 5. DELETE Policy:
-- Only approved admins can delete user profiles from public.users table.
CREATE POLICY "Allow delete for admins only" 
ON public.users
FOR DELETE
USING (
  public.is_admin()
);
