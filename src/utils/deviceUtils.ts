/**
 * Robust device detection utility to extract detailed info from Navigator User Agent.
 */

export interface DeviceInfo {
  deviceName: string;
  osName: string;
  browserName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export const getDeviceDetails = (): DeviceInfo => {
  const ua = navigator.userAgent;
  let deviceName = "Unknown Device";
  let osName = "Unknown OS";
  let browserName = "Unknown Browser";
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';


  // 1. Detect Browser
  if (ua.includes("Firefox/")) browserName = "Firefox";
  else if (ua.includes("Edg/")) browserName = "Edge";
  else if (ua.includes("Chrome/")) browserName = "Chrome";
  else if (ua.includes("Safari/")) browserName = "Safari";
  else if (ua.includes("MSIE") || ua.includes("Trident/")) browserName = "Internet Explorer";

  // 2. Detect OS & Device Name
  // IMPORTANT: Check desktop OS first before mobile, because some user agents
  // can contain partial mobile strings (e.g. during DevTools emulation)
  if (/Windows NT/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = "คอมพิวเตอร์ (Windows)";
    osName = "Windows";

  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    // iOS 13+ iPhones and iPads can both show "Macintosh" in UA.
    // Differentiate using touch support + screen width.
    if (navigator.maxTouchPoints > 1) {
      // Touch screen + "Macintosh" UA = iOS device in desktop mode
      // Use screen width to separate iPhone (narrow) from iPad (wide)
      const screenWidth = Math.min(screen.width, screen.height); // portrait width
      if (screenWidth <= 430) {
        // Narrow screen → iPhone
        deviceType = 'mobile';
        deviceName = "iPhone";
        osName = "iOS";
      } else {
        // Wide screen → iPad
        deviceType = 'tablet';
        deviceName = "iPad";
        osName = "iPadOS";
      }
    } else {
      deviceName = "คอมพิวเตอร์ (Mac)";
      osName = "macOS";
    }

  } else if (/Linux/i.test(ua) && !/Android/i.test(ua)) {
    deviceType = 'desktop';
    deviceName = "คอมพิวเตอร์ (Linux)";
    osName = "Linux";

  } else if (/Android/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = "มือถือ (Android)";
    osName = "Android";

  } else if (/iPhone|iPod/i.test(ua)) {
    deviceType = 'mobile';
    deviceName = "iPhone";
    osName = "iOS";

  } else if (/iPad/i.test(ua)) {
    deviceType = 'tablet';
    deviceName = "iPad";
    osName = "iOS";
  }

  return { deviceName, osName, browserName, deviceType };
};
