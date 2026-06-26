import { create } from 'zustand';
import type { PartId, ModelState } from '@/types';

interface ModelStore extends ModelState {
  setSelectedPart: (id: PartId | null) => void;
  setAnimating: (animating: boolean, target?: string | null) => void;
  setExploded: (exploded: boolean) => void;
  setExplosionProgress: (progress: number) => void;
  setXRay: (xray: boolean) => void;
  setScale: (scale: number) => void;
  resetModel: () => void;
}

const initialState: ModelState = {
  selectedPartId: null,
  isAnimating: false,
  animationTarget: null,
  isExploded: false,
  explosionProgress: 0,
  isXRay: false,
  rotationSpeed: 0.3,
  scale: 1,
};

export const useModelStore = create<ModelStore>((set) => ({
  ...initialState,

  setSelectedPart: (id) =>
    set({ selectedPartId: id }),

  setAnimating: (animating, target = null) =>
    set({ isAnimating: animating, animationTarget: target }),

  setExploded: (exploded) =>
    set({ isExploded: exploded, explosionProgress: exploded ? 1 : 0 }),

  setExplosionProgress: (progress) =>
    set({ explosionProgress: progress, isExploded: progress > 0 }),

  setXRay: (xray) =>
    set({ isXRay: xray }),

  setScale: (scale) =>
    set({ scale: Math.max(0.3, Math.min(3, scale)) }),

  resetModel: () =>
    set(initialState),
}));
