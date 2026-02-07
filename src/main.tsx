import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Early global handler for unhandled promise rejections (e.g. MetaMask inpage.js)
// Must be registered BEFORE React renders to catch extension-level errors
window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
  const msg = event.reason?.message || String(event.reason || "");
  const stack = event.reason?.stack || "";
  
  // Catch MetaMask / wallet extension errors that fire from inpage.js
  if (
    msg.includes("MetaMask") ||
    msg.includes("ethereum") ||
    msg.includes("wallet") ||
    stack.includes("inpage.js") ||
    stack.includes("chrome-extension://")
  ) {
    console.warn("[Angel AI] Wallet extension error caught:", msg);
    event.preventDefault(); // Prevent blank screen crash
    return;
  }
  
  // Prevent any other unhandled rejection from crashing the app
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(<App />);
