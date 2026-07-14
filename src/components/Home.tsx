import React from 'react';
import { GameMode } from '../types';
import { motion } from 'motion/react';
import { PenTool, Target, Search, HelpCircle, Zap, Box } from 'lucide-react';

interface HomeProps {
  onSelectMode: (mode: GameMode) => void;
}

export const Home: React.FC<HomeProps> = ({ onSelectMode }) => {
  const menuItems = [
    {
      mode: 'trace' as GameMode,
      icon: PenTool,
      title: '모양을 따라 그려요!',
      desc: '희미한 가이드 선을 따라 그리며 여러 도형을 익혀봅니다.',
      bgColor: 'bg-rose-50/50 border-rose-100 hover:bg-rose-100/50',
      iconColor: 'text-rose-500 bg-rose-100/70',
    },
    {
      mode: 'findSame' as GameMode,
      icon: Search,
      title: '같은 모양을 찾아요!',
      desc: '제시된 그림을 보고 똑같이 생긴 모양을 골라냅니다.',
      bgColor: 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-100/50',
      iconColor: 'text-emerald-500 bg-emerald-100/70',
    },
    {
      mode: 'findDiff' as GameMode,
      icon: HelpCircle,
      title: '다른 모양을 찾아요!',
      desc: '어긋나거나 다른 규칙을 가진 딱 하나의 모양을 고릅니다.',
      bgColor: 'bg-amber-50/50 border-amber-100 hover:bg-amber-100/50',
      iconColor: 'text-amber-500 bg-amber-100/70',
    },
    {
      mode: 'speed' as GameMode,
      icon: Zap,
      title: '모양을 빠르게 찾아요!',
      desc: '1P와 2P가 실시간 경쟁하여 목표 모양을 먼저 터치합니다.',
      bgColor: 'bg-blue-50/50 border-blue-100 hover:bg-blue-100/50',
      iconColor: 'text-blue-500 bg-blue-100/70',
    },
    {
      mode: 'sort' as GameMode,
      icon: Box,
      title: '모양대로 정리해요!',
      desc: '위에서 떨어지는 모양을 보고 맞는 보관함에 알맞게 분류합니다.',
      bgColor: 'bg-purple-50/50 border-purple-100 hover:bg-purple-100/50',
      iconColor: 'text-purple-500 bg-purple-100/70',
    },
    {
      mode: 'exact' as GameMode,
      icon: Target,
      title: '모양을 정확하게 그려요!',
      desc: '가이드 없이 기억에 의존해 똑같이 그려 정확도를 뽐냅니다 (1P vs 2P).',
      bgColor: 'bg-violet-50/50 border-violet-100 hover:bg-violet-100/50',
      iconColor: 'text-violet-500 bg-violet-100/70',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 select-none">
        {/* Playful shapes as logo header */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-rose-400 rounded-2xl flex items-center justify-center shadow-md border-0"
        >
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rotate-45" />
        </motion.div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-800 tracking-tight leading-none">
          재미있는 모양 놀이
        </h1>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-teal-400 rounded-full flex items-center justify-center shadow-md border-0"
        >
          <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full" />
        </motion.div>
      </div>

      <p className="text-xs sm:text-sm text-stone-500 mb-8 font-medium text-center max-w-md">
        다양한 도형 그리기, 짝 맞추기, 분리하기 미션을 클리어하며 도형 감각을 쑥쑥 키워보세요!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl px-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.mode}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectMode(item.mode)}
              className={`flex flex-col p-6 bg-white border-2 border-stone-100 rounded-3xl cursor-pointer shadow-sm transition-all duration-150 group ${item.bgColor}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3.5 rounded-2xl transition-colors ${item.iconColor} shrink-0`}>
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="font-extrabold text-stone-800 text-base sm:text-lg md:text-xl tracking-tight leading-snug group-hover:text-stone-900 transition-colors">
                  {item.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed font-semibold pl-1">
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
