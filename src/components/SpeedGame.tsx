import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Shape, Point } from '../types';
import { SHAPES, COLS, shuffle, rnd } from '../utils/shapes';
import { Header } from './Header';
import { ShapeSvg } from './ShapeSvg';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, HelpCircle, Trophy, RotateCcw, AlertCircle, Award } from 'lucide-react';

interface SpeedGameProps {
  onHome: () => void;
}

interface SpeedItem {
  shape: Shape;
  color: string;
  isTarget: boolean;
  isFound: boolean;
  shake: boolean;
}

export const SpeedGame: React.FC<SpeedGameProps> = ({ onHome }) => {
  const [targetShape, setTargetShape] = useState<Shape | null>(null);
  const [targetColor, setTargetColor] = useState('');

  // Player Boards (CSS Grid based, 100% responsive, no cutoffs)
  const [items1, setItems1] = useState<SpeedItem[]>([]);
  const [items2, setItems2] = useState<SpeedItem[]>([]);

  // Scores
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  // Round Winner Announcement state
  const [roundWinner, setRoundWinner] = useState<'1P' | '2P' | null>(null);
  const [isRoundEnding, setIsRoundEnding] = useState(false);

  // Game Timers
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds total game time
  const [gameActive, setGameActive] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startNewGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setScore1(0);
    setScore2(0);
    setTimeLeft(45);
    setGameActive(true);
    setRoundWinner(null);
    setIsRoundEnding(false);
    generateNextRound();

    // Start 1-second countdown clock
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateNextRound = () => {
    setRoundWinner(null);
    setIsRoundEnding(false);

    // Pick a new target shape and target color
    const target = SHAPES[Math.floor(rnd(0, SHAPES.length))];
    const color = COLS[Math.floor(rnd(0, COLS.length))];

    // Pick distractors (shapes different from target)
    const distractors = SHAPES.filter((s) => s.id !== target.id);

    // Build lists of 8 items (with exactly 1 target at a random index)
    const buildList = () => {
      const targetIdx = Math.floor(rnd(0, 8));
      const shuffledDists = shuffle(distractors);
      
      return Array.from({ length: 8 }, (_, i) => {
        const isTarget = i === targetIdx;
        return {
          shape: isTarget ? target : shuffledDists[i % shuffledDists.length],
          color: isTarget ? color : COLS[Math.floor(rnd(0, COLS.length))],
          isTarget,
          isFound: false,
          shake: false,
        };
      });
    };

    setTargetShape(target);
    setTargetColor(color);
    setItems1(buildList());
    setItems2(buildList());
  };

  const handleTap = (player: 1 | 2, itemIdx: number) => {
    if (!gameActive || isRoundEnding) return;

    if (player === 1) {
      const item = items1[itemIdx];
      if (item.isFound) return;

      if (item.isTarget) {
        // Correct tap for 1P!
        setItems1((prev) =>
          prev.map((it, i) => (i === itemIdx ? { ...it, isFound: true } : it))
        );
        triggerRoundWin('1P');
      } else {
        // Shake wrong shape
        setItems1((prev) =>
          prev.map((it, i) => (i === itemIdx ? { ...it, shake: true } : it))
        );
        setTimeout(() => {
          setItems1((prev) =>
            prev.map((it, i) => (i === itemIdx ? { ...it, shake: false } : it))
          );
        }, 400);
      }
    } else {
      const item = items2[itemIdx];
      if (item.isFound) return;

      if (item.isTarget) {
        // Correct tap for 2P!
        setItems2((prev) =>
          prev.map((it, i) => (i === itemIdx ? { ...it, isFound: true } : it))
        );
        triggerRoundWin('2P');
      } else {
        // Shake wrong shape
        setItems2((prev) =>
          prev.map((it, i) => (i === itemIdx ? { ...it, shake: true } : it))
        );
        setTimeout(() => {
          setItems2((prev) =>
            prev.map((it, i) => (i === itemIdx ? { ...it, shake: false } : it))
          );
        }, 400);
      }
    }
  };

  const triggerRoundWin = (player: '1P' | '2P') => {
    setRoundWinner(player);
    setIsRoundEnding(true);

    if (player === '1P') {
      setScore1((s) => s + 10);
    } else {
      setScore2((s) => s + 10);
    }

    // Wait 1.3 seconds, then show the next target shape automatically!
    setTimeout(() => {
      generateNextRound();
    }, 1300);
  };

  const getWinnerText = () => {
    if (score1 > score2) return '1P 최종 승리! 🎉';
    if (score2 > score1) return '2P 최종 승리! 🎉';
    return '무승부! 🤝';
  };

  const getStars = () => {
    const totalScore = score1 + score2;
    if (totalScore >= 120) return 5;
    if (totalScore >= 80) return 4;
    if (totalScore >= 50) return 3;
    if (totalScore >= 20) return 2;
    return 1;
  };

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header title="모양을 빠르게 찾아요!" onHome={onHome} stars={getStars()} />

      {/* Main Game Interface (No absolute position overflow = perfectly responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch select-none">
        
        {/* P1 Section */}
        <div className="flex-1 flex flex-col bg-white border-2 border-blue-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-blue-50/70 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
            <span className="text-blue-900 font-extrabold text-xs sm:text-sm">
              🔵 1P 영역 (왼쪽 터치)
            </span>
            <div className="text-blue-600 font-black text-xs bg-white px-2.5 py-1 rounded-xl shadow-2xs">
              득점: {score1}
            </div>
          </div>

          <div className="relative flex-1 p-4 bg-blue-50/5 min-h-[180px]">
            {/* CSS Grid ensures no overlap and perfectly responsive layouts on electronic blackboards! */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 justify-items-center">
              {items1.map((it, idx) => (
                <motion.div
                  key={`p1-${idx}`}
                  onClick={() => handleTap(1, idx)}
                  animate={
                    it.shake
                      ? { x: [0, -6, 6, -5, 5, 0] }
                      : it.isFound
                      ? { scale: [1, 1.25, 0.95], opacity: 1 }
                      : { scale: 1 }
                  }
                  whileHover={!it.isFound ? { scale: 1.08 } : {}}
                  whileTap={!it.isFound ? { scale: 0.95 } : {}}
                  transition={{ duration: 0.3 }}
                  className={`relative p-3 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-stone-100 shadow-2xs flex items-center justify-center cursor-pointer ${
                    it.isFound ? 'pointer-events-none bg-stone-50' : 'hover:shadow-sm'
                  }`}
                >
                  <ShapeSvg shapeId={it.shape.id} size={42} color={it.color} />
                </motion.div>
              ))}
            </div>

            {/* Individual P1 Success banner */}
            <AnimatePresence>
              {roundWinner === '1P' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-500/85 flex flex-col items-center justify-center text-white"
                >
                  <Zap className="w-10 h-10 text-yellow-300 animate-bounce mb-1" />
                  <span className="text-lg font-black tracking-wide">내가 먼저 찾았어요! ⚡</span>
                  <span className="text-xs font-bold text-blue-100 mt-1">+10점 보너스 획득!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Center Target Info & Timer (Stays perfectly between panels) */}
        <div className="bg-amber-50/40 p-4 border border-amber-200/50 rounded-3xl flex flex-row lg:flex-col justify-around lg:justify-center items-center gap-4 lg:min-w-[140px] shadow-sm">
          <div className="text-center">
            <span className="text-[10px] font-black text-stone-400 tracking-wider block mb-1">
              남은 시간
            </span>
            <div className={`text-xl sm:text-2xl font-black tabular-nums ${timeLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-stone-800'}`}>
              {timeLeft}초
            </div>
          </div>

          <div className="w-px h-10 bg-stone-200 lg:w-full lg:h-px lg:my-1" />

          {/* Core Target Display */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-amber-800 tracking-wider block mb-1.5 uppercase">
              목표 도형을 찾아라!
            </span>
            {targetShape && (
              <motion.div
                key={targetShape.id}
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-white p-3 rounded-2xl border-2 border-amber-300 shadow-md flex flex-col items-center justify-center animate-pulse"
              >
                <ShapeSvg shapeId={targetShape.id} size={48} color={targetColor} />
                <span className="text-[11px] font-black text-stone-700 mt-1.5">
                  {targetShape.name}
                </span>
              </motion.div>
            )}
          </div>

          <div className="w-px h-10 bg-stone-200 lg:w-full lg:h-px lg:my-1" />

          {/* Realtime scoring comparison indicator */}
          <div className="hidden sm:block text-center">
            <span className="text-[9px] font-bold text-stone-400 block mb-0.5">실시간 스코어</span>
            <div className="text-xs font-black text-stone-700">
              <span className="text-blue-600">{score1}</span> : <span className="text-rose-600">{score2}</span>
            </div>
          </div>
        </div>

        {/* P2 Section */}
        <div className="flex-1 flex flex-col bg-white border-2 border-rose-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-rose-50/70 px-4 py-3 border-b border-rose-100 flex items-center justify-between">
            <span className="text-rose-900 font-extrabold text-xs sm:text-sm">
              🔴 2P 영역 (오른쪽 터치)
            </span>
            <div className="text-rose-600 font-black text-xs bg-white px-2.5 py-1 rounded-xl shadow-2xs">
              득점: {score2}
            </div>
          </div>

          <div className="relative flex-1 p-4 bg-rose-50/5 min-h-[180px]">
            <div className="grid grid-cols-4 gap-2 sm:gap-3 justify-items-center">
              {items2.map((it, idx) => (
                <motion.div
                  key={`p2-${idx}`}
                  onClick={() => handleTap(2, idx)}
                  animate={
                    it.shake
                      ? { x: [0, -6, 6, -5, 5, 0] }
                      : it.isFound
                      ? { scale: [1, 1.25, 0.95], opacity: 1 }
                      : { scale: 1 }
                  }
                  whileHover={!it.isFound ? { scale: 1.08 } : {}}
                  whileTap={!it.isFound ? { scale: 0.95 } : {}}
                  transition={{ duration: 0.3 }}
                  className={`relative p-3 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border border-stone-100 shadow-2xs flex items-center justify-center cursor-pointer ${
                    it.isFound ? 'pointer-events-none bg-stone-50' : 'hover:shadow-sm'
                  }`}
                >
                  <ShapeSvg shapeId={it.shape.id} size={42} color={it.color} />
                </motion.div>
              ))}
            </div>

            {/* Individual P2 Success banner */}
            <AnimatePresence>
              {roundWinner === '2P' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-rose-500/85 flex flex-col items-center justify-center text-white"
                >
                  <Zap className="w-10 h-10 text-yellow-300 animate-bounce mb-1" />
                  <span className="text-lg font-black tracking-wide">내가 먼저 찾았어요! ⚡</span>
                  <span className="text-xs font-bold text-rose-100 mt-1">+10점 보너스 획득!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Thrilling Round Victory / Overall Winner Popup */}
      <AnimatePresence>
        {!gameActive && (
          <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border-2 border-amber-300 rounded-3xl p-8 max-w-sm w-full text-center shadow-xl"
            >
              <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-stone-800 mb-2">게임 종료!</h3>
              
              <div className="text-base font-black text-teal-700 bg-teal-50 border-2 border-teal-100 px-6 py-3 rounded-2xl inline-block mb-6 shadow-sm">
                결과: {getWinnerText()}
              </div>

              {/* Dynamic scoreboard with medal styling */}
              <div className="grid grid-cols-2 gap-4 border border-stone-200/60 p-4 rounded-2xl bg-stone-50/80 mb-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Award className={`w-4 h-4 ${score1 >= score2 ? 'text-amber-500' : 'text-stone-300'}`} />
                    <span className="text-[11px] font-extrabold text-stone-500">1P 최종점수</span>
                  </div>
                  <div className="text-2xl font-black text-blue-600">{score1}점</div>
                </div>
                
                <div className="border-l border-stone-200 flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Award className={`w-4 h-4 ${score2 >= score1 ? 'text-amber-500' : 'text-stone-300'}`} />
                    <span className="text-[11px] font-extrabold text-stone-500">2P 최종점수</span>
                  </div>
                  <div className="text-2xl font-black text-rose-600">{score2}점</div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={startNewGame}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 도전하기</span>
                </button>
                <button
                  onClick={onHome}
                  className="w-full py-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-800 font-bold text-sm transition-colors cursor-pointer"
                >
                  <span>메인으로 가기</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
