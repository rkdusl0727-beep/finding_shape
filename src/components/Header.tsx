import React from 'react';
import { Home, RotateCcw, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface HeaderProps {
  title: string;
  onHome: () => void;
  onSelectCategory?: () => void;
  stars: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onHome,
  onSelectCategory,
  stars,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white/70 p-3 rounded-2xl border border-amber-100 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onHome}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 transition-all cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-amber-800" />
          <span>메인으로</span>
        </button>

        {onSelectCategory && (
          <button
            onClick={onSelectCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 text-amber-900 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
            <span>단계 선택</span>
          </button>
        )}
      </div>

      <div className="flex-1 min-w-[120px] text-center">
        <h1 className="font-extrabold text-base sm:text-lg text-stone-800 tracking-tight px-4 py-1.5 bg-amber-50/50 rounded-xl inline-block border border-amber-200/50">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8 }}
            animate={{ scale: i < stars ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3, delay: i < stars ? i * 0.05 : 0 }}
          >
            <Star
              className={`w-5 h-5 ${
                i < stars ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
              }`}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
