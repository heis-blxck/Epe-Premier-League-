import { useEffect } from 'react';

type BackHandler = () => boolean; 

const handlers: BackHandler[] = [];

export const registerBackHandler = (handler: BackHandler) => {
  handlers.push(handler);
  return () => {
    const index = handlers.indexOf(handler);
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

export const canGoBack = (): boolean => {
  return handlers.length > 0;
};

export const useBackHandler = (handler: BackHandler, deps: any[] = []) => {
  useEffect(() => {
    const unregister = registerBackHandler(handler);
    return unregister;
  }, deps);
};
