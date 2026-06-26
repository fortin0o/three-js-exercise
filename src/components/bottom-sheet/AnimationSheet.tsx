'use client';

import { BottomSheet } from './BottomSheet';
import { useUIStore } from '@/store/uiStore';
import { useModelStore } from '@/store/modelStore';
import { Play, Pause, FastForward, Maximize2, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function AnimationSheet() {
  const { activeSheet, closeSheet } = useUIStore();
  const { isAnimating, setAnimating, isExploded, setExploded, animationTarget } = useModelStore();
  const isOpen = activeSheet === 'animation';

  const animations = [
    {
      id: 'demo',
      icon: isAnimating && animationTarget === 'fullCycle' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />,
      label: isAnimating && animationTarget === 'fullCycle' ? 'Stop Demo' : 'Start Demo',
      color: 'emerald',
      onClick: () => setAnimating(!(isAnimating && animationTarget === 'fullCycle'), 'fullCycle'),
      active: isAnimating && animationTarget === 'fullCycle',
    },
    {
      id: 'exploded',
      icon: <Maximize2 className="w-5 h-5" />,
      label: isExploded ? 'Assemble View' : 'Exploded View',
      color: 'blue',
      onClick: () => setExploded(!isExploded),
      active: isExploded,
    },
    {
      id: 'cycle',
      icon: <RotateCw className="w-5 h-5" />,
      label: 'Working Cycle',
      color: 'amber',
      onClick: () => setAnimating(true, 'fullCycle'),
      active: isAnimating && animationTarget === 'fullCycle',
    },
  ];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={closeSheet}
      title="Animation Controls"
      icon={<Play className="w-5 h-5 text-emerald-400" />}
      height="md"
    >
      <div className="flex flex-col gap-4 pt-2">
        {animations.map((anim, idx) => (
          <motion.button
            key={anim.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={anim.onClick}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              anim.active
                ? `bg-${anim.color}-500/20 border-${anim.color}-500/50 text-${anim.color}-400`
                : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                anim.active ? `bg-${anim.color}-500/20` : 'bg-white/10'
              }`}
            >
              {anim.icon}
            </div>
            <span className="font-medium text-lg">{anim.label}</span>
          </motion.button>
        ))}

        {/* Speed Slider Example */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 p-5 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Animation Speed</div>
            <FastForward className="w-4 h-4 text-zinc-500" />
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            defaultValue="1"
            className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-2">
            <span>0.5x</span>
            <span>1x</span>
            <span>2x</span>
          </div>
        </motion.div>
      </div>
    </BottomSheet>
  );
}
