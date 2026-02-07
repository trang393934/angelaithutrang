import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Global error safety net ──
// Registered BEFORE React renders to catch browser-extension errors
// (MetaMask inpage.js, WalletConnect, etc.) that would otherwise blank-screen.

window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  const msg = event.reason?.message || String(event.reason || "");
  const stack = event.reason?.stack || "";

  const isWalletError =
    msg.includes("MetaMask") ||
    msg.includes("ethereum") ||
    msg.includes("wallet") ||
    msg.includes("Failed to connect") ||
    stack.includes("inpage.js") ||
    stack.includes("chrome-extension://") ||
    stack.includes("moz-extension://");

  if (isWalletError) {
    console.warn("[Angel AI] Wallet extension rejection caught:", msg);
  }

  // Always prevent – no unhandled rejection should crash the app
  event.preventDefault();
});

// Also catch synchronous errors thrown by extensions
window.addEventListener("error", (event: ErrorEvent) => {
  const src = event.filename || "";
  const msg = event.message || "";

  if (
    src.includes("chrome-extension://") ||
    src.includes("moz-extension://") ||
    msg.includes("MetaMask") ||
    msg.includes("inpage")
  ) {
    console.warn("[Angel AI] Extension error caught:", msg);
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
