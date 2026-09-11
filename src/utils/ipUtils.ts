/**
 * UTILITY: IP Utilities
 * Provides a robust way to fetch the user's public IP address with multiple fallbacks.
 */

const IP_SERVICES = [
  "https://api.ipify.org?format=json",
  "https://icanhazip.com",
  "https://ipapi.co/json/",
  "https://checkip.amazonaws.com"
];

/**
 * Fetches the public IP address of the client using multiple services.
 * If one fails, it tries the next one.
 */
export async function getPublicIP(): Promise<string> {
  for (const service of IP_SERVICES) {
    try {
      const response = await fetch(service, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) continue;

      const data = await response.text();
      
      // Handle JSON response vs plain text
      if (data.startsWith('{')) {
        try {
          const json = JSON.parse(data);
          if (json.ip) return json.ip.trim();
        } catch (e) {
          // Not JSON or missing IP field
        }
      }
      
      const ip = data.trim();
      // Simple Regex to validate IP format
      if (/^(\d{1,3}\.){3}\d{1,3}$|([a-fA-F0-9:]+)$/.test(ip)) {
        return ip;
      }
    } catch (error) {
      console.warn(`[IPUtils] Failed to fetch IP from ${service}:`, error);
    }
  }

  return "Unknown IP";
}
