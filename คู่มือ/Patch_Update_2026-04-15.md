# Patch Update: 15 April 2026

## 🚀 Fixes & Improvements

### 1. Fix "Logout All Devices" clearing current session history
- **Bug**: Clicking "Logout All Devices" in the Login History was unconditionally deleting all login histories for the user, causing the current active device to disappear from the login history list.
- **Fix**: Modified `clearLoginHistory` in `activityService.ts` to identify the current active session using the provided session ID. The system now cross-checks the current session's signature (Device Name, OS, Browser, IP) and retains its login history record securely while purging all other stale/inactive histories.
- **UI Update**: 
  - The frontend `SettingsContent.tsx` is updated to pass `sessId` to `activityService.clearLoginHistory()`.

### 2. Fix UUID parsing error on login track deletion
- **Bug**: Deleting an individual login history row occasionally caused the database to reject the API call with the error `invalid input syntax for type uuid: "bd2bbbe4"`.
- **Root Cause**: The UUID extraction logic used `.split('-')[1]`. Because UUIDs inherently contain dashes (e.g. `123e4567-e89b-12d3-...`), splitting by dash completely broke the UUID format.
- **Fix**: Replaced the splitting logic with `.slice(3)` in `deleteActivity` (`activityService.ts`), ensuring UUID strings prefixed with `lh-` or `tx-` are properly extracted keeping dashed segments completely intact.

### 3. Responsive UI Enhancements for Login History
- **Bug**: The layout of the Login History items and the "Logout All Devices" header were overlapping, awkwardly wrapping, and truncating text prematurely on mobile screens.
- **Fix**: Refactored the TailwindCSS flexbox and layout classes in `SettingsContent.tsx` to handle responsive wrapping gracefully on all viewports:
  - Ensured the **Logout All Devices** header structure reflows properly into a vertical stack on mobile instead of crushing against the description text.
  - Revamped device item cards to move the metadata (`OS`, `IP`, `Time`) into a structured grid/row beneath the device title, ensuring titles get full width and prevent early truncation.
  - Adjusted the **Logout** button on individual cards to span full width on small screens while retaining standard right-alignment on desktop.

### 4. Support Contact Channels Expansion (Database Schema)
- **Feature**: Expanded the platform's support contact system to allow administrators to manage and toggle visibility for multiple new social media channels.
- **Schema Update**: Added new columns to the `global_settings` table:
  - **New Contact Values**: `contact_whatsapp`, `contact_facebook`, `contact_email`, `contact_discord`
  - **Visibility Toggles**: `phone_enabled`, `line_enabled`, `telegram_enabled`, `whatsapp_enabled`, `facebook_enabled`, `email_enabled`, `discord_enabled` (all default to `true`).
- **File Updated**: The `src/lib/supabase_schema.sql` file was updated to reflect these schema changes for all new installations. Administrators should run this SQL patch in the Supabase SQL Editor to update existing databases.
