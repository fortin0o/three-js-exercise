'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraOff, RefreshCw, SwitchCamera } from 'lucide-react';
import { useARStore } from '@/store/arStore';
import { getARVideoElement, getARStream } from '@/services/mindar/controller';

export function CameraBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setCameraPermission, setError, cameraPermission } = useARStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Use the shared video element from MindAR if available
    const mindarVideo = getARVideoElement();
    if (mindarVideo && videoRef.current) {
      // Use the already-playing MindAR video as source
      videoRef.current.srcObject = mindarVideo.srcObject;
      videoRef.current.play().then(() => setReady(true)).catch(() => {});
      setCameraPermission('granted');
      return;
    }

    // Fallback: start our own camera if MindAR hasn't started yet
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API is not supported in this browser or requires HTTPS.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        setCameraPermission('granted');

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraPermission('denied');
          setError('Camera permission denied. Please allow camera access.');
        } else {
          setError(error.message ?? 'Camera not available');
          setCameraPermission('denied');
        }
      }
    };

    startCamera();

    return () => {
      // Don't stop the stream here - MindAR's stopAR handles cleanup
    };
  }, [setCameraPermission, setError]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease' }}
      />

      <AnimatePresence>
        {ready && (
          <motion.div
            key="cam-ready"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute inset-0 bg-black pointer-events-none"
          />
        )}
      </AnimatePresence>

      {ready && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,212,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {ready && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
          />
        </div>
      )}

      {cameraPermission === 'denied' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/40">
            <CameraOff className="w-8 h-8 text-red-400" />
          </div>
          <div className="text-center px-6">
            <p className="text-white font-semibold mb-1">Camera access needed</p>
            <p className="text-sm text-zinc-400">Allow camera permission in your browser settings, then tap retry.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-sm font-medium active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
