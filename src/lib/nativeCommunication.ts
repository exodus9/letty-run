/**
 * Native app communication utilities for webview integration
 */

export interface NativeMessage {
  type: 'GAME_START_REQUEST' | 'GAME_START_APPROVED' | 'GAME_PAUSE' | 'GAME_RESUME' | 'GAME_END' | 'ACTIVATE_START_BUTTON' | 'BACK_BUTTON_PRESSED';
  data?: Record<string, unknown>;
}

export interface NativeAppInfo {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  version?: string;
}

/**
 * Detect if running in native app webview or localhost
 */
export const detectNativeApp = (): NativeAppInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  const hostname = window.location.hostname;

  // Check for localhost
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');

  // Check for Android WebView
  const isAndroidWebView = userAgent.includes('wv') && userAgent.includes('android');

  // Check for iOS WebView (WKWebView or UIWebView)
  const isIOSWebView = userAgent.includes('iphone') || userAgent.includes('ipad');

  if (isAndroidWebView) {
    return {
      isNative: true,
      platform: 'android'
    };
  }

  if (isIOSWebView) {
    return {
      isNative: true,
      platform: 'ios'
    };
  }

  if (isLocalhost) {
    return {
      isNative: true,
      platform: 'web'
    };
  }

  // Check if native interface is available even if not detected by user agent
  if (window.Android?.receiveMessage) {
    return {
      isNative: true,
      platform: 'android'
    };
  }

  if (window.webkit?.messageHandlers?.nativeApp) {
    return {
      isNative: true,
      platform: 'ios'
    };
  }

  return {
    isNative: false,
    platform: 'web'
  };
};

/**
 * Send message to native app
 */
export const sendToNative = (message: NativeMessage): void => {
  const nativeApp = detectNativeApp();
  const userAgent = navigator.userAgent;
  const hostname = window.location.hostname;

  try {
    alert(`[sendToNative] platform: ${nativeApp.platform}, isNative: ${nativeApp.isNative}\nhostname: ${hostname}\nhasAndroid: ${!!window.Android}\nhasWebkit: ${!!window.webkit?.messageHandlers?.nativeApp}`);
  } catch (e) {
    // ignore
  }

  if (!nativeApp.isNative) {
    try {
      alert(`[sendToNative] NOT native! userAgent: ${userAgent.substring(0, 100)}`);
    } catch (e) {
      // ignore
    }
    return;
  }

  try {
    // For Android WebView
    if (nativeApp.platform === 'android') {
      if (window.Android && window.Android.receiveMessage) {
        const jsonMessage = JSON.stringify(message);
        alert(`[sendToNative] Sending to Android: ${jsonMessage}`);
        window.Android.receiveMessage(jsonMessage);
        alert('[sendToNative] Android message sent!');
      } else {
        alert('[sendToNative] Android interface not available!');
      }
    }

    // For iOS WebView
    if (nativeApp.platform === 'ios') {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeApp) {
        alert(`[sendToNative] Sending to iOS: ${JSON.stringify(message)}`);
        window.webkit.messageHandlers.nativeApp.postMessage(message);
        alert('[sendToNative] iOS message sent!');
      } else {
        alert('[sendToNative] iOS interface not available!');
      }
    }
  } catch (error) {
    alert(`[sendToNative] ERROR: ${error}`);
  }
};

/**
 * Listen for messages from native app
 */
export const listenToNative = (callback: (message: NativeMessage) => void): (() => void) => {
  const handleMessage = (event: MessageEvent) => {
    try {
      const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (message && typeof message === 'object' && message.type) {
        callback(message);
      }
    } catch (error) {
      console.error('Error parsing native message:', error);
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('message', handleMessage);
  };
};

/**
 * Request game start from native app
 */
export const requestGameStart = (): void => {
  sendToNative({
    type: 'GAME_START_REQUEST',
    data: {
      timestamp: Date.now()
    }
  });
};

/**
 * Get log_heart_id from URL parameter
 */
const getLogHeartIdFromUrl = (): string | null => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("log_heart_id");
  } catch (e) {
    return null;
  }
};

/**
 * Notify native app that game has ended
 */
export const notifyGameEnd = (score: number): void => {
  const logHeartId = getLogHeartIdFromUrl();

  const message = {
    type: 'GAME_END' as const,
    data: {
      score,
      log_heart_id: logHeartId,
      timestamp: Date.now()
    }
  };

  try {
    alert(`[GAME_END] score: ${score}, log_heart_id: ${logHeartId}, message: ${JSON.stringify(message)}`);
  } catch (e) {
    // ignore
  }

  sendToNative(message);
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Android?: {
      receiveMessage: (message: string) => void;
    };
    webkit?: {
      messageHandlers?: {
        nativeApp?: {
          postMessage: (message: NativeMessage) => void;
        };
      };
    };
  }
}
