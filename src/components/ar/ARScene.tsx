'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useARStore } from '@/store/arStore';
import { useModelStore } from '@/store/modelStore';
import { ENGINE_PARTS } from '@/data/engineParts';
import { GlassCard } from '../ui/GlassCard';
import { ZoomIn, ZoomOut, RotateCcw, Layers, Info, Wifi, WifiOff, Cube } from 'lucide-react';
import { ARToggleButton } from './ARToggleButton';
import { CameraBackground } from './CameraBackground';
import { startAR, stopAR, subscribeAR, getARState } from '@/services/mindar/controller';
import type { ARDetectionState } from '@/services/mindar/controller';

const EngineModel = dynamic(
  () => import('../model/EngineModel').then((m) => ({ default: m.EngineModel })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#020408]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/50 border-t-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-cyan-400 font-medium">Loading 3D Engine...</p>
        </div>
      </div>
    ),
  }
);

export function ARScene() {
  const { mode, setCameraPermission, setError } = useARStore();
  const { selectedPartId, setSelectedPart, setScale, scale, isExploded, setExploded, resetModel } = useModelStore();
  const isARMode = mode === 'camera';

  const [arState, setARState] = useState<ARDetectionState>(getARState());
  const mindarStarted = useRef(false);

  // Subscribe to MindAR state changes
  useEffect(() => {
    const unsub = subscribeAR((s) => setARState({ ...s }));
    return unsub;
  }, []);

  // Start/stop MindAR based on mode
  useEffect(() => {
    if (isARMode && !mindarStarted.current) {
      mindarStarted.current = true;
      setCameraPermission('granted');
      startAR()
        .then(({ projectionMatrix }) => {
          // Successfully started
        })
        .catch((err) => {
          setCameraPermission('denied');
          setError(err.message);
          mindarStarted.current = false;
        });
    }
    if (!isARMode && mindarStarted.current) {
      stopAR();
      mindarStarted.current = false;
    }
    return () => {
      if (mindarStarted.current) {
        stopAR();
        mindarStarted.current = false;
      }
    };
  }, [isARMode, setCameraPermission, setError]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        isARMode ? 'bg-black' : 'bg-[#020408] scanline-overlay'
      }`}
    >
      {/* Demo Mode Background */}
      {!isARMode && (
        <>
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute inset-0 bg-radial-gradient" />
        </>
      )}

      {/* AR Mode: Live Camera Feed */}
      <AnimatePresence>
        {isARMode && (
          <motion.div
            key="camera-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-0"
          >
            <CameraBackground />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <div
        className="absolute inset-0 z-10"
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
          <EngineModel
            isARMode={isARMode}
            markerFound={arState.markerFound}
            cameraMatrix={arState.cameraMatrix}
            projectionMatrix={arState.projectionMatrix}
          />
        </div>
      </div>

      {/* AR Mode: Corner Brackets */}
      {isARMode && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-56 h-56"
          >
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
            ].map((cls, i) => (
              <motion.div
                key={i}
                className={`absolute w-8 h-8 border-cyan-400 ${cls}`}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <motion.div
                className="w-2 h-2 rounded-full bg-cyan-400"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              {arState.markerFound ? (
                <span className="text-[9px] text-emerald-400 tracking-widest uppercase mt-1">
                  Marker Detected
                </span>
              ) : (
                <span className="text-[9px] text-cyan-400/60 tracking-widest uppercase mt-1">
                  AR Active
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* HUD Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-3 flex items-start justify-between z-30 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="pointer-events-auto"
        >
          <ARToggleButton />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-2 pointer-events-auto"
        >
          <GlassCard className="px-3 py-2">
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {isARMode ? (
                  <motion.div
                    key="ar-status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    {arState.isLoaded ? (
                      <>
                        <motion.div
                          className={`w-1.5 h-1.5 rounded-full ${arState.markerFound ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-[10px] text-cyan-400 font-medium">
                          {arState.markerFound ? 'TRACKING' : 'AR LIVE'}
                        </span>
                        <Wifi className="w-3 h-3 text-cyan-400" />
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-cyan-500/50 border-t-cyan-400 animate-spin" />
                        <span className="text-[10px] text-cyan-400 font-medium">LOADING AR</span>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="demo-status"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">ENGINE ONLINE</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Part Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-20 left-3 flex flex-col gap-1.5 z-30"
      >
        {ENGINE_PARTS.map((part) => (
          <button
            key={part.id}
            onClick={() => setSelectedPart(selectedPartId === part.id ? null : part.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-left
              border backdrop-blur-md ${
                selectedPartId === part.id
                  ? 'text-white border-opacity-70'
                  : 'text-[#8892a4] bg-black/30 border-white/10 hover:text-white hover:bg-white/10'
              }`}
            style={
              selectedPartId === part.id
                ? {
                    backgroundColor: `${part.color}25`,
                    borderColor: `${part.color}60`,
                    color: part.color,
                    boxShadow: `0 0 12px ${part.color}30`,
                  }
                : {}
            }
          >
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full flex-none"
                style={{ backgroundColor: selectedPartId === part.id ? part.color : '#4a5568' }}
              />
              {part.name}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-20 right-3 flex flex-col gap-2 z-30"
      >
        <GlassCard className="flex flex-col gap-1 p-1.5">
          <ControlBtn icon={<ZoomIn className="w-4 h-4" />} onClick={() => setScale(scale + 0.2)} title="Zoom in" />
          <div className="w-full h-px bg-white/10" />
          <ControlBtn icon={<ZoomOut className="w-4 h-4" />} onClick={() => setScale(scale - 0.2)} title="Zoom out" />
        </GlassCard>

        <ControlBtn
          icon={<RotateCcw className="w-4 h-4" />}
          onClick={resetModel}
          title="Reset"
          className="glass p-2"
        />

        <ControlBtn
          icon={<Layers className="w-4 h-4" />}
          onClick={() => setExploded(!isExploded)}
          title="Explode view"
          className={`glass p-2 ${isExploded ? 'text-cyan-400' : 'text-[#4a5568]'}`}
        />
      </motion.div>

      {/* Tip bar */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4 pointer-events-none z-30">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <GlassCard className="px-3 py-1.5 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-none" />
            <p className="text-[11px] text-[#8892a4]">
              {isARMode
                ? arState.markerFound
                  ? 'Marker locked • Model attached'
                  : 'Arahkan kamera ke marker • Scan marker untuk melihat model'
                : 'Tap komponen • Scroll untuk zoom • Drag untuk rotasi'}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

function ControlBtn({
  icon,
  onClick,
  title,
  className,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 text-[#8892a4] hover:text-cyan-400 transition-colors duration-200 flex items-center justify-center ${className ?? ''}`}
    >
      {icon}
    </button>
  );
}
