import { supabase } from "../lib/supabase";

/**
 * Capture/store device info using navigator.userAgent.
 */
export function getDeviceInfo() {
  if (typeof window === "undefined" || !window.navigator) {
    return { browser: "Unknown", platform: "Unknown", deviceName: "Unknown" };
  }
  const ua = navigator.userAgent;
  let browser = "Other";
  let platform = "Other";

  // Simple browser detection
  if (ua.indexOf("Firefox") > -1) {
    browser = "Firefox";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browser = "Samsung Browser";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browser = "Opera";
  } else if (ua.indexOf("Trident") > -1) {
    browser = "Internet Explorer";
  } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
    browser = "Edge";
  } else if (ua.indexOf("Chrome") > -1) {
    browser = "Chrome";
  } else if (ua.indexOf("Safari") > -1) {
    browser = "Safari";
  }

  // Simple platform detection
  if (ua.indexOf("Win") > -1) {
    platform = "Windows";
  } else if (ua.indexOf("Mac") > -1) {
    platform = "macOS";
  } else if (ua.indexOf("X11") > -1) {
    platform = "Linux";
  } else if (ua.indexOf("Linux") > -1) {
    platform = "Linux";
  } else if (ua.indexOf("Android") > -1) {
    platform = "Android";
  } else if (ua.indexOf("iPhone") > -1 || ua.indexOf("iPad") > -1) {
    platform = "iOS";
  }

  // Simple device name
  let deviceName = platform;
  if (/mobile/i.test(ua)) {
    deviceName += " Mobile";
  } else {
    deviceName += " Desktop";
  }

  return { browser, platform, deviceName };
}

/**
 * Validate user's current session limits before allowing entry.
 */
export const validateSessionLimit = async (userId) => {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role, max_sessions")
    .eq("id", userId)
    .maybeSingle();

  if (userError || !user) {
    return { allowed: true, activeCount: 0, maxSessions: 1 };
  }

  const maxSessions = user.max_sessions ?? (user.role === 'admin' ? 2 : 1);

  // Query actual active sessions count from active_sessions table
  const { count, error: countError } = await supabase
    .from("active_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (countError) {
    console.error("Error fetching active sessions count:", countError);
  }

  const activeCount = count ?? 0;

  return {
    allowed: activeCount < maxSessions,
    activeCount,
    maxSessions
  };
};

/**
 * Update the user's active session count in the users table to match the actual active sessions.
 */
export const syncUserActiveSessionCount = async (userId) => {
  if (!userId) return;
  try {
    const { count, error: countError } = await supabase
      .from("active_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);

    if (countError) throw countError;

    const activeCount = count ?? 0;

    await supabase
      .from("users")
      .update({ active_sessions_count: activeCount })
      .eq("id", userId);
  } catch (err) {
    console.error("Error syncing user active session count:", err);
  }
};

/**
 * Revoke the oldest active session for the user to make room for a new login.
 */
export const revokeOldestSession = async (userId) => {
  const { data: oldest, error: fetchError } = await supabase
    .from("active_sessions")
    .select("id, session_token")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("last_activity", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError || !oldest) return;

  await supabase
    .from("active_sessions")
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .eq("id", oldest.id);

  await syncUserActiveSessionCount(userId);
};

/**
 * Create a new session record.
 */
export const createSession = async (userId) => {
  const session_token = crypto.randomUUID();
  const { browser, platform, deviceName } = getDeviceInfo();

  const { error: insertError } = await supabase
    .from("active_sessions")
    .insert({
      user_id: userId,
      session_token,
      device_name: deviceName,
      browser,
      platform,
      is_active: true,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    });

  if (insertError) throw insertError;

  await syncUserActiveSessionCount(userId);

  localStorage.setItem("current_device_session_token", session_token);
  return session_token;
};

/**
 * Periodically updates the active session's activity timestamp.
 */
export const heartbeatSession = async (sessionToken) => {
  if (!sessionToken) return;
  await supabase
    .from("active_sessions")
    .update({ last_activity: new Date().toISOString() })
    .eq("session_token", sessionToken);
};

/**
 * Identifies and disables stale sessions.
 */
export const cleanupInactiveSessions = async () => {
  const staleThreshold = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { data: staleSessions } = await supabase
    .from("active_sessions")
    .select("id, user_id")
    .eq("is_active", true)
    .lt("last_activity", staleThreshold);

  if (!staleSessions || staleSessions.length === 0) return;

  const staleIds = staleSessions.map(s => s.id);
  await supabase
    .from("active_sessions")
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .in("id", staleIds);

  const userIds = [...new Set(staleSessions.map(s => s.user_id))];
  for (const uid of userIds) {
    await syncUserActiveSessionCount(uid);
  }
};

/**
 * Terminate a specific session.
 */
export const logoutSession = async (sessionToken) => {
  if (!sessionToken) return;

  const { data: session } = await supabase
    .from("active_sessions")
    .select("user_id")
    .eq("session_token", sessionToken)
    .maybeSingle();

  await supabase
    .from("active_sessions")
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .eq("session_token", sessionToken);

  if (session?.user_id) {
    await syncUserActiveSessionCount(session.user_id);
  }

  localStorage.removeItem("current_device_session_token");
};

/**
 * Terminate all active sessions for a user.
 */
export const logoutAllSessions = async (userId) => {
  await supabase
    .from("active_sessions")
    .update({ 
      is_active: false,
      last_activity: new Date().toISOString()
    })
    .eq("user_id", userId);

  await syncUserActiveSessionCount(userId);
};

export const validateCurrentSession = async (sessionToken) => {
  if (!sessionToken) return { isValid: false, role: null };
  const { data, error } = await supabase
    .from("active_sessions")
    .select(`
      user_id,
      is_active,
      users (
        approved,
        role
      )
    `)
    .eq("session_token", sessionToken)
    .maybeSingle();

  if (error || !data) return { isValid: false, role: null };

  let isApproved = false;
  let role = null;
  if (data.users) {
    if (Array.isArray(data.users)) {
      isApproved = data.users[0]?.approved === true;
      role = data.users[0]?.role;
    } else {
      isApproved = data.users.approved === true;
      role = data.users.role;
    }
  }

  const isValid = data.is_active === true && isApproved;

  if (data.is_active === true && !isApproved) {
    try {
      await supabase
        .from("active_sessions")
        .update({ 
          is_active: false,
          last_activity: new Date().toISOString()
        })
        .eq("session_token", sessionToken);

      if (data.user_id) {
        await syncUserActiveSessionCount(data.user_id);
      }
    } catch (dbErr) {
      console.error("Error setting unapproved user session to inactive:", dbErr);
    }
  }

  return { isValid, role };
};
