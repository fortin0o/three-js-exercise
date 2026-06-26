'use client';

import { motion } from 'framer-motion';
import { Camera, Box } from 'lucide-react';
import { useARStore } from '@/store/arStore';
import { requestGyroPermission } from '@/utils/gyro';

export function ARToggleButton() {
  const { mode, setMode, cameraPermission, setGyroPermission } = useARStore();
  const isARMode = mode === 'camera';

  const handleToggle = async () => {
    if (!isARMode) {
      await requestGyroPermission(setGyroPermission);
      setMode('camera');
    } else {
      setMode('demo');
    }
  };

  return (
    <motion.button
      onClick={handleToggle}
      whileTap={{ scale: 0.92 }}
      title={isARMode ? 'Switch to Demo mode' : 'Switch to AR Camera mode'}
      className={`relative flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 ${
        isARMode
          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(0,212,255,0.25)]'
          : 'bg-black/40 border-white/15 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30'
      }`}
    >
      {/* Animated icon */}
      <div className="relative w-4 h-4">
        <motion.div
          animate={{ opacity: isARMode ? 0 : 1, scale: isARMode ? 0.5 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Box className="w-4 h-4" />
        </motion.div>
        <motion.div
          animate={{ opacity: isARMode ? 1 : 0, scale: isARMode ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Camera className="w-4 h-4" />
        </motion.div>
      </div>

      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] uppercase tracking-wider opacity-60">Mode</span>
        <span className="text-[11px] font-semibold">
          {isARMode ? 'AR Live' : '3D Demo'}
        </span>
      </div>

      {/* Live indicator dot */}
      {isARMode && (
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          {cameraPermission === 'denied' && (
            <span className="text-[9px] text-red-400 font-medium">NO CAM</span>
          )}
        </div>
      )}
    </motion.button>
  );
}
