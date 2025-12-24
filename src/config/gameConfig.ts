/**
 * Game Configuration
 *
 * Central configuration file for game settings
 */

/**
 * Require Native App Mode
 *
 * When true: Game can only be played inside the native mobile app (Android/iOS)
 * When false: Game can be played anywhere including web browsers
 *
 * Default: true (app-only mode for security)
 */
export const REQUIRE_NATIVE_APP = false;

/**
 * Error Logging Mode
 *
 * When true: Logs errors/anomalies to Supabase for debugging
 * When false: No error logging (for production when debugging is not needed)
 *
 * Default: true (enabled for debugging)
 */
export const ENABLE_ERROR_LOGGING = true;

/**
 * Game Configuration Object
 */
export const gameConfig = {
  requireNativeApp: REQUIRE_NATIVE_APP,
  enableErrorLogging: ENABLE_ERROR_LOGGING,
} as const;
