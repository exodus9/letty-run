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
  
  if (!nativeApp.isNative) {
    console.warn('Not running in native app, cannot send message:', message);
    return;
  }
  
  try {
    // For Android WebView
    if (nativeApp.platform === 'android') {
      if (window.Android && window.Android.receiveMessage) {
        window.Android.receiveMessage(JSON.stringify(message));
      } else {
        console.warn('Android interface not available');
      }
    }
    
    // For iOS WebView
    if (nativeApp.platform === 'ios') {
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeApp) {
        window.webkit.messageHandlers.nativeApp.postMessage(message);
      } else {
        console.warn('iOS WebKit interface not available');
      }
    }
  } catch (error) {
    console.error('Error sending message to native app:', error);
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
 * Notify native app that game has ended and reward hearts
 */
export const notifyGameEnd = (score: number): void => {
  try {
    sendToNative({
      type: 'GAME_END',
      data: {
        score,
        hearts: score, // 받은 점수만큼 하트 지급
        reward: score,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error notifying game end:', error);
  }
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
