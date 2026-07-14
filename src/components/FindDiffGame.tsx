import React, { useState, useEffect, useRef } from 'react';
import { GameMode, Shape, Point, Difficulty } from '../types';
import { SHAPES, COLS, shuffle, rnd } from '../utils/shapes';
import { Header } from './Header';
import { ShapeSvg } from './ShapeSvg';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ChevronRight, AlertCircle, Sparkles, Trophy, Zap, RotateCcw, Play } from 'lucide-react';

interface FindDiffGameProps {
  onHome: () => void;
}

interface DiffItemState {
  shape: Shape;
  color: string;
  rotation: 0 | 90 | 180 | 270;
  isOdd: boolean;
  isFound: boolean;
  shake: boolean;
}

export const FindDiffGame: React.FC<FindDiffGameProps> = ({ onHome }) => {
  // Game mode selection: '1P' (Single) or '2P' (Battle)
  const [playMode, setPlayMode] = useState<'1P' | '2P' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  // --- 1P States ---
  const [items, setItems] = useState<DiffItemState[]>([]);
  const [correctCount, setCorrectCount] = useState(0); // 0 to 5 (maps to 5 stars)
  const [roundWon, setRoundWon] = useState(false);
  const [victory1P, setVictory1P] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [diffType, setDiffType] = useState<'shape' | 'color' | 'rotation'>('shape');

  // --- 2P States ---
  const [p1Items, setP1Items] = useState<DiffItemState[]>([]);
  const [p2Items, setP2Items] = useState<DiffItemState[]>([]);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1RoundWinner, setP1RoundWinner] = useState(false);
  const [p2RoundWinner, setP2RoundWinner] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [battleActive, setBattleActive] = useState(false);

  // Difference description text for single-player hints
  const [diffText, setDiffText] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Helper to Generate Items with 3 Types of Differences ---
  const generateDiffRound = (count: number, allowRotation: boolean) => {
    // Difference types:
    // - 'shape': same color, different shape, upright (rotation 0)
    // - 'color': same shape, different color, upright (rotation 0)
    const availableTypes: ('shape' | 'color')[] = ['shape', 'color'];
    const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

    const shuffledShapes = shuffle(SHAPES);
    const majorityShape = shuffledShapes[0];
    
    // Choose an odd shape that is distinct
    let oddShape = shuffledShapes[1];
    if (oddShape.id === majorityShape.id && shuffledShapes.length > 2) {
      oddShape = shuffledShapes[2];
    }

    const majorityColor = COLS[Math.floor(rnd(0, COLS.length))];
    const otherColors = COLS.filter((c) => c !== majorityColor);
    const oddColor = otherColors[Math.floor(rnd(0, otherColors.length))];

    const oddIdx = Math.floor(rnd(0, count));

    const rawItems = Array.from({ length: count }, (_, i) => {
      const isOdd = i === oddIdx;

      let shape = majorityShape;
      let color = majorityColor;
      let rotation: 0 | 90 | 180 | 270 = 0;

      if (selectedType === 'shape') {
        shape = isOdd ? oddShape : majorityShape;
      } else if (selectedType === 'color') {
        color = isOdd ? oddColor : majorityColor;
      }

      return {
        shape,
        color,
        rotation,
        isOdd,
        isFound: false,
        shake: false,
      };
    });

    return { rawItems, selectedType };
  };

  // --- 1P Game Logic ---
  const startSingleGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setCorrectCount(0);
    setVictory1P(false);
    setRoundWon(false);
    setErrorMsg('');
    init1PRound(diff);
  };

  const init1PRound = (diff: Difficulty) => {
    setRoundWon(false);
    setErrorMsg('');
    const count = diff === 'easy' ? 6 : 12;
    // Easy mode does shape or color differences. Hard mode adds rotation differences!
    const { rawItems, selectedType } = generateDiffRound(count, diff === 'hard');
    
    setItems(rawItems);
    setDiffType(selectedType);

    if (selectedType === 'shape') {
      setDiffText('모양이 다르게 생긴 하나를 찾아요!');
    } else if (selectedType === 'color') {
      setDiffText('색깔이 다르게 생긴 하나를 찾아요!');
    } else {
      setDiffText('빙글빙글 혼자만 방향이 삐뚤어진 하나를 찾아요!');
    }
  };

  const handle1PTap = (idx: number) => {
    if (roundWon || victory1P) return;
    const item = items[idx];

    if (item.isOdd) {
      // Correct shape found!
      setRoundWon(true);
      setErrorMsg('');
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, isFound: true } : it))
      );

      const nextCount = correctCount + 1;
      setCorrectCount(nextCount);

      // Auto-advance logic
      setTimeout(() => {
        if (nextCount >= 5) {
          setVictory1P(true);
        } else {
          init1PRound(difficulty!);
        }
      }, 1300);
    } else {
      // Shake incorrect item
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, shake: true } : it))
      );
      setErrorMsg('아쉬워요! 다른 모양을 다시 찾아봐요!');
      setTimeout(() => {
        setItems((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, shake: false } : it))
        );
      }, 400);
    }
  };

  // --- 2P Game Logic ---
  const startBattleGame = () => {
    setPlayMode('2P');
    setP1Score(0);
    setP2Score(0);
    setP1RoundWinner(false);
    setP2RoundWinner(false);
    setTimeLeft(45);
    setBattleActive(true);
    generateNextBattleRound();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setBattleActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateNextBattleRound = () => {
    setP1RoundWinner(false);
    setP2RoundWinner(false);

    // Grid of 6 cards for fast 2P matching
    const p1Data = generateDiffRound(6, true);
    const p2Data = generateDiffRound(6, true);

    setP1Items(p1Data.rawItems);
    setP2Items(p2Data.rawItems);
  };

  const handle2PTap = (player: 1 | 2, idx: number) => {
    if (!battleActive || p1RoundWinner || p2RoundWinner) return;

    if (player === 1) {
      const item = p1Items[idx];
      if (item.isOdd) {
        // Player 1 wins round!
        setP1RoundWinner(true);
        setP1Score((s) => s + 10);
        setP1Items((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, isFound: true } : it))
        );
        setTimeout(() => {
          generateNextBattleRound();
        }, 1200);
      } else {
        // Shake incorrect card
        setP1Items((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, shake: true } : it))
        );
        setTimeout(() => {
          setP1Items((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, shake: false } : it))
          );
        }, 400);
      }
    } else {
      const item = p2Items[idx];
      if (item.isOdd) {
        // Player 2 wins round!
        setP2RoundWinner(true);
        setP2Score((s) => s + 10);
        setP2Items((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, isFound: true } : it))
        );
        setTimeout(() => {
          generateNextBattleRound();
        }, 1200);
      } else {
        // Shake incorrect card
        setP2Items((prev) =>
          prev.map((it, i) => (i === idx ? { ...it, shake: true } : it))
        );
        setTimeout(() => {
          setP2Items((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, shake: false } : it))
          );
        }, 400);
      }
    }
  };

  const resetAll = () => {
    setPlayMode(null);
    setDifficulty(null);
    setCorrectCount(0);
    setVictory1P(false);
    setRoundWon(false);
    setBattleActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // --- SELECTION SCREEN ---
  if (!playMode) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Header title="다른 모양을 찾아요!" onHome={onHome} stars={0} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center mt-6 select-none bg-white p-8 rounded-3xl border border-stone-200 max-w-lg w-full shadow-sm"
        >
          <h2 className="text-xl sm:text-2xl font-black text-stone-800 mb-2">
            게임 모드를 골라요!
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mb-8 font-medium">
            혼자서 차분히 연습하거나 친구와 대결 모드로 모양 찾기를 즐길 수 있습니다.
          </p>

          <div className="flex flex-col gap-4 w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setPlayMode('1P')}
              className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-100 hover:border-amber-200 rounded-2xl cursor-pointer shadow-2xs flex items-center gap-4 text-left"
            >
              <div className="text-4xl bg-amber-100 p-3 rounded-2xl">🧐</div>
              <div>
                <div className="font-extrabold text-stone-800 text-sm sm:text-base">혼자서 찾기 (1인용)</div>
                <div className="text-[11px] sm:text-xs text-stone-400 font-medium mt-0.5">
                  5단계를 모두 통과하여 관찰력 별 5개를 모아요!
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={startBattleGame}
              className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100 hover:border-blue-200 rounded-2xl cursor-pointer shadow-2xs flex items-center gap-4 text-left"
            >
              <div className="text-4xl bg-blue-100 p-3 rounded-2xl">⚡</div>
              <div>
                <div className="font-extrabold text-stone-800 text-sm sm:text-base">대결하며 찾기 (2인용)</div>
                <div className="text-[11px] sm:text-xs text-stone-400 font-medium mt-0.5">
                  누가 더 많이 찾아낼까요? 친구나 부모님과 함께 경쟁해 보세요!
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 1P DIFFICULTY SELECTION SCREEN ---
  if (playMode === '1P' && !difficulty) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Header title="다른 모양을 찾아요!" onHome={onHome} stars={0} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center mt-6 select-none bg-white p-8 rounded-3xl border border-stone-200 max-w-lg w-full shadow-sm"
        >
          <div className="mb-4">
            <button
              onClick={() => setPlayMode(null)}
              className="text-xs font-semibold px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-all"
            >
              ◀ 모드 선택으로
            </button>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-black text-stone-800 mb-2">
            난이도를 선택해요!
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mb-8 font-medium">
            아이의 연령과 숙련도에 맞춰 난이도를 조절해 보세요.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startSingleGame('easy')}
              className="flex-1 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 hover:border-emerald-200 rounded-2xl cursor-pointer shadow-sm text-center"
            >
              <div className="text-4xl mb-3">😊</div>
              <div className="font-black text-stone-800 text-sm sm:text-base">쉬운 난이도</div>
              <div className="text-[11px] sm:text-xs text-stone-400 font-bold mt-1">도형 6개 중 다른 것 찾기</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startSingleGame('hard')}
              className="flex-1 p-6 bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-100 hover:border-rose-200 rounded-2xl cursor-pointer shadow-sm text-center"
            >
              <div className="text-4xl mb-3">🔥</div>
              <div className="font-black text-stone-800 text-sm sm:text-base">어려운 난이도</div>
              <div className="text-[11px] sm:text-xs text-stone-400 font-bold mt-1">도형 12개 & 방향 회전 포함</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 1P SINGLE GAME INTERFACE ---
  if (playMode === '1P') {
    return (
      <div className="flex flex-col min-h-[480px]">
        <Header
          title={`다른 모양을 찾아요! (${difficulty === 'easy' ? '쉬움' : '어려움'})`}
          onHome={onHome}
          onSelectCategory={() => setDifficulty(null)}
          stars={correctCount} // Progressive stars from 0 to 5!
        />

        {/* Victory Screen */}
        {victory1P ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center my-6 select-none bg-white p-8 rounded-3xl border border-stone-200 shadow-sm"
          >
            <div className="relative mb-4">
              <Trophy className="w-20 h-20 text-yellow-400 animate-bounce" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow"
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-3">
              우와! 완벽한 관찰 왕이에요! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mb-8 font-bold leading-relaxed max-w-md">
              모든 단계를 성공하여 별 5개를 획득하셨습니다! 대단한 관찰력과 멋진 도형 인지 능력을 갖고 계시네요!
            </p>

            <div className="flex flex-wrap gap-4 w-full justify-center">
              <button
                onClick={() => startSingleGame(difficulty!)}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                다시 도전하기 🔁
              </button>
              <button
                onClick={resetAll}
                className="px-6 py-3 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
              >
                모드 선택으로 ◀
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm flex flex-col mb-4 select-none">
              <div className="bg-amber-50/50 px-4 py-4 border-b border-stone-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-stone-700">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="font-black text-xs sm:text-sm leading-relaxed">
                    여러 도형들 중에 <span className="text-amber-600 font-black">{diffText}</span> 찾아 누르세요! ({correctCount}/5 단계)
                  </span>
                </div>
              </div>

              {/* Grid Area */}
              <div className="relative bg-amber-50/10 p-6 sm:p-8 min-h-[220px]">
                <div className={`grid ${difficulty === 'easy' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'} gap-4 sm:gap-6 justify-items-center`}>
                  {items.map((it, idx) => (
                    <motion.div
                      key={`diff-${idx}`}
                      onClick={() => handle1PTap(idx)}
                      animate={
                        it.shake
                          ? { x: [0, -10, 10, -8, 8, -5, 5, 0] }
                          : it.isFound
                          ? { scale: [1, 1.25, 1.15], rotate: [0, 360] }
                          : { scale: 1 }
                      }
                      whileHover={!it.isFound && !roundWon ? { scale: 1.08, y: -2 } : {}}
                      whileTap={!it.isFound && !roundWon ? { scale: 0.95 } : {}}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`relative p-5 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-stone-200 shadow-sm flex items-center justify-center cursor-pointer select-none transition-all ${
                        it.isFound
                          ? 'ring-4 ring-teal-400 ring-offset-2 z-10 scale-105 bg-teal-50/20'
                          : roundWon
                          ? 'pointer-events-none'
                          : 'hover:shadow-md'
                      }`}
                    >
                      {/* Applying rotation class cleanly only to SVG container */}
                      <div className={`transition-transform duration-300 ${
                        it.rotation === 90 ? 'rotate-90' : it.rotation === 180 ? 'rotate-180' : it.rotation === 270 ? 'rotate-270' : ''
                      }`}>
                        <ShapeSvg shapeId={it.shape.id} size={58} color={it.color} />
                      </div>

                      {it.isFound && (
                        <div className="absolute inset-0 flex items-center justify-center bg-teal-500/10 rounded-2xl">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-teal-500 text-white rounded-full p-1.5 shadow"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Round Success Overlay */}
                <AnimatePresence>
                  {roundWon && !victory1P && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center pointer-events-none p-4"
                    >
                      <motion.div
                        initial={{ scale: 0.8, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-teal-500 text-white font-black text-sm sm:text-base px-8 py-4 rounded-3xl shadow-lg flex items-center gap-3"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-200" />
                        <span>정답이에요! 다음 단계로 가요! 🌟</span>
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
                onClick={() => init1PRound(difficulty)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 font-bold text-stone-700 text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-4 h-4 text-stone-400" />
                <span>새로 섞기</span>
              </button>

              <button
                onClick={resetAll}
                className="px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                모드 선택으로
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- 2P BATTLE GAME INTERFACE ---
  const total2PStars = () => {
    const total = p1Score + p2Score;
    if (total >= 100) return 5;
    if (total >= 70) return 4;
    if (total >= 40) return 3;
    if (total >= 20) return 2;
    return 1;
  };

  return (
    <div className="flex flex-col min-h-[480px]">
      <Header
        title="다른 모양을 찾아요! 대결 모드"
        onHome={onHome}
        stars={total2PStars()}
      />

      {!battleActive ? (
        // Battle End / Result Leaderboard Screen
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center my-4 bg-white p-8 rounded-3xl border-2 border-stone-200 shadow-sm select-none"
        >
          <Trophy className="w-20 h-20 text-yellow-400 animate-bounce mb-3" />
          <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-1">대결 종료!</h2>
          <p className="text-xs sm:text-sm text-stone-400 mb-6 font-semibold">최종 득점 결과는 어떻게 되었을까요?</p>

          <div className="flex items-center justify-around gap-8 w-full max-w-md mb-8">
            <div className="flex flex-col items-center p-5 bg-blue-50/70 border-2 border-blue-100 rounded-2xl w-32">
              <span className="text-3xl">🔵</span>
              <span className="font-extrabold text-blue-900 text-xs sm:text-sm mt-1">1P 점수</span>
              <span className="font-black text-2xl text-blue-600 mt-1">{p1Score}</span>
            </div>

            <div className="text-3xl font-black text-stone-400">VS</div>

            <div className="flex flex-col items-center p-5 bg-rose-50/70 border-2 border-rose-100 rounded-2xl w-32">
              <span className="text-3xl">🔴</span>
              <span className="font-extrabold text-rose-900 text-xs sm:text-sm mt-1">2P 점수</span>
              <span className="font-black text-2xl text-rose-600 mt-1">{p2Score}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-stone-800 text-base sm:text-lg font-black mb-8 px-8">
            {p1Score > p2Score ? (
              <span className="text-blue-600">🔵 1P가 승리했습니다! 아주 민첩하네요! 🎉</span>
            ) : p2Score > p1Score ? (
              <span className="text-rose-600">🔴 2P가 승리했습니다! 아주 민첩하네요! 🎉</span>
            ) : (
              <span className="text-amber-600">🤝 무승부! 둘 다 훌륭한 관찰력입니다!</span>
            )}
          </div>

          <div className="flex gap-4 w-full justify-center">
            <button
              onClick={startBattleGame}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-md shadow-amber-500/20"
            >
              다시 대결하기 ⚡
            </button>
            <button
              onClick={resetAll}
              className="px-6 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold text-xs sm:text-sm transition-all cursor-pointer"
            >
              모드 선택으로 ◀
            </button>
          </div>
        </motion.div>
      ) : (
        // Active Battle screen
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-stretch select-none w-full">
          
          {/* P1 Field (Blue, Left side) */}
          <div className="flex-1 flex flex-col bg-white border-2 border-blue-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-blue-50/70 px-2 sm:px-4 py-2 sm:py-3 border-b border-blue-100 flex items-center justify-between">
              <span className="text-blue-900 font-black text-[10px] sm:text-xs">
                🔵 1P 영역 (다른 모양 찾기!)
              </span>
              <div className="text-blue-600 font-black text-[10px] sm:text-xs bg-white px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shadow-2xs">
                {p1Score}점
              </div>
            </div>

            <div className="relative flex-1 p-2 sm:p-4 bg-blue-50/5 min-h-[140px] sm:min-h-[180px]">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 justify-items-center">
                {p1Items.map((it, idx) => (
                  <motion.div
                    key={`p1-diff-${idx}`}
                    onClick={() => handle2PTap(1, idx)}
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
                    className={`relative p-1.5 w-11 h-11 xs:w-14 xs:h-14 sm:p-4 sm:w-20 sm:h-20 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center cursor-pointer ${
                      it.isFound ? 'pointer-events-none bg-stone-50' : 'hover:shadow-2xs'
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${
                      it.rotation === 90 ? 'rotate-90' : it.rotation === 180 ? 'rotate-180' : it.rotation === 270 ? 'rotate-270' : ''
                    }`}>
                      <ShapeSvg shapeId={it.shape.id} size={36} className="w-7 h-7 sm:w-11 sm:h-11" color={it.color} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* P1 Round Success Banner */}
              <AnimatePresence>
                {p1RoundWinner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-blue-500/85 flex flex-col items-center justify-center text-white p-1"
                  >
                    <Zap className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300 animate-bounce mb-1" />
                    <span className="text-xs sm:text-lg font-black text-center">내가 먼저 찾았어요! ⚡</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center Info Panel (Time countdown, rules) */}
          <div className="bg-amber-50/40 p-1.5 sm:p-4 border border-amber-200/50 rounded-3xl flex flex-col justify-center items-center gap-2 sm:gap-4 min-w-[65px] sm:min-w-[140px] shadow-sm select-none">
            <div className="text-center">
              <span className="text-[9px] font-extrabold text-stone-400 block tracking-wider uppercase">시간</span>
              <span className={`text-sm sm:text-3xl font-black tracking-tight ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-stone-800'}`}>
                {timeLeft}초
              </span>
            </div>

            <div className="w-6 h-px bg-stone-200 sm:w-12 my-1" />

            <div className="text-center hidden sm:block max-w-[100px]">
              <span className="text-[10px] font-black text-amber-800 leading-normal block">
                각자의 보드에서 <b className="text-amber-600">다른 것 한 개</b>를 가장 먼저 터치하세요!
              </span>
            </div>

            <div className="w-6 h-px bg-stone-200 sm:w-12 my-1 hidden sm:block" />

            <button
              onClick={resetAll}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 text-[10px] sm:text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              종료
            </button>
          </div>

          {/* P2 Field (Rose, Right side) */}
          <div className="flex-1 flex flex-col bg-white border-2 border-rose-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-rose-50/70 px-2 sm:px-4 py-2 sm:py-3 border-b border-rose-100 flex items-center justify-between">
              <span className="text-rose-900 font-black text-[10px] sm:text-xs">
                🔴 2P 영역 (다른 모양 찾기!)
              </span>
              <div className="text-rose-600 font-black text-[10px] sm:text-xs bg-white px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shadow-2xs">
                {p2Score}점
              </div>
            </div>

            <div className="relative flex-1 p-2 sm:p-4 bg-rose-50/5 min-h-[140px] sm:min-h-[180px]">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 justify-items-center">
                {p2Items.map((it, idx) => (
                  <motion.div
                    key={`p2-diff-${idx}`}
                    onClick={() => handle2PTap(2, idx)}
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
                    className={`relative p-1.5 w-11 h-11 xs:w-14 xs:h-14 sm:p-4 sm:w-20 sm:h-20 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center cursor-pointer ${
                      it.isFound ? 'pointer-events-none bg-stone-50' : 'hover:shadow-2xs'
                    }`}
                  >
                    <div className={`transition-transform duration-200 ${
                      it.rotation === 90 ? 'rotate-90' : it.rotation === 180 ? 'rotate-180' : it.rotation === 270 ? 'rotate-270' : ''
                    }`}>
                      <ShapeSvg shapeId={it.shape.id} size={36} className="w-7 h-7 sm:w-11 sm:h-11" color={it.color} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* P2 Round Success Banner */}
              <AnimatePresence>
                {p2RoundWinner && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-rose-500/85 flex flex-col items-center justify-center text-white p-1"
                  >
                    <Zap className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-300 animate-bounce mb-1" />
                    <span className="text-xs sm:text-lg font-black text-center">내가 먼저 찾았어요! ⚡</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
