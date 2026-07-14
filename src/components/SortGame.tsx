import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Shape, Point } from '../types';
import { SHAPES, COLS, shuffle, rnd } from '../utils/shapes';
import { Header } from './Header';
import { ShapeSvg } from './ShapeSvg';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Trophy, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';

interface SortGameProps {
  onHome: () => void;
}

interface FallingItem {
  id: string;
  shape: Shape;
  color: string;
  xPercent: number; // horizontal position in percent (0 to 100)
  startYPercent: number; // initial vertical position
  speedMultiplier: number;
  status?: 'falling' | 'correct' | 'incorrect' | 'resetting';
  offsetX?: number;
  offsetY?: number;
}

interface DragState {
  id: string;
  player: 1 | 2;
  startX: number; // pointer start screen X
  startY: number; // pointer start screen Y
  offsetX: number; // current delta X
  offsetY: number; // current delta Y
}

export const SortGame: React.FC<SortGameProps> = ({ onHome }) => {
  const [types, setTypes] = useState<Shape[]>([]);
  const [secLeft, setSecLeft] = useState(45); // 45 seconds game clock
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);

  // Active falling items
  const [falling1, setFalling1] = useState<FallingItem[]>([]);
  const [falling2, setFalling2] = useState<FallingItem[]>([]);

  // Selection & dragging state (Touch / pointer-event based)
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Bucket completion counts
  const [bucketCounts1, setBucketCounts1] = useState<Record<string, number>>({});
  const [bucketCounts2, setBucketCounts2] = useState<Record<string, number>>({});

  const [gameOver, setGameOver] = useState(false);

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallingLoopRef = useRef<NodeJS.Timeout | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  // Keep tracking references to avoid closure capture issues in handlers
  const typesRef = useRef<Shape[]>([]);
  useEffect(() => {
    typesRef.current = types;
  }, [types]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  useEffect(() => {
    startNewGame();
    return () => {
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (fallingLoopRef.current) clearInterval(fallingLoopRef.current);
  };

  const startNewGame = () => {
    clearTimers();
    const selectedTypes = shuffle(SHAPES).slice(0, 4);
    setTypes(selectedTypes);
    setSecLeft(45);
    setScore1(0);
    setScore2(0);
    setFalling1([]);
    setFalling2([]);
    setDragState(null);
    
    const initialCounts = {
      [selectedTypes[0].id]: 0,
      [selectedTypes[1].id]: 0,
      [selectedTypes[2].id]: 0,
      [selectedTypes[3].id]: 0,
    };
    setBucketCounts1({ ...initialCounts });
    setBucketCounts2({ ...initialCounts });
    setGameOver(false);

    // Initial Spawn
    spawnItem(1, selectedTypes);
    spawnItem(2, selectedTypes);

    // Spawn loop (spawns an item for each player every 1.6 seconds)
    spawnTimerRef.current = setInterval(() => {
      spawnItem(1, typesRef.current);
      spawnItem(2, typesRef.current);
    }, 1600);

    // Smooth State-based falling animation loop (no jumping, completely lag-free!)
    fallingLoopRef.current = setInterval(() => {
      setFalling1((prev) =>
        prev
          .map((it) => {
            const drag = dragStateRef.current;
            if (drag && drag.id === it.id) return it;
            if (it.status === 'correct' || it.status === 'incorrect' || it.status === 'resetting') return it;
            return { ...it, startYPercent: it.startYPercent + 0.38 * it.speedMultiplier };
          })
          .filter((it) => it.startYPercent <= 105 || it.status === 'correct' || it.status === 'incorrect' || it.status === 'resetting')
      );

      setFalling2((prev) =>
        prev
          .map((it) => {
            const drag = dragStateRef.current;
            if (drag && drag.id === it.id) return it;
            if (it.status === 'correct' || it.status === 'incorrect' || it.status === 'resetting') return it;
            return { ...it, startYPercent: it.startYPercent + 0.38 * it.speedMultiplier };
          })
          .filter((it) => it.startYPercent <= 105 || it.status === 'correct' || it.status === 'incorrect' || it.status === 'resetting')
      );
    }, 30);

    // Game Clock
    gameTimerRef.current = setInterval(() => {
      setSecLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const spawnItem = (playerNum: 1 | 2, currentTypes: Shape[]) => {
    if (currentTypes.length === 0) return;
    const shape = currentTypes[Math.floor(rnd(0, currentTypes.length))];
    const color = COLS[Math.floor(rnd(0, COLS.length))];
    
    const newItem: FallingItem = {
      id: `${playerNum}-${Date.now()}-${Math.random()}`,
      shape,
      color,
      xPercent: Math.floor(rnd(10, 80)), // Scatters horizontally
      startYPercent: -15,
      speedMultiplier: rnd(0.85, 1.2), // slightly randomized fall speeds
    };

    if (playerNum === 1) {
      setFalling1((prev) => [...prev, newItem]);
    } else {
      setFalling2((prev) => [...prev, newItem]);
    }
  };

  // Drag handlers using resilient PointerEvents (extremely compatible with tablets and electronic boards!)
  const handlePointerDown = (e: React.PointerEvent, player: 1 | 2, item: FallingItem) => {
    if (gameOver) return;
    if (item.status === 'correct' || item.status === 'incorrect' || item.status === 'resetting') return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setDragState({
      id: item.id,
      player,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.preventDefault();

    setDragState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        offsetX: e.clientX - prev.startX,
        offsetY: e.clientY - prev.startY,
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.preventDefault();
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const { id, player, offsetX, offsetY } = dragState;

    // Get item that was dragged
    const isP1 = player === 1;
    const item = (isP1 ? falling1 : falling2).find((it) => it.id === id);

    if (item) {
      // Find element underneath the current drop pointer
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      
      // Look for any drop bucket target element
      let matchedBucketId: string | null = null;
      for (const el of elementsAtPoint) {
        const bId = el.getAttribute('data-bucket-id');
        if (bId && bId.startsWith(isP1 ? 'p1-' : 'p2-')) {
          matchedBucketId = bId;
          break;
        }
      }

      if (matchedBucketId) {
        // e.g. "p1-circle" -> parse shape ID "circle"
        const targetShapeId = matchedBucketId.substring(3);
        const isCorrect = item.shape.id === targetShapeId;

        if (isCorrect) {
          // Yay! Correctly sorted shape
          if (isP1) {
            setScore1((s) => s + 10);
            setBucketCounts1((prev) => ({ ...prev, [item.shape.id]: (prev[item.shape.id] || 0) + 1 }));
            setFalling1((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: 'correct', offsetX, offsetY } : it))
            );
          } else {
            setScore2((s) => s + 10);
            setBucketCounts2((prev) => ({ ...prev, [item.shape.id]: (prev[item.shape.id] || 0) + 1 }));
            setFalling2((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: 'correct', offsetX, offsetY } : it))
            );
          }
        } else {
          // Incorrect bucket! Let it enter slightly and come out
          if (isP1) {
            setFalling1((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: 'incorrect', offsetX, offsetY } : it))
            );
          } else {
            setFalling2((prev) =>
              prev.map((it) => (it.id === id ? { ...it, status: 'incorrect', offsetX, offsetY } : it))
            );
          }
        }
      } else {
        // Dropped outside a bucket: smoothly slide back to track
        if (isP1) {
          setFalling1((prev) =>
            prev.map((it) => (it.id === id ? { ...it, status: 'resetting', offsetX, offsetY } : it))
          );
        } else {
          setFalling2((prev) =>
            prev.map((it) => (it.id === id ? { ...it, status: 'resetting', offsetX, offsetY } : it))
          );
        }
      }
    }

    setDragState(null);
  };

  const handleAnimationComplete = (item: FallingItem, player: 1 | 2) => {
    if (item.status === 'correct') {
      if (player === 1) {
        setFalling1((prev) => prev.filter((it) => it.id !== item.id));
      } else {
        setFalling2((prev) => prev.filter((it) => it.id !== item.id));
      }
    } else if (item.status === 'incorrect' || item.status === 'resetting') {
      if (player === 1) {
        setFalling1((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'falling', offsetX: 0, offsetY: 0 } : it))
        );
      } else {
        setFalling2((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'falling', offsetX: 0, offsetY: 0 } : it))
        );
      }
    }
  };

  const getStars = () => {
    const totalScore = score1 + score2;
    if (totalScore >= 160) return 5;
    if (totalScore >= 110) return 4;
    if (totalScore >= 70) return 3;
    if (totalScore >= 30) return 2;
    return 1;
  };

  const getWinnerText = () => {
    if (score1 > score2) return '1P 승리! 🎉';
    if (score2 > score1) return '2P 승리! 🎉';
    return '무승부! 🤝';
  };

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header title="모양대로 정리해요!" onHome={onHome} stars={getStars()} />

      {/* Main Game Frame (Responsive Grid columns that never overlap or cut off) */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-stretch select-none w-full">
        
        {/* P1 Drag Canvas */}
        <div className="flex-1 flex flex-col bg-white border-2 border-blue-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-blue-50/70 px-2 sm:px-4 py-2 border-b border-blue-100 flex items-center justify-between">
            <span className="text-blue-900 font-extrabold text-[10px] sm:text-xs">
              🔵 1P 영역 (드래그)
            </span>
            <span className="bg-white text-blue-600 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black shadow-2xs">
              {score1}점
            </span>
          </div>

          {/* Falling Area */}
          <div className="relative w-full h-[280px] bg-blue-50/20 border-b border-stone-100 z-10">
            {falling1.map((it) => {
              const isBeingDragged = dragState?.id === it.id && dragState?.player === 1;
              
              let animateTarget: any = {};
              let transition: any = { type: 'spring', damping: 25, stiffness: 180 };
              
              if (isBeingDragged && dragState) {
                animateTarget = {
                  x: dragState.offsetX,
                  y: dragState.offsetY,
                  scale: 1.18,
                  opacity: 1,
                };
                transition = { type: 'just' };
              } else if (it.status === 'correct') {
                animateTarget = {
                  x: it.offsetX ?? 0,
                  y: (it.offsetY ?? 0) + 60,
                  scale: 0.2,
                  opacity: 0,
                };
                transition = { duration: 0.4, ease: 'easeIn' };
              } else if (it.status === 'incorrect') {
                animateTarget = {
                  x: [it.offsetX ?? 0, (it.offsetX ?? 0) - 12, (it.offsetX ?? 0) + 12, (it.offsetX ?? 0) - 12, (it.offsetX ?? 0) + 12, 0],
                  y: [it.offsetY ?? 0, it.offsetY ?? 0, it.offsetY ?? 0, it.offsetY ?? 0, it.offsetY ?? 0, 0],
                  scale: [1.1, 1.1, 1.1, 1.1, 1.1, 1],
                };
                transition = { duration: 0.6, times: [0, 0.2, 0.4, 0.6, 0.8, 1], ease: 'easeInOut' };
              } else if (it.status === 'resetting') {
                animateTarget = {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                };
                transition = { type: 'spring', damping: 20, stiffness: 150 };
              } else {
                animateTarget = {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                };
              }

              return (
                <motion.div
                  key={it.id}
                  onPointerDown={(e) => handlePointerDown(e, 1, it)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{
                    position: 'absolute',
                    left: `${it.xPercent}%`,
                    top: `${it.startYPercent}%`,
                    width: '48px',
                    height: '48px',
                    touchAction: 'none',
                    zIndex: isBeingDragged ? 50 : (it.status === 'correct' || it.status === 'incorrect' ? 30 : 10),
                  }}
                  animate={animateTarget}
                  transition={transition}
                  onAnimationComplete={() => handleAnimationComplete(it, 1)}
                  className={`cursor-grab active:cursor-grabbing rounded-xl flex items-center justify-center ${
                    isBeingDragged ? 'shadow-md ring-2 ring-blue-400 bg-white/40' : ''
                  }`}
                >
                  <ShapeSvg shapeId={it.shape.id} size={42} color={it.color} className="pointer-events-none" />
                </motion.div>
              );
            })}
          </div>

          {/* Buckets Area P1 */}
          <div className="grid grid-cols-4 bg-stone-50 border-t border-stone-100 divide-x divide-stone-200/50 relative z-20">
            {types.map((t) => (
              <div
                key={`b1-${t.id}`}
                data-bucket-id={`p1-${t.id}`}
                className="flex flex-col items-center justify-center py-2 sm:py-3.5 hover:bg-stone-100/50 transition-colors"
              >
                <div className="pointer-events-none scale-75 sm:scale-100 opacity-80">
                  <ShapeSvg shapeId={t.id} size={28} className="w-5 h-5 sm:w-9 sm:h-9" color="#8795a1" />
                </div>
                <span className="text-[8px] sm:text-[10px] font-black text-stone-400 mt-0.5 sm:mt-1 uppercase pointer-events-none">
                  {t.name}
                </span>
                <span className="text-[9px] sm:text-xs font-black text-blue-600 bg-blue-50 px-1 sm:px-2 py-0.5 rounded border border-blue-100 mt-1 pointer-events-none">
                  {bucketCounts1[t.id] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel (Timer / Overall Stats) */}
        <div className="bg-amber-50/40 p-1.5 sm:p-4 border border-stone-200 rounded-3xl flex flex-col justify-center items-center gap-2 sm:gap-4 min-w-[65px] sm:min-w-[130px] shadow-sm self-center">
          <div className="text-center">
            <span className="text-[9px] font-black text-stone-400 tracking-wider block mb-0.5 sm:mb-1">
              시간
            </span>
            <div className={`text-sm sm:text-2xl font-black tabular-nums ${secLeft <= 10 ? 'text-rose-600 animate-pulse' : 'text-stone-800'}`}>
              {secLeft}초
            </div>
          </div>

          <div className="w-6 h-px bg-stone-200 sm:w-12 my-1" />

          <div className="text-center">
            <span className="text-[8px] sm:text-[9px] font-black text-blue-500 uppercase block">1P 점수</span>
            <div className="text-xs sm:text-lg font-black text-blue-600 tabular-nums">{score1}</div>
          </div>

          <div className="w-6 h-px bg-stone-200 sm:w-12 my-1" />

          <div className="text-center">
            <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase block">2P 점수</span>
            <div className="text-xs sm:text-lg font-black text-rose-600 tabular-nums">{score2}</div>
          </div>
        </div>

        {/* P2 Drag Canvas */}
        <div className="flex-1 flex flex-col bg-white border-2 border-rose-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-rose-50/70 px-2 sm:px-4 py-2 border-b border-rose-100 flex items-center justify-between">
            <span className="text-rose-900 font-extrabold text-[10px] sm:text-xs">
              🔴 2P 영역 (드래그)
            </span>
            <span className="bg-white text-rose-600 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black shadow-2xs">
              {score2}점
            </span>
          </div>

          {/* Falling Area */}
          <div className="relative w-full h-[280px] bg-rose-50/20 border-b border-stone-100 z-10">
            {falling2.map((it) => {
              const isBeingDragged = dragState?.id === it.id && dragState?.player === 2;
              
              let animateTarget: any = {};
              let transition: any = { type: 'spring', damping: 25, stiffness: 180 };
              
              if (isBeingDragged && dragState) {
                animateTarget = {
                  x: dragState.offsetX,
                  y: dragState.offsetY,
                  scale: 1.18,
                  opacity: 1,
                };
                transition = { type: 'just' };
              } else if (it.status === 'correct') {
                animateTarget = {
                  x: it.offsetX ?? 0,
                  y: (it.offsetY ?? 0) + 60,
                  scale: 0.2,
                  opacity: 0,
                };
                transition = { duration: 0.4, ease: 'easeIn' };
              } else if (it.status === 'incorrect') {
                animateTarget = {
                  x: [it.offsetX ?? 0, (it.offsetX ?? 0) - 12, (it.offsetX ?? 0) + 12, (it.offsetX ?? 0) - 12, (it.offsetX ?? 0) + 12, 0],
                  y: [it.offsetY ?? 0, it.offsetY ?? 0, it.offsetY ?? 0, it.offsetY ?? 0, it.offsetY ?? 0, 0],
                  scale: [1.1, 1.1, 1.1, 1.1, 1.1, 1],
                };
                transition = { duration: 0.6, times: [0, 0.2, 0.4, 0.6, 0.8, 1], ease: 'easeInOut' };
              } else if (it.status === 'resetting') {
                animateTarget = {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                };
                transition = { type: 'spring', damping: 20, stiffness: 150 };
              } else {
                animateTarget = {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: 1,
                };
              }

              return (
                <motion.div
                  key={it.id}
                  onPointerDown={(e) => handlePointerDown(e, 2, it)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{
                    position: 'absolute',
                    left: `${it.xPercent}%`,
                    top: `${it.startYPercent}%`,
                    width: '48px',
                    height: '48px',
                    touchAction: 'none',
                    zIndex: isBeingDragged ? 50 : (it.status === 'correct' || it.status === 'incorrect' ? 30 : 10),
                  }}
                  animate={animateTarget}
                  transition={transition}
                  onAnimationComplete={() => handleAnimationComplete(it, 2)}
                  className={`cursor-grab active:cursor-grabbing rounded-xl flex items-center justify-center ${
                    isBeingDragged ? 'shadow-md ring-2 ring-rose-400 bg-white/40' : ''
                  }`}
                >
                  <ShapeSvg shapeId={it.shape.id} size={42} color={it.color} className="pointer-events-none" />
                </motion.div>
              );
            })}
          </div>

          {/* Buckets Area P2 */}
          <div className="grid grid-cols-4 bg-stone-50 border-t border-stone-100 divide-x divide-stone-200/50 relative z-20">
            {types.map((t) => (
              <div
                key={`b2-${t.id}`}
                data-bucket-id={`p2-${t.id}`}
                className="flex flex-col items-center justify-center py-2 sm:py-3.5 hover:bg-stone-100/50 transition-colors"
              >
                <div className="pointer-events-none scale-75 sm:scale-100 opacity-80">
                  <ShapeSvg shapeId={t.id} size={28} className="w-5 h-5 sm:w-9 sm:h-9" color="#8795a1" />
                </div>
                <span className="text-[8px] sm:text-[10px] font-black text-stone-400 mt-0.5 sm:mt-1 uppercase pointer-events-none">
                  {t.name}
                </span>
                <span className="text-[9px] sm:text-xs font-black text-rose-600 bg-rose-50 px-1 sm:px-2 py-0.5 rounded border border-rose-100 mt-1 pointer-events-none">
                  {bucketCounts2[t.id] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Game Over Popup */}
      <AnimatePresence>
        {gameOver && (
          <div className="fixed inset-0 bg-stone-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border-2 border-amber-300 rounded-3xl p-8 max-w-sm w-full text-center shadow-xl"
            >
              <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-black text-stone-800 mb-2">정리 놀이 종료!</h3>
              
              <div className="text-base font-black text-teal-700 bg-teal-50 border-2 border-teal-100 px-6 py-3 rounded-2xl inline-block mb-6 shadow-sm">
                결과: {getWinnerText()}
              </div>

              <div className="grid grid-cols-2 gap-4 border border-stone-200/60 p-4 rounded-2xl bg-stone-50/80 mb-6">
                <div>
                  <span className="text-[11px] font-extrabold text-stone-400 uppercase">1P 최종점수</span>
                  <div className="text-2xl font-black text-blue-600">{score1}점</div>
                </div>
                <div className="border-l border-stone-200">
                  <span className="text-[11px] font-extrabold text-stone-400 uppercase">2P 최종점수</span>
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
