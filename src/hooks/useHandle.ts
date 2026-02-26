import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HandleCheckResult {
  available: boolean;
  reason?: string;
  suggestions: string[];
}

const HANDLE_STRICT_REGEX = /^(?=.{3,20}$)[a-z0-9]+(?:_[a-z0-9]+)*$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;

// Reserved system routes — cannot be used as handles
const RESERVED_ROUTES = new Set([
  'chat', 'about', 'auth', 'admin', 'community', 'earn', 'profile',
  'onboarding', 'swap', 'knowledge', 'mint', 'messages', 'notifications',
  'docs', 'bounty', 'ideas', 'vision', 'receipt', 'coordinator-gate',
  'content-writer', 'activity-history', 'community-questions', 'user',
  'post', 'video', 'live', 'index', 'api', 'settings', 'search',
]);
const COOLDOWN_DAYS = 30;

function normalizeHandle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, MAX_LENGTH);
}

function validateHandle(handle: string): { valid: boolean; error?: string } {
  if (!handle) return { valid: false, error: "Vui lòng nhập handle" };
  if (handle.length < MIN_LENGTH) return { valid: false, error: `Tối thiểu ${MIN_LENGTH} ký tự` };
  if (handle.length > MAX_LENGTH) return { valid: false, error: `Tối đa ${MAX_LENGTH} ký tự` };
  if (RESERVED_ROUTES.has(handle.toLowerCase())) return { valid: false, error: "Tên này đã được hệ thống sử dụng" };
  if (!HANDLE_STRICT_REGEX.test(handle)) return { valid: false, error: "Chỉ cho phép chữ thường, số và dấu _ (không bắt đầu/kết thúc bằng _, không __ liên tiếp)" };
  return { valid: true };
}

function generateSuggestions(baseName: string): string[] {
  const clean = baseName.replace(/[^a-z0-9]/g, "").slice(0, 20);
  if (!clean) return [];
  
  const suggestions: string[] = [];
  
  // Simple variations
  suggestions.push(`${clean}_1`);
  suggestions.push(`${clean}_2`);
  suggestions.push(`${clean}01`);
  suggestions.push(`${clean}_fun`);
  
  // With random short digits
  const rand2 = Math.floor(Math.random() * 90 + 10);
  const rand3 = Math.floor(Math.random() * 900 + 100);
  suggestions.push(`${clean}${rand2}`);
  suggestions.push(`${clean}_${rand3}`);
  
  // Filter valid handles
  return suggestions
    .map(s => normalizeHandle(s))
    .filter(s => validateHandle(s).valid)
    .slice(0, 5);
}

