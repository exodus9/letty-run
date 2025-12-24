/**
 * Error Logger for debugging game issues
 * Logs events to Supabase - same user/date accumulates in one row
 */

import { supabase } from '@/integrations/supabase/client';
import { getNicknameFromUrlOrStorage } from '@/lib/utils';
import { detectNativeApp } from '@/lib/nativeCommunication';
import { ENABLE_ERROR_LOGGING } from '@/config/gameConfig';

// Event types - errors/anomalies only (always logged)
export type GameEventType =
  | 'countdown_anomaly'      // 카운트다운 음수 등 이상
  | 'game_over_unexpected'   // 예기치 않은 게임 종료 (3초쯤 종료 등)
  | 'state_anomaly'          // 게임 상태 이상
  | 'error';                 // 기타 에러

// Game state snapshot (minimal)
export interface GameStateSnapshot {
  gameStarted: boolean;
  gameOver: boolean;
  countdown: number | null;
  timeLeft: number;
  score: number;
}

// Single event structure
export interface GameEvent {
  type: GameEventType;
  message: string;
  state: GameStateSnapshot | null;
  timestamp: string;
  sessionId: string;
}

// Device info structure
export interface DeviceInfo {
  platform: 'android' | 'ios' | 'web';
  isNative: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  language: string;
  timezone: string;
  // Browser info
  browserName: string;
  browserVersion: string;
  // OS info
  osName: string;
  osVersion: string;
  // Device type
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

// Parse browser info from user agent
const parseBrowserInfo = (ua: string): { name: string; version: string } => {
  const browsers = [
    { name: 'Samsung Browser', regex: /SamsungBrowser\/(\d+\.?\d*)/ },
    { name: 'Chrome', regex: /Chrome\/(\d+\.?\d*)/ },
    { name: 'Safari', regex: /Version\/(\d+\.?\d*).*Safari/ },
    { name: 'Firefox', regex: /Firefox\/(\d+\.?\d*)/ },
    { name: 'Edge', regex: /Edg\/(\d+\.?\d*)/ },
    { name: 'Opera', regex: /OPR\/(\d+\.?\d*)/ },
  ];

  for (const browser of browsers) {
    const match = ua.match(browser.regex);
    if (match) {
      return { name: browser.name, version: match[1] };
    }
  }
  return { name: 'Unknown', version: 'Unknown' };
};

// Parse OS info from user agent
const parseOSInfo = (ua: string): { name: string; version: string } => {
  if (/Android (\d+\.?\d*)/.test(ua)) {
    const match = ua.match(/Android (\d+\.?\d*)/);
    return { name: 'Android', version: match?.[1] || 'Unknown' };
  }
  if (/iPhone OS (\d+_?\d*)/.test(ua)) {
    const match = ua.match(/iPhone OS (\d+_?\d*)/);
    return { name: 'iOS', version: match?.[1]?.replace('_', '.') || 'Unknown' };
  }
  if (/iPad.*OS (\d+_?\d*)/.test(ua)) {
    const match = ua.match(/OS (\d+_?\d*)/);
    return { name: 'iPadOS', version: match?.[1]?.replace('_', '.') || 'Unknown' };
  }
  if (/Mac OS X (\d+[._]?\d*)/.test(ua)) {
    const match = ua.match(/Mac OS X (\d+[._]?\d*)/);
    return { name: 'macOS', version: match?.[1]?.replace('_', '.') || 'Unknown' };
  }
  if (/Windows NT (\d+\.?\d*)/.test(ua)) {
    const match = ua.match(/Windows NT (\d+\.?\d*)/);
    const ntVersion = match?.[1] || '';
    const winVersion = ntVersion === '10.0' ? '10/11' : ntVersion === '6.3' ? '8.1' : ntVersion === '6.2' ? '8' : ntVersion;
    return { name: 'Windows', version: winVersion };
  }
  if (/Linux/.test(ua)) {
    return { name: 'Linux', version: 'Unknown' };
  }
  return { name: 'Unknown', version: 'Unknown' };
};

// Detect device type
const detectDeviceType = (ua: string, screenWidth: number): 'mobile' | 'tablet' | 'desktop' => {
  const isMobile = /iPhone|Android.*Mobile|webOS|BlackBerry|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);

  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  if (screenWidth < 768) return 'mobile';
  if (screenWidth < 1024) return 'tablet';
  return 'desktop';
};

// Get today's date string (YYYY-MM-DD)
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Session ID for current game session
let currentSessionId: string | null = null;

export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  currentSessionId = `${timestamp}-${random}`;
  return currentSessionId;
};

export const getSessionId = (): string => {
  if (!currentSessionId) {
    generateSessionId();
  }
  return currentSessionId!;
};

export const resetSessionId = (): void => {
  currentSessionId = null;
};

