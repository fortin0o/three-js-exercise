// ─── Engine Part Types ────────────────────────────────────────
export type PartId = 'piston' | 'crankshaft' | 'valve' | 'cylinder' | 'camshaft' | 'sparkplug';

export interface EnginePart {
  id: PartId;
  name: string;
  category: string;
  function: string;
  status: 'optimal' | 'warning' | 'critical';
  rpm?: string;
  temperature?: string;
  material?: string;
  description: string;
  animationKey?: string;
  color: string;
  position: [number, number, number];
  scale: [number, number, number];
}

// ─── Model State Types ────────────────────────────────────────
export interface ModelState {
  selectedPartId: PartId | null;
  isAnimating: boolean;
  animationTarget: string | null;
  isExploded: boolean;
  explosionProgress: number;
  isXRay: boolean;
  rotationSpeed: number;
  scale: number;
  manualCrank: number;
  engineTime: { current: number };
}

// ─── AR State Types ───────────────────────────────────────────
export type ARMode = 'camera' | 'demo';

export interface ARState {
  mode: ARMode;
  isTracking: boolean;
  markerFound: boolean;
  isLoading: boolean;
  cameraPermission: 'pending' | 'granted' | 'denied';
  gyroPermission: 'pending' | 'granted' | 'denied';
  error: string | null;
}

// ─── Chat Types ───────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  partContext?: PartId | null;
  triggersAnimation?: string | null;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isVoiceActive: boolean;
  isSpeaking: boolean;
  currentInput: string;
}
