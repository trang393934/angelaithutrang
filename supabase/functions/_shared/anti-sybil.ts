/**
 * Anti-Sybil: Shared helper cho Account Age Gate & Risk-based Actions
 * 
 * Sử dụng trong các edge function thưởng:
 * - analyze-reward-question
 * - analyze-reward-journal
 * - process-community-post
 * - process-share-reward
 * - process-engagement-reward
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AccountAgeGate {
  account_age_days: number;
  reward_multiplier: number;
  max_actions_per_day: number;
  gate_level: 'new' | 'probation' | 'verified';
}

export interface AntiSybilResult {
  allowed: boolean;
  reward_multiplier: number;
  gate_level: string;
  account_age_days: number;
  reason?: string;
  is_suspended: boolean;
  risk_level: 'clear' | 'monitoring' | 'frozen' | 'suspended';
}

/**
 * Kiểm tra tất cả điều kiện chống Sybil cho một user trước khi thưởng.
 * Gộp: Account Age Gate + Suspension Check + Risk Score (nếu có fraud signals gần đây)
 */
export async function checkAntiSybil(
  supabase: SupabaseClient,
  userId: string,
  actionType: string
): Promise<AntiSybilResult> {
  // 1. Kiểm tra đình chỉ
  const { data: isSuspended } = await supabase
    .rpc('is_user_suspended', { _user_id: userId });

  if (isSuspended) {
    return {
      allowed: false,
      reward_multiplier: 0,
      gate_level: 'suspended',
      account_age_days: 0,
      reason: 'Tài khoản đang bị đình chỉ',
      is_suspended: true,
      risk_level: 'suspended',
    };
  }

  // 2. Kiểm tra cổng thời gian tài khoản
  const { data: ageGate, error: ageError } = await supabase
    .rpc('get_account_age_gate', { _user_id: userId });

  if (ageError) {
    console.error('[AntiSybil] Age gate error:', ageError);
    // Fallback: cho phép nhưng giảm 25%
    return {
      allowed: true,
      reward_multiplier: 0.75,
      gate_level: 'unknown',
      account_age_days: 0,
      is_suspended: false,
      risk_level: 'monitoring',
    };
  }

  const gate: AccountAgeGate = ageGate?.[0] || {
    account_age_days: 0,
    reward_multiplier: 0.5,
    max_actions_per_day: 3,
    gate_level: 'new',
  };

  // 3. Kiểm tra số fraud signals chưa xử lý gần đây
  const { count: unresolvedSignals } = await supabase
    .from('pplp_fraud_signals')
    .select('*', { count: 'exact', head: true })
    .eq('actor_id', userId)
    .eq('is_resolved', false)
    .gte('severity', 3);

  let riskLevel: 'clear' | 'monitoring' | 'frozen' | 'suspended' = 'clear';
  let rewardMultiplier = gate.reward_multiplier;

  if (unresolvedSignals && unresolvedSignals >= 3) {
    riskLevel = 'frozen';
    rewardMultiplier = 0; // Đóng băng phần thưởng
  } else if (unresolvedSignals && unresolvedSignals >= 1) {
    riskLevel = 'monitoring';
    rewardMultiplier = Math.min(rewardMultiplier, 0.5); // Giảm tối đa 50%
  }

  console.log(`[AntiSybil] User ${userId.slice(0, 8)}...: age=${gate.account_age_days}d, gate=${gate.gate_level}, risk=${riskLevel}, multiplier=${rewardMultiplier}`);

  return {
    allowed: rewardMultiplier > 0,
    reward_multiplier: rewardMultiplier,
    gate_level: gate.gate_level,
    account_age_days: gate.account_age_days,
    is_suspended: false,
    risk_level: riskLevel,
    reason: rewardMultiplier === 0 
      ? 'Phần thưởng tạm đóng băng do phát hiện hoạt động bất thường' 
      : undefined,
  };
}

/**
 * Áp dụng hệ số Account Age Gate vào phần thưởng
 */
export function applyAgeGateReward(baseReward: number, multiplier: number): number {
  return Math.round(baseReward * multiplier);
}

/**
 * Extract and hash client IP from request headers (for edge functions).
 * Uses x-forwarded-for, cf-connecting-ip, or x-real-ip.
 */
export async function extractIpHash(req: Request): Promise<string | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip");

  if (!ip) return null;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

/**
 * Register device fingerprint + IP hash for a user action.
 * Call this from reward edge functions to feed Sybil detection.
 */
export async function registerDeviceAndIp(
  supabase: SupabaseClient,
  userId: string,
  deviceHash: string | null,
  ipHash: string | null
): Promise<void> {
  try {
    // Register device fingerprint if provided
    if (deviceHash) {
      await supabase.rpc("register_device_fingerprint", {
        _user_id: userId,
        _device_hash: deviceHash,
      });
    }

    // Store IP hash in pplp_fraud_signals if it matches other users
    if (ipHash) {
      // Check if same IP used by different users recently
      const { data: ipUsers } = await supabase
        .from("pplp_device_registry")
        .select("user_id")
        .eq("device_hash", `ip_${ipHash}`)
        .neq("user_id", userId);

      // Upsert IP record
      await supabase
        .from("pplp_device_registry")
        .upsert(
          {
            device_hash: `ip_${ipHash}`,
            user_id: userId,
            usage_count: 1,
            last_seen: new Date().toISOString(),
          },
          { onConflict: "device_hash,user_id" }
        );

      // If same IP used by 2+ other users, create fraud signal
      if (ipUsers && ipUsers.length >= 2) {
        await supabase.from("pplp_fraud_signals").insert({
          actor_id: userId,
          signal_type: "SYBIL",
          severity: ipUsers.length >= 4 ? 4 : 3,
          details: {
            ip_hash: ipHash,
            other_users_count: ipUsers.length,
            reason: `Same IP hash shared with ${ipUsers.length} other accounts`,
          },
          source: "SYSTEM",
        });
      }
    }
  } catch (err) {
    console.error("[AntiSybil] registerDeviceAndIp error:", err);
  }
}
