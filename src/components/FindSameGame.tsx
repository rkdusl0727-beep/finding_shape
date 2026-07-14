import React, { useState, useEffect } from 'react';
import { GameMode, Shape, Point, Difficulty } from '../types';
import { SHAPES, COLS, shuffle, rnd } from '../utils/shapes';
import { Header } from './Header';
import { ShapeSvg } from './ShapeSvg';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, RefreshCw, ChevronRight, Sparkles } from 'lucide-react';

interface FindSameGameProps {
  onHome: () => void;
}

interface ItemState {
  shape: Shape;
  color: string;
  isCorrect: boolean;
  isFound: boolean;
  shake: boolean;
}

export const FindSameGame: React.FC<FindSameGameProps> = ({ onHome }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [targetShape, setTargetShape] = useState<Shape | null>(null);
  const [targetColor, setTargetColor] = useState('');
  const [items, setItems] = useState<ItemState[]>([]);
  const [foundCount, setFoundCount] = useState(0);
  const [requiredCount, setRequiredCount] = useState(2);
  const [errorMsg, setErrorMsg] = useState('');

  const isRoundComplete = foundCount >= requiredCount;

  useEffect(() => {
    if (!difficulty) return;
    initRound(difficulty);
  }, [difficulty]);

  useEffect(() => {
    if (isRoundComplete && difficulty) {
      const timer = setTimeout(() => {
        initRound(difficulty);
      }, 2500); // 2.5 seconds auto-advance to next round
      return () => clearTimeout(timer);
    }
  }, [isRoundComplete, difficulty]);

  const getColorName = (hex: string): string => {
    switch (hex.toLowerCase()) {
      case '#e74c3c': return '빨간색';
      case '#3498db': return '파란색';
      case '#27ae60': return '초록색';
      case '#9b59b6': return '보라색';
      case '#e67e22': return '주황색';
      case '#1abc9c': return '청록색';
      case '#f39c12': return '노란색';
      case '#e91e63': return '분홍색';
      case '#16a085': return '진한 청록색';
      case '#2980b9': return '남색';
      default: return '알록달록 색';
    }
  };

  const initRound = (diff: Difficulty) => {
    setErrorMsg('');
    setFoundCount(0);

    // Dynamic counts based on difficulty
    // Easy: 6 items in total, find 2 targets
    // Hard: 12 items in total, find 4 targets
    const totalCount = diff === 'easy' ? 6 : 12;
    const targetCount = diff === 'easy' ? 2 : 4;
    setRequiredCount(targetCount);

    // Select target shape
    const shuffledShapes = shuffle(SHAPES);
    const target = shuffledShapes[0];

    // Select a unique target color
    const randColor = COLS[Math.floor(rnd(0, COLS.length))];

    // Select distractor shapes (excluding target)
    const distractorShapes = SHAPES.filter((s) => s.id !== target.id);

    let targetItems: ItemState[] = [];
    let distractorItems: ItemState[] = [];

    if (diff === 'easy') {
      // Find same shape regardless of color
      targetItems = Array.from({ length: targetCount }, () => {
        return {
          shape: target,
          color: COLS[Math.floor(rnd(0, COLS.length))],
          isCorrect: true,
          isFound: false,
          shake: false,
        };
      });

      const distractorCount = totalCount - targetCount;
      distractorItems = Array.from({ length: distractorCount }, () => {
        const shape = distractorShapes[Math.floor(rnd(0, distractorShapes.length))];
        return {
          shape,
          color: COLS[Math.floor(rnd(0, COLS.length))],
          isCorrect: false,
          isFound: false,
          shake: false,
        };
      });
    } else {
      // Hard mode: Find same shape AND same color
      targetItems = Array.from({ length: targetCount }, () => {
        return {
          shape: target,
          color: randColor,
          isCorrect: true,
          isFound: false,
          shake: false,
        };
      });

      // Distractors:
      // 1. Same shape but different colors (2 items)
      const sameShapeDiffColorCount = 2;
      const otherColors = COLS.filter((c) => c !== randColor);
      const sameShapeDiffColorItems = Array.from({ length: sameShapeDiffColorCount }, () => {
        return {
          shape: target,
          color: otherColors[Math.floor(rnd(0, otherColors.length))],
          isCorrect: false, // incorrect because color is different!
          isFound: false,
          shake: false,
        };
      });

      // 2. Different shapes, any colors (including target color or other colors)
      const otherDistractorCount = totalCount - targetCount - sameShapeDiffColorCount;
      const otherDistractorItems = Array.from({ length: otherDistractorCount }, () => {
        const shape = distractorShapes[Math.floor(rnd(0, distractorShapes.length))];
        return {
          shape,
          color: COLS[Math.floor(rnd(0, COLS.length))],
          isCorrect: false,
          isFound: false,
          shake: false,
        };
      });

      distractorItems = [...sameShapeDiffColorItems, ...otherDistractorItems];
    }

    // Merge and shuffle them
    const finalItems = shuffle([...targetItems, ...distractorItems]);
    
    setTargetShape(target);
    setTargetColor(randColor);
    setItems(finalItems);
  };

  const handleItemTap = (idx: number) => {
    const item = items[idx];
    if (item.isFound) return;

    if (item.isCorrect) {
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, isFound: true } : it))
      );
      setFoundCount((prev) => {
        const next = prev + 1;
        if (next >= requiredCount) {
          setErrorMsg('');
        }
        return next;
      });
    } else {
      // Shake item
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, shake: true } : it))
      );
      setErrorMsg('다시 한번 찾아보세요! 아자아자!');
      setTimeout(() => {
        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, shake: false } : it))
        );
      }, 400);

      // Auto clear error message
      setTimeout(() => {
        setErrorMsg((current) => (current === '다시 한번 찾아보세요! 아자아자!' ? '' : current));
      }, 1400);
    }
  };

  const getStars = () => {
    if (requiredCount === 0) return 0;
    return Math.min(Math.ceil((foundCount / requiredCount) * 5), 5);
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Header title="같은 모양을 찾아요!" onHome={onHome} stars={0} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center mt-6 select-none bg-white p-8 rounded-3xl border border-stone-200 max-w-lg w-full shadow-sm"
        >
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-800 mb-2">
            난이도를 선택해요!
          </h2>
          <p className="text-xs text-stone-400 mb-8 font-medium">
            아이의 연령과 숙련도에 맞춰 난이도를 선택해 보세요.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDifficulty('easy')}
              className="flex-1 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 hover:border-emerald-200 rounded-2xl cursor-pointer shadow-sm text-center"
            >
              <div className="text-4xl mb-3">😊</div>
              <div className="font-extrabold text-stone-800 text-sm sm:text-base">쉬운 난이도</div>
              <div className="text-[11px] text-stone-400 font-medium mt-1">도형 6개 중에서 같은 모양 2개 찾기 (색상 무관)</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDifficulty('hard')}
              className="flex-1 p-6 bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-100 hover:border-rose-200 rounded-2xl cursor-pointer shadow-sm text-center"
            >
              <div className="text-4xl mb-3">🔥</div>
              <div className="font-extrabold text-stone-800 text-sm sm:text-base">어려운 난이도</div>
              <div className="text-[11px] text-stone-400 font-medium mt-1">도형 12개 중에서 같은 모양 & 같은 색깔 4개 찾기</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header
        title="같은 모양을 찾아요!"
        onHome={onHome}
        onSelectCategory={() => setDifficulty(null)}
        stars={getStars()}
      />

      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm flex flex-col mb-4 select-none">
        {/* Target Header banner */}
        <div className="bg-amber-50/50 px-6 py-4 border-b border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-sm sm:text-base text-stone-800 shrink-0">목표:</span>
            {targetShape && (
              <div className="flex items-center gap-3">
                <ShapeSvg
                  shapeId={targetShape.id}
                  size={72}
                  color={difficulty === 'hard' ? targetColor : '#f39c12'}
                />
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl font-black text-stone-900 leading-tight whitespace-nowrap">
                    {difficulty === 'hard' ? `${getColorName(targetColor)} ${targetShape.name}` : targetShape.name}
                  </span>
                  <span className="text-[11px] font-bold text-stone-500 mt-0.5">
                    {difficulty === 'hard' ? '색깔과 모양이 모두 똑같아야 해요!' : '모양만 똑같으면 돼요!'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <span className="text-xs font-black text-amber-800 bg-amber-100/50 px-4 py-2 rounded-2xl self-start sm:self-auto">
            {difficulty === 'hard' ? (
              <>
                똑같은 <b className="text-amber-600 font-extrabold">{getColorName(targetColor)} {targetShape?.name}</b>를{' '}
              </>
            ) : (
              <>
                똑같은 모양의 <b className="text-amber-600 font-extrabold">{targetShape?.name}</b>를{' '}
              </>
            )}
            <b className="text-rose-600 font-extrabold text-sm">{requiredCount}개</b> 다 찾아주세요!
            <span className="ml-2 font-medium text-stone-500">({foundCount}/{requiredCount})</span>
          </span>
        </div>

        {/* Dynamic & Grid Layout (Screen cutting issue completely fixed) */}
        <div className="relative bg-amber-50/10 p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
            {items.map((it, idx) => {
              return (
                <motion.div
                  key={`${it.shape.id}-${idx}`}
                  onClick={() => handleItemTap(idx)}
                  animate={
                    it.shake
                      ? { x: [0, -10, 10, -8, 8, -5, 5, 0] }
                      : it.isFound
                      ? { scale: 0.95, opacity: 1 }
                      : { scale: 1, opacity: 1 }
                  }
                  whileHover={!it.isFound ? { scale: 1.08, y: -2 } : {}}
                  whileTap={!it.isFound ? { scale: 0.95 } : {}}
                  transition={{ duration: 0.3 }}
                  className={`relative p-5 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-center justify-center cursor-pointer select-none transition-all ${
                    it.isFound
                      ? 'bg-stone-50 border-stone-200 pointer-events-none'
                      : 'hover:shadow-md border-amber-100/20 active:bg-amber-50/20'
                  }`}
                >
                  <ShapeSvg shapeId={it.shape.id} size={54} color={it.color} />
                  
                  {it.isFound && (
                    <div className="absolute inset-0 flex items-center justify-center bg-teal-500/10 rounded-2xl">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-teal-500 text-white rounded-full p-1 shadow"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Correct Answer Victory overlay */}
          <AnimatePresence>
            {isRoundComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center pointer-events-none p-4"
              >
                <motion.div
                  initial={{ scale: 0.8, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-teal-500 text-white font-black text-sm sm:text-base px-8 py-4 rounded-3xl shadow-lg flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>모두 다 찾았어요! 정말 최고예요! 🎉</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-50 border border-rose-200 text-rose-800 font-extrabold text-xs sm:text-sm py-3 px-4 rounded-xl text-center mb-3"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2.5">
        <button
          onClick={() => initRound(difficulty)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 font-bold text-stone-700 text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-4 h-4 text-stone-400" />
          <span>새로 섞기</span>
        </button>

        {isRoundComplete && (
          <button
            onClick={() => initRound(difficulty)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20 animate-bounce"
          >
            <span>다음 문제 도전</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
