import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export function useURLModal<T = Record<string, any>>(modalId: string) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isOpen = searchParams.get('modal') === modalId;

  const modalData = useMemo(() => {
    if (!isOpen) return null;
    
    // Extract URL parameters (excluding 'modal')
    const urlData: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'modal') {
        urlData[key] = value;
      }
    });

    // Extract state data
    const stateData = (location.state as Record<string, any>) || {};
    
    return { ...urlData, ...stateData } as T;
  }, [isOpen, searchParams, location.state]);

  const openModal = useCallback((data?: Record<string, any>) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', modalId);
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && typeof value !== 'object') {
          params.set(key, String(value));
        }
      });
    }
    navigate(`?${params.toString()}`, { state: data });
  }, [navigate, searchParams, modalId]);

  const closeModal = useCallback(() => {
    // Navigating back pops the modal off the history stack naturally
    navigate(-1);
  }, [navigate]);

  return {
    isOpen,
    openModal,
    closeModal,
    modalData
  };
}
