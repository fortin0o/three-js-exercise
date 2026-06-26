import { create } from 'zustand';
import type { ARState, ARMode } from '@/types';

interface ARStore extends ARState {
  setMode: (mode: ARMode) => void;
  setTracking: (tracking: boolean) => void;
  setMarkerFound: (found: boolean) => void;
  setLoading: (loading: boolean) => void;
  setCameraPermission: (perm: ARState['cameraPermission']) => void;
  setGyroPermission: (perm: ARState['gyroPermission']) => void;
  setError: (error: string | null) => void;
}

export const useARStore = create<ARStore>((set) => ({
  mode: 'demo',
  isTracking: false,
  markerFound: false,
  isLoading: true,
  cameraPermission: 'pending',
  gyroPermission: 'pending',
  error: null,

  setMode: (mode) => set({ mode }),
  setTracking: (isTracking) => set({ isTracking }),
  setMarkerFound: (markerFound) => set({ markerFound }),
  setLoading: (isLoading) => set({ isLoading }),
  setCameraPermission: (cameraPermission) => set({ cameraPermission }),
  setGyroPermission: (gyroPermission) => set({ gyroPermission }),
  setError: (error) => set({ error }),
}));
