/**
 * Device Fingerprint — Client-side device identification for anti-Sybil detection.
 * Generates a stable hash from canvas, screen, timezone, language, UA, and WebGL info.
 * This hash is sent to the server to detect multiple accounts on the same device.
 */

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";

    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("AngelAI🌟", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("FP", 4, 17);

    return canvas.toDataURL();
  } catch {
    return "canvas-error";
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) return "no-webgl";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "no-debug-info";

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    return `${vendor}|${renderer}`;
  } catch {
    return "webgl-error";
  }
}

function getScreenFingerprint(): string {
  const s = window.screen;
  return [
    s.width,
    s.height,
    s.colorDepth,
    s.pixelDepth,
    window.devicePixelRatio || 1,
  ].join("|");
}

function getTimezoneFingerprint(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return String(new Date().getTimezoneOffset());
  }
}

function getPlatformFingerprint(): string {
  const nav = navigator;
  return [
    nav.userAgent,
    nav.language,
    nav.languages?.join(",") || "",
    nav.hardwareConcurrency || 0,
    (nav as any).deviceMemory || 0,
    nav.maxTouchPoints || 0,
    nav.platform || "",
  ].join("|");
}

/**
 * Generate a stable device fingerprint hash.
 * The hash is deterministic for the same device/browser combination.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    getScreenFingerprint(),
    getTimezoneFingerprint(),
    getPlatformFingerprint(),
  ];

  const raw = components.join("|||");
  return sha256(raw);
}

// Cache the fingerprint in sessionStorage to avoid recalculating
let cachedFingerprint: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const stored = sessionStorage.getItem("_dfp");
    if (stored) {
      cachedFingerprint = stored;
      return stored;
    }
  } catch {
    // sessionStorage not available
  }

  const fp = await generateDeviceFingerprint();
  cachedFingerprint = fp;

  try {
    sessionStorage.setItem("_dfp", fp);
  } catch {
    // ignore
  }

  return fp;
}
