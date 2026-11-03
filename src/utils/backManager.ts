import React, { useEffect } from 'react';

type BackHandler = () => boolean; 

const handlers: BackHandler[] = [];

export const registerBackHandler = (handler: BackHandler) => {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  };
};

export const handleBack = (): boolean => {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) {
      return true;
    }
  }
  return false;
};

export const getHistoryStackDepth = (): number => {
  return handlers.length;
};

export const canGoBack = (): boolean => {
  return handlers.length > 0;
};

export const router = {
  back: (): boolean => {
    return handleBack();
  },
  getStackDepth: (): number => {
    return handlers.length;
  },
  canGoBack: (): boolean => {
    return handlers.length > 0;
  },
  exitApp: (): void => {
    // For Cordova wrappers if present
    if (typeof window !== 'undefined' && (navigator as any)?.app?.exitApp) {
      (navigator as any).app.exitApp();
    } else {
      // For standard PWAs, history.back() exits the app if there's no more history
      // Use setTimeout to allow the current popstate event to finish settling
      setTimeout(() => {
        window.history.back();
      }, 10);
    }
  }
};

export const useBackHandler = (handler: BackHandler, deps: any[] = []) => {
  const handlerRef = React.useRef(handler);
  
  React.useEffect(() => {
    handlerRef.current = handler;
  }, [handler, ...deps]);

  React.useEffect(() => {
    const unregister = registerBackHandler(() => {
      return handlerRef.current();
    });
    return unregister;
  }, []);
};

