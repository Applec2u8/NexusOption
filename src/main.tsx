import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
// Capture PWA install prompt for Android/Chrome
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome from showing the prompt automatically
  e.preventDefault();
  // Stash the event so it can be triggered later.
  (window as any).deferredPrompt = e;
});

// Register Service Worker for background notifications
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        // console.log('SW registered');
      })
      .catch((registrationError) => {
        console.error("SW registration failed: ", registrationError);
      });
  });
}
