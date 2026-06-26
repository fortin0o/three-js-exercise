'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Mic, Info, Play, Settings, ScanLine } from 'lucide-react';
import { useUIStore, SheetId } from '@/store/uiStore';
import { useRouter } from 'next/navigation';
import { useModelStore } from '@/store/modelStore';
import { useARStore } from '@/store/arStore';
import { requestGyroPermission } from '@/utils/gyro';

interface MenuItem {
  id: SheetId;
  icon: React.ReactNode;
  label: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings', color: 'text-zinc-400' },
  { id: 'animation', icon: <Play className="w-5 h-5" />, label: 'Animation', color: 'text-emerald-400' },
  { id: 'object', icon: <Info className="w-5 h-5" />, label: 'Info', color: 'text-blue-400' },
  { id: 'voice', icon: <Mic className="w-5 h-5" />, label: 'Voice', color: 'text-rose-400' },
  { id: 'ai', icon: <MessageSquare className="w-5 h-5" />, label: 'AI Chat', color: 'text-cyan-400' },
];

export function FABMenu() {
  const { fabOpen, toggleFab, openSheet } = useUIStore();
  const { selectedPartId } = useModelStore();
  const { setMode, setGyroPermission } = useARStore();
  const router = useRouter();

  const handleItemClick = (id: SheetId) => {
    openSheet(id);
  };

  return (
    <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end">
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col-reverse gap-3 mb-4 items-end"
          >
            {MENU_ITEMS.map((item, i) => {
              // Hide object info if no part is selected
              if (item.id === 'object' && !selectedPartId) return null;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => handleItemClick(item.id)}
                  className="group flex items-center gap-3"
                >
                  <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 ${item.color}`}
                    style={{
                      background: 'rgba(20,25,35,0.8)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    {item.icon}
                  </div>
                </motion.button>
              );
            })}
            {/* AR Launch Button */}
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: MENU_ITEMS.length * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
              onClick={async () => { 
                await requestGyroPermission(setGyroPermission);
                setMode('camera'); 
                toggleFab(); 
              }}
              className="group flex items-center gap-3"
            >
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-white/80 bg-black/40 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                AR Live View
              </span>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 text-fuchsia-400"
                style={{
                  background: 'rgba(20,25,35,0.8)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(232,121,249,0.3)',
                  boxShadow: '0 0 16px rgba(232,121,249,0.2)',
                }}
              >
                <ScanLine className="w-5 h-5" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleFab}
        animate={{ rotate: fabOpen ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative z-50"
        style={{
          background: fabOpen ? 'rgba(255,255,255,0.1)' : 'rgba(10,200,255,0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <Plus className={`w-6 h-6 ${fabOpen ? 'text-white' : 'text-cyan-400'}`} />
        {!fabOpen && (
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl -z-10" />
        )}
      </motion.button>
    </div>
  );
}