// Log buffer for batching (prevent race conditions)
let logBuffer: GameEvent[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
const FLUSH_DELAY_MS = 2000; // Flush every 2 seconds

// Get comprehensive device info
const getDeviceInfo = (): DeviceInfo => {
  const nativeInfo = detectNativeApp();
  const ua = navigator.userAgent;
  const browserInfo = parseBrowserInfo(ua);
  const osInfo = parseOSInfo(ua);
  const screenWidth = window.innerWidth;

  return {
    platform: nativeInfo.platform,
    isNative: nativeInfo.isNative,
    userAgent: ua,
    screenWidth,
    screenHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browserName: browserInfo.name,
    browserVersion: browserInfo.version,
    osName: osInfo.name,
    osVersion: osInfo.version,
    deviceType: detectDeviceType(ua, screenWidth),
  };
};

/**
 * Flush buffered logs to Supabase
 */
const flushLogs = async (): Promise<void> => {
  if (isFlushing || logBuffer.length === 0) return;

  isFlushing = true;
  const eventsToFlush = [...logBuffer];
  logBuffer = [];

  const playerName = getNicknameFromUrlOrStorage() || 'anonymous';
  const logDate = getTodayDate();
  const deviceInfo = getDeviceInfo();

  try {
    // Check if row exists for this player and date
    const { data: existing } = await supabase
      .from('game_logs')
      .select('id, events')
      .eq('player_name', playerName)
      .eq('log_date', logDate)
      .single();

    if (existing) {
      // Append all buffered events to existing events array
      const updatedEvents = [...(existing.events || []), ...eventsToFlush];

      await supabase
        .from('game_logs')
        .update({
          events: updatedEvents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new row with device info
      await supabase
        .from('game_logs')
        .insert({
          player_name: playerName,
          log_date: logDate,
          events: eventsToFlush,
          platform: deviceInfo.platform,
          is_native: deviceInfo.isNative,
          user_agent: deviceInfo.userAgent,
          screen_width: deviceInfo.screenWidth,
          screen_height: deviceInfo.screenHeight,
          device_pixel_ratio: deviceInfo.devicePixelRatio,
          language: deviceInfo.language,
          timezone: deviceInfo.timezone,
          browser_name: deviceInfo.browserName,
          browser_version: deviceInfo.browserVersion,
          os_name: deviceInfo.osName,
          os_version: deviceInfo.osVersion,
          device_type: deviceInfo.deviceType,
        });
    }
  } catch (err) {
    console.error('[ErrorLogger] Failed to flush logs:', err);
    // Re-add failed events back to buffer (limited to prevent memory issues)
    if (logBuffer.length < 50) {
      logBuffer = [...eventsToFlush, ...logBuffer];
    }
  } finally {
    isFlushing = false;
  }
};

/**
 * Schedule a flush with debouncing
 */
const scheduleFlush = (): void => {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushLogs();
  }, FLUSH_DELAY_MS);
};

/**
 * Log a game event - buffers events and flushes periodically
 * Only error/anomaly events are logged
 * Can be disabled via ENABLE_ERROR_LOGGING in gameConfig
 */
export const logGameEvent = (
  eventType: GameEventType,
  message: string,
  gameState?: Partial<GameStateSnapshot> | null
): void => {
  // Skip logging if disabled in config
  if (!ENABLE_ERROR_LOGGING) return;

  const newEvent: GameEvent = {
    type: eventType,
    message,
    state: gameState ? {
      gameStarted: gameState.gameStarted ?? false,
      gameOver: gameState.gameOver ?? false,
      countdown: gameState.countdown ?? null,
      timeLeft: gameState.timeLeft ?? 0,
      score: gameState.score ?? 0,
    } : null,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };

  // Console log for debugging
  console.log(`[GameLog:${eventType}]`, message, gameState);

  // Add to buffer
  logBuffer.push(newEvent);

  // Schedule flush (debounced)
  scheduleFlush();
};

// Flush logs on page unload to ensure no data loss
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    // Try to flush remaining logs (may not complete if page closes quickly)
    flushLogs();
  });
}

/**
 * Log error (always logs, higher priority)
 */
export const logError = (
  message: string,
  gameState?: Partial<GameStateSnapshot> | null
) => logGameEvent('error', message, gameState);

/**
 * Log countdown anomaly
 */
export const logCountdownAnomaly = (
  countdown: number,
  gameState?: Partial<GameStateSnapshot> | null
) => logGameEvent('countdown_anomaly', `Countdown anomaly: ${countdown}`, gameState);

/**
 * Log unexpected game over
 */
export const logUnexpectedGameOver = (
  reason: string,
  gameState?: Partial<GameStateSnapshot> | null
) => logGameEvent('game_over_unexpected', `Unexpected game over: ${reason}`, gameState);

/**
 * Log state anomaly
 */
export const logStateAnomaly = (
  anomaly: string,
  gameState?: Partial<GameStateSnapshot> | null
) => logGameEvent('state_anomaly', anomaly, gameState);

/**
 * Check and log any state anomalies
 */
export const checkAndLogAnomalies = (state: Partial<GameStateSnapshot>): void => {
  if (!ENABLE_ERROR_LOGGING) return;

  // Anomaly 1: countdown is negative
  if (state.countdown !== null && state.countdown !== undefined && state.countdown < 0) {
    logCountdownAnomaly(state.countdown, state);
  }

  // Anomaly 2: game over but game not started
  if (state.gameOver && !state.gameStarted) {
    logStateAnomaly('Game over without game started', state);
  }

  // Anomaly 3: timeLeft is 0 without gameOver while game started
  if (state.gameStarted && state.timeLeft === 0 && !state.gameOver) {
    logStateAnomaly('TimeLeft=0 but gameOver not set', state);
  }
};