export function useHandle() {
  const { user } = useAuth();
  const [handle, setHandle] = useState("");
  const [currentHandle, setCurrentHandle] = useState<string | null>(null);
  const [handleUpdatedAt, setHandleUpdatedAt] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<HandleCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current handle
  useEffect(() => {
    if (!user) return;
    
    const loadHandle = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("handle, handle_updated_at")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (data) {
        setCurrentHandle(data.handle || null);
        setHandleUpdatedAt(data.handle_updated_at || null);
        if (data.handle) {
          setHandle(data.handle);
        }
      }
    };
    
    loadHandle();
  }, [user]);

  const canChangeHandle = useCallback(() => {
    // First time setting handle: no cooldown
    if (!currentHandle) return true;
    if (!handleUpdatedAt) return true;
    const updatedAt = new Date(handleUpdatedAt);
    const cooldownEnd = new Date(updatedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    return new Date() >= cooldownEnd;
  }, [currentHandle, handleUpdatedAt]);

  const daysUntilChange = useCallback(() => {
    if (!currentHandle || !handleUpdatedAt) return 0;
    const updatedAt = new Date(handleUpdatedAt);
    const cooldownEnd = new Date(updatedAt.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
    const diff = cooldownEnd.getTime() - Date.now();
    return diff <= 0 ? 0 : Math.ceil(diff / (24 * 60 * 60 * 1000));
  }, [currentHandle, handleUpdatedAt]);

  // Check handle availability
  const checkAvailability = useCallback(async (handleToCheck: string) => {
    if (!handleToCheck) {
      setCheckResult(null);
      return;
    }
    
    const validation = validateHandle(handleToCheck);
    if (!validation.valid) {
      setValidationError(validation.error || null);
      setCheckResult(null);
      return;
    }
    
    setValidationError(null);
    setIsChecking(true);
    
    try {
      // Check reserved words
      const { data: reserved } = await supabase
        .from("reserved_handles")
        .select("word")
        .eq("word", handleToCheck.toLowerCase())
        .maybeSingle();
      
      if (reserved) {
        const suggestions = generateSuggestions(handleToCheck);
        // Check which suggestions are available
        const availableSuggestions = await filterAvailableSuggestions(suggestions);
        setCheckResult({
          available: false,
          reason: "Tên này đã được hệ thống giữ lại",
          suggestions: availableSuggestions,
        });
        setIsChecking(false);
        return;
      }
      
      // Check if already taken by another user
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("handle", handleToCheck)
        .maybeSingle();
      
      if (existing && existing.user_id !== user?.id) {
        const suggestions = generateSuggestions(handleToCheck);
        const availableSuggestions = await filterAvailableSuggestions(suggestions);
        setCheckResult({
          available: false,
          reason: "Tên link này đã có người sử dụng",
          suggestions: availableSuggestions,
        });
      } else {
        setCheckResult({
          available: true,
          suggestions: [],
        });
      }
    } catch (error) {
      console.error("Handle check error:", error);
      setCheckResult(null);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  // Filter suggestions to only available ones
  const filterAvailableSuggestions = async (suggestions: string[]): Promise<string[]> => {
    if (suggestions.length === 0) return [];
    
    // Check reserved words
    const { data: reservedData } = await supabase
      .from("reserved_handles")
      .select("word")
      .in("word", suggestions);
    
    const reservedSet = new Set((reservedData || []).map(r => r.word));
    
    // Check taken handles
    const { data: takenData } = await supabase
      .from("profiles")
      .select("handle")
      .in("handle", suggestions);
    
    const takenSet = new Set((takenData || []).map(t => t.handle?.toLowerCase()));
    
    return suggestions.filter(s => !reservedSet.has(s) && !takenSet.has(s.toLowerCase()));
  };

  // Debounced handle input change
  const handleInputChange = useCallback((value: string) => {
    const normalized = normalizeHandle(value);
    setHandle(normalized);
    setCheckResult(null);
    setValidationError(null);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (normalized.length >= MIN_LENGTH) {
      debounceRef.current = setTimeout(() => {
        checkAvailability(normalized);
      }, 500);
    }
  }, [checkAvailability]);

  // Claim handle
  const claimHandle = useCallback(async (handleToClaim?: string): Promise<boolean> => {
    const targetHandle = handleToClaim || handle;
    if (!user || !targetHandle) return false;
    
    const validation = validateHandle(targetHandle);
    if (!validation.valid) return false;
    
    if (currentHandle && !canChangeHandle()) return false;
    
    setIsClaiming(true);
    
    try {
      const oldHandle = currentHandle;
      
      const { error } = await supabase
        .from("profiles")
        .update({
          handle: targetHandle,
          handle_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      
      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          setCheckResult({
            available: false,
            reason: "Tên link này vừa bị người khác chọn",
            suggestions: await filterAvailableSuggestions(generateSuggestions(targetHandle)),
          });
          return false;
        }
        throw error;
      }
      
      // Log to audit
      await supabase.from("handle_audit_log").insert({
        user_id: user.id,
        old_handle: oldHandle,
        new_handle: targetHandle,
        source: currentHandle ? "settings" : "signup",
      });
      
      setCurrentHandle(targetHandle);
      setHandleUpdatedAt(new Date().toISOString());
      setHandle(targetHandle);
      setCheckResult({ available: true, suggestions: [] });
      
      return true;
    } catch (error) {
      console.error("Claim handle error:", error);
      return false;
    } finally {
      setIsClaiming(false);
    }
  }, [user, handle, currentHandle, canChangeHandle, filterAvailableSuggestions]);

  // Select a suggestion
  const selectSuggestion = useCallback((suggestion: string) => {
    setHandle(suggestion);
    setValidationError(null);
    checkAvailability(suggestion);
  }, [checkAvailability]);

  return {
    handle,
    currentHandle,
    checkResult,
    isChecking,
    isClaiming,
    validationError,
    canChangeHandle: canChangeHandle(),
    daysUntilChange: daysUntilChange(),
    handleInputChange,
    claimHandle,
    selectSuggestion,
    normalizeHandle,
  };
}
