/**
 * Notification utility for system-level browser notifications
 */

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

export const getNotificationPermissionStatus = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const sendNotification = async (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const defaultOptions: NotificationOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      silent: false,
      ...options
    };

    // Use Service Worker for background notification support if available
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, defaultOptions);
    }

    // Fallback to standard notification
    return new Notification(title, defaultOptions);
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

export const sendWinnerNotification = async (assetSymbol: string, payout: number, title: string, bodyPrefix: string, bodySuffix: string) => {
  const body = `${bodyPrefix} ${assetSymbol} ${bodySuffix} +$${payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  
  return await sendNotification(title, {
    body,
    tag: 'trade-win'
  });
};
