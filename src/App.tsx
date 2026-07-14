import { useState } from 'react';
import { GameMode } from './types';
import { Home } from './components/Home';
import { TraceGame } from './components/TraceGame';
import { FindSameGame } from './components/FindSameGame';
import { FindDiffGame } from './components/FindDiffGame';
import { SpeedGame } from './components/SpeedGame';
import { SortGame } from './components/SortGame';
import { ExactGame } from './components/ExactGame';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentMode, setCurrentMode] = useState<GameMode>('home');

  const renderGame = () => {
    switch (currentMode) {
      case 'home':
        return <Home onSelectMode={(mode) => setCurrentMode(mode)} />;
      case 'trace':
        return <TraceGame onHome={() => setCurrentMode('home')} />;
      case 'findSame':
        return <FindSameGame onHome={() => setCurrentMode('home')} />;
      case 'findDiff':
        return <FindDiffGame onHome={() => setCurrentMode('home')} />;
      case 'speed':
        return <SpeedGame onHome={() => setCurrentMode('home')} />;
      case 'sort':
        return <SortGame onHome={() => setCurrentMode('home')} />;
      case 'exact':
        return <ExactGame onHome={() => setCurrentMode('home')} />;
      default:
        return <Home onSelectMode={(mode) => setCurrentMode(mode)} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-300 text-stone-800 flex items-start justify-center p-3 sm:p-5 font-sans">
      <div className="w-full max-w-4xl bg-stone-50 border-3 border-stone-200/50 rounded-3xl p-4 sm:p-6 min-h-[500px] shadow-lg flex flex-col justify-between">
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderGame()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 pt-4 border-t border-stone-200/60 text-center select-none">
          <p className="text-[10px] font-bold text-stone-400">
            Shape Play Game — 재미있게 그리는 우리 아이 도형 교실
          </p>
        </div>
      </div>
    </div>
  );
}
