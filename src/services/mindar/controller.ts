'use client';

// MindAR window globals
declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Controller: any;
        Compiler: any;
        UI: any;
      };
    };
  }
}

export interface ARDetectionState {
  isLoaded: boolean;
  markerFound: boolean;
  cameraMatrix: Float32Array | null;
  projectionMatrix: Float32Array | null;
  error: string | null;
}

type Listener = (state: ARDetectionState) => void;

const STATE: ARDetectionState = {
  isLoaded: false,
  markerFound: false,
  cameraMatrix: null,
  projectionMatrix: null,
  error: null,
};

let listeners: Listener[] = [];

function notify(s: ARDetectionState) {
  listeners.forEach(l => l(s));
}

export function subscribeAR(cb: Listener) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export function getARState(): ARDetectionState {
  return { ...STATE };
}

let controller: any = null;
let videoEl: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;

export function getARVideoElement(): HTMLVideoElement | null {
  return videoEl;
}

export function getARStream(): MediaStream | null {
  return stream;
}

export async function startAR(markerUrl: string = '/ar/marker.mind'): Promise<{ projectionMatrix: Float32Array }> {
  if (!window.MINDAR?.IMAGE) {
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/mindar/mindar-image.prod.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load MindAR'));
      document.head.appendChild(s);
    });
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
  });

  // Create hidden video for MindAR processing
  videoEl = document.createElement('video');
  videoEl.srcObject = stream;
  videoEl.setAttribute('autoplay', '');
  videoEl.setAttribute('muted', '');
  videoEl.setAttribute('playsinline', '');
  videoEl.style.display = 'none';
  document.body.appendChild(videoEl);
  await videoEl.play();

  const { Controller } = window.MINDAR!.IMAGE!;
  controller = new Controller({
    inputWidth: videoEl.videoWidth,
    inputHeight: videoEl.videoHeight,
    maxTrack: 1,
    warmupTolerance: 3,
    missTolerance: 3,
  });

  const resp = await fetch(markerUrl);
  const buf = await resp.arrayBuffer();
  controller.addImageTargetsFromBuffer(buf);

  controller.onUpdate = (data: any) => {
    if (data.type === 'updateMatrix') {
      STATE.isLoaded = true;
      STATE.markerFound = !!data.worldMatrix;
      STATE.cameraMatrix = data.worldMatrix ? new Float32Array(data.worldMatrix) : null;
      notify({ ...STATE });
    }
  };

  controller.dummyRun(videoEl);

  STATE.isLoaded = true;
  STATE.projectionMatrix = new Float32Array(controller.getProjectionMatrix());
  notify({ ...STATE });

  controller.processVideo(videoEl);

  return { projectionMatrix: STATE.projectionMatrix! };
}

export function stopAR() {
  controller?.stopProcessVideo();
  controller = null;
  videoEl?.remove();
  videoEl = null;
  stream?.getTracks().forEach(t => t.stop());
  stream = null;

  Object.assign(STATE, { isLoaded: false, markerFound: false, cameraMatrix: null, projectionMatrix: null, error: null });
  notify({ ...STATE });
}
