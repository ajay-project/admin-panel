import { supabase } from "../lib/supabase";

/**
 * Fetches the capacity statistics from the database using a security-definer RPC function.
 * If the RPC fails (e.g. not created yet), it falls back to direct table queries.
 */
export const getPlatformCapacityStatus = async () => {
  try {
    const { data, error } = await supabase.rpc("get_platform_capacity_status");

    if (error) {
      // If RPC is missing or fails, throw to trigger fallback
      throw error;
    }

    const stats = data && data[0];
    return {
      max_allowed_users: stats?.max_allowed_users ?? 0,
      total_registered_users: stats?.total_registered_users ?? 0,
      is_available: stats?.is_available ?? true,
      used_rpc: true
    };
  } catch (rpcError) {
    console.warn("RPC function get_platform_capacity_status failed or not found. Falling back to direct queries...", rpcError);
    
    // Fallback: query tables directly (subject to RLS)
    try {
      // 1. Get max capacity
      const { data: settingsData } = await supabase
        .from("platform_settings")
        .select("max_allowed_users")
        .eq("id", 1)
        .maybeSingle();

      const max = settingsData?.max_allowed_users ?? 0;

      // 2. Count registered users
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      const total = count ?? 0;

      // Safe fallback logic: If max capacity is 0 or less (likely due to RLS blocking or missing configuration),
      // we default availability to true so we do not lock users out of registration.
      const isAvailable = max <= 0 ? true : total < max;

      return {
        max_allowed_users: max,
        total_registered_users: total,
        is_available: isAvailable,
        used_rpc: false
      };
    } catch (fallbackError) {
      console.error("Platform capacity fallback queries also failed:", fallbackError);
      return {
        max_allowed_users: 0,
        total_registered_users: 0,
        is_available: true,
        used_rpc: false
      };
    }
  }
};

/**
 * Fetches the maximum allowed users from public.platform_settings.
 * @returns {Promise<number>} max_allowed_users
 */
export const getPlatformCapacity = async () => {
  const stats = await getPlatformCapacityStatus();
  return stats.max_allowed_users;
};

/**
 * Counts all rows inside public.users.
 * @returns {Promise<number>} totalUsers
 */
export const getRegisteredUserCount = async () => {
  const stats = await getPlatformCapacityStatus();
  return stats.total_registered_users;
};

/**
 * Returns remaining user slots.
 * @returns {Promise<number>} remainingSlots
 */
export const getRemainingSlots = async () => {
  const stats = await getPlatformCapacityStatus();
  return Math.max(0, stats.max_allowed_users - stats.total_registered_users);
};

/**
 * Checks if total users is less than max allowed users.
 * @returns {Promise<boolean>} isCapacityAvailable
 */
export const isCapacityAvailable = async () => {
  const stats = await getPlatformCapacityStatus();
  return stats.is_available;
};
